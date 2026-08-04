import "server-only";
import { createSessionToken, hashPassword, hashToken } from "./security";
import { getDatabase, queryOne } from "./database";
import { writeAuditEvent } from "./audit";
import { sendTransactionalEmail } from "./mail";

export async function requestPasswordReset(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const user = await queryOne<{ id: string; email: string }>(
    `SELECT id, email FROM atlas_users WHERE email = $1 AND disabled_at IS NULL`,
    [normalized],
  );
  if (!user) return;
  const token = createSessionToken();
  const tokenHash = hashToken(token);
  await getDatabase().query(
    `INSERT INTO atlas_password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + interval '30 minutes')`,
    [user.id, tokenHash],
  );
  const baseUrl = process.env.ATLAS_APP_URL;
  if (!baseUrl?.startsWith("https://")) return;
  await sendTransactionalEmail({
    to: user.email,
    subject: "Réinitialisation de votre accès ATLAS",
    html: `<p>Une demande de réinitialisation a été reçue.</p><p><a href="${baseUrl}/reinitialiser?token=${encodeURIComponent(token)}">Choisir un nouveau mot de passe</a></p><p>Ce lien expire dans 30 minutes. Ignorez ce message si vous n’êtes pas à l’origine de la demande.</p>`,
  });
  await writeAuditEvent({
    actorUserId: user.id,
    action: "password_reset.requested",
    targetType: "user",
    targetId: user.id,
    outcome: "success",
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  if (newPassword.length < 16) throw new Error("Le mot de passe doit contenir au moins 16 caractères.");
  const client = await getDatabase().connect();
  try {
    await client.query("BEGIN");
    const result = await client.query<{ id: string; user_id: string }>(
      `SELECT id, user_id FROM atlas_password_reset_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
       FOR UPDATE`,
      [hashToken(token)],
    );
    const reset = result.rows[0];
    if (!reset) throw new Error("Lien invalide ou expiré.");
    const passwordHash = await hashPassword(newPassword);
    await client.query(
      `UPDATE atlas_users SET password_hash = $2, updated_at = now() WHERE id = $1`,
      [reset.user_id, passwordHash],
    );
    await client.query(`UPDATE atlas_password_reset_tokens SET used_at = now() WHERE id = $1`, [reset.id]);
    await client.query(`UPDATE atlas_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, [reset.user_id]);
    await writeAuditEvent({
      actorUserId: reset.user_id,
      action: "password_reset.completed",
      targetType: "user",
      targetId: reset.user_id,
      outcome: "success",
    }, client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
