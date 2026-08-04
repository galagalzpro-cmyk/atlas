import { getDatabase } from "../lib/server/database.ts";
import { hashPassword } from "../lib/server/security.ts";
import { writeAuditEvent } from "../lib/server/audit.ts";

const email = process.env.ATLAS_BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ATLAS_BOOTSTRAP_ADMIN_PASSWORD;
const displayName = process.env.ATLAS_BOOTSTRAP_ADMIN_NAME?.trim() || "Administrateur ATLAS";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
if (!email || !email.includes("@")) throw new Error("ATLAS_BOOTSTRAP_ADMIN_EMAIL is required");
if (!password || password.length < 16) throw new Error("ATLAS_BOOTSTRAP_ADMIN_PASSWORD must contain at least 16 characters");

const database = getDatabase();
const client = await database.connect();

try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(41871503)");

  const existingAdmin = await client.query<{ id: string }>(
    "SELECT id FROM atlas_users WHERE platform_role = 'atlas_admin' LIMIT 1",
  );
  if (existingAdmin.rowCount) {
    throw new Error("An ATLAS administrator already exists; bootstrap is permanently locked");
  }

  const passwordHash = await hashPassword(password);
  const created = await client.query<{ id: string }>(
    `INSERT INTO atlas_users (email, password_hash, display_name, platform_role, email_verified_at)
     VALUES ($1, $2, $3, 'atlas_admin', now())
     RETURNING id`,
    [email, passwordHash, displayName],
  );
  const userId = created.rows[0]?.id;
  if (!userId) throw new Error("Administrator creation failed");

  await writeAuditEvent(
    {
      actorUserId: userId,
      action: "identity.bootstrap_admin",
      targetType: "user",
      targetId: userId,
      outcome: "success",
      metadata: { bootstrap: true },
    },
    client,
  );

  await client.query("COMMIT");
  console.log(`ATLAS administrator created for ${email}`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await database.end();
}
