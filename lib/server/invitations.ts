import "server-only";
import { getDatabase } from "./database";
import { hashPassword, hashToken } from "./security";
import { writeAuditEvent } from "./audit";

export async function registerFromInvitation(input: {
  token: string;
  displayName: string;
  password: string;
}): Promise<{ userId: string; organizationId: string }> {
  if (input.password.length < 16) throw new Error("Le mot de passe doit contenir au moins 16 caractères.");
  if (input.displayName.trim().length < 2) throw new Error("Nom requis.");
  const client = await getDatabase().connect();
  try {
    await client.query("BEGIN");
    const invitationResult = await client.query<{
      id: string;
      organization_id: string;
      email: string;
      role: "professional" | "organization_admin";
    }>(
      `SELECT id, organization_id, email, role
       FROM atlas_organization_invitations
       WHERE token_hash = $1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > now()
       FOR UPDATE`,
      [hashToken(input.token)],
    );
    const invitation = invitationResult.rows[0];
    if (!invitation) throw new Error("Invitation invalide ou expirée.");
    const passwordHash = await hashPassword(input.password);
    const userResult = await client.query<{ id: string }>(
      `INSERT INTO atlas_users (email, password_hash, display_name, platform_role, email_verified_at)
       VALUES (lower($1), $2, $3, 'professional', now())
       ON CONFLICT (email) DO UPDATE
         SET display_name = EXCLUDED.display_name,
             updated_at = now()
       RETURNING id`,
      [invitation.email, passwordHash, input.displayName.trim()],
    );
    const userId = userResult.rows[0]?.id;
    if (!userId) throw new Error("Création du compte impossible.");
    await client.query(
      `INSERT INTO atlas_organization_memberships (organization_id, user_id, role, status)
       VALUES ($1, $2, $3, 'active')
       ON CONFLICT (organization_id, user_id)
       DO UPDATE SET role = EXCLUDED.role, status = 'active'`,
      [invitation.organization_id, userId, invitation.role],
    );
    await client.query(`UPDATE atlas_organization_invitations SET accepted_at = now() WHERE id = $1`, [invitation.id]);
    await writeAuditEvent({
      actorUserId: userId,
      organizationId: invitation.organization_id,
      action: "organization.invitation.registered",
      targetType: "organization_invitation",
      targetId: invitation.id,
      outcome: "success",
    }, client);
    await client.query("COMMIT");
    return { userId, organizationId: invitation.organization_id };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
