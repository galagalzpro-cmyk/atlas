import "server-only";
import { getDatabase, queryMany, queryOne } from "./database";
import { createSessionToken, hashToken } from "./security";
import { writeAuditEvent } from "./audit";
import { encodeTestInvitation, isAtlasTestMode } from "./test-mode";

export interface AtlasOrganizationSummary {
  id: string;
  name: string;
  slug: string;
  status: "trial" | "active" | "suspended" | "closed";
  role: "professional" | "organization_admin";
}

const TEST_ORGANIZATION: AtlasOrganizationSummary = {
  id: "atlas-test-organization",
  name: "Cabinet ATLAS — Démonstration",
  slug: "cabinet-atlas-test",
  status: "trial",
  role: "organization_admin",
};

export async function listOrganizationsForUser(userId: string): Promise<AtlasOrganizationSummary[]> {
  if (isAtlasTestMode()) {
    if (userId === "test-organization-admin" || userId === "test-atlas-admin") return [{ ...TEST_ORGANIZATION }];
    if (userId === "test-professional") return [{ ...TEST_ORGANIZATION, role: "professional" }];
    return [];
  }
  return queryMany<AtlasOrganizationSummary>(
    `SELECT o.id, o.name, o.slug, o.status, m.role
     FROM atlas_organization_memberships m
     JOIN atlas_organizations o ON o.id = m.organization_id
     WHERE m.user_id = $1 AND m.status = 'active'
     ORDER BY o.name`,
    [userId],
  );
}

export async function createOrganization(input: { name: string; slug: string; actorUserId: string }): Promise<string> {
  const normalizedSlug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  if (!input.name.trim() || normalizedSlug.length < 3) throw new Error("Invalid organization identity");
  if (isAtlasTestMode()) return `test-${normalizedSlug}`;

  const client = await getDatabase().connect();
  try {
    await client.query("BEGIN");
    const created = await client.query<{ id: string }>(
      `INSERT INTO atlas_organizations (name, slug, created_by) VALUES ($1, $2, $3) RETURNING id`,
      [input.name.trim(), normalizedSlug, input.actorUserId],
    );
    const organizationId = created.rows[0]?.id;
    if (!organizationId) throw new Error("Organization creation failed");
    await client.query(
      `INSERT INTO atlas_organization_memberships (organization_id, user_id, role, status)
       VALUES ($1, $2, 'organization_admin', 'active')`,
      [organizationId, input.actorUserId],
    );
    await writeAuditEvent({ actorUserId: input.actorUserId, organizationId, action: "organization.created", targetType: "organization", targetId: organizationId, outcome: "success", metadata: { slug: normalizedSlug } }, client);
    await client.query("COMMIT");
    return organizationId;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function inviteOrganizationMember(input: {
  organizationId: string;
  email: string;
  role: "professional" | "organization_admin";
  actorUserId: string;
}): Promise<string> {
  if (isAtlasTestMode()) return encodeTestInvitation({ email: input.email, role: input.role });

  const permission = await queryOne<{ allowed: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM atlas_organization_memberships WHERE organization_id = $1 AND user_id = $2 AND role = 'organization_admin' AND status = 'active') AS allowed`,
    [input.organizationId, input.actorUserId],
  );
  if (!permission?.allowed) throw new Error("Organization administrator role required");
  const token = createSessionToken();
  await getDatabase().query(
    `INSERT INTO atlas_organization_invitations (organization_id, email, role, token_hash, invited_by, expires_at)
     VALUES ($1, lower($2), $3, $4, $5, now() + interval '7 days')`,
    [input.organizationId, input.email.trim(), input.role, hashToken(token), input.actorUserId],
  );
  await writeAuditEvent({ actorUserId: input.actorUserId, organizationId: input.organizationId, action: "organization.invitation.created", targetType: "organization_invitation", outcome: "success", metadata: { role: input.role } });
  return token;
}

export async function acceptOrganizationInvitation(token: string, userId: string): Promise<string> {
  if (isAtlasTestMode()) return TEST_ORGANIZATION.id;
  const tokenHash = hashToken(token);
  const client = await getDatabase().connect();
  try {
    await client.query("BEGIN");
    const invitation = await client.query<{ id: string; organization_id: string; role: "professional" | "organization_admin" }>(
      `SELECT id, organization_id, role FROM atlas_organization_invitations
       WHERE token_hash = $1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > now() FOR UPDATE`,
      [tokenHash],
    );
    const row = invitation.rows[0];
    if (!row) throw new Error("Invitation is invalid or expired");
    await client.query(
      `INSERT INTO atlas_organization_memberships (organization_id, user_id, role, status)
       VALUES ($1, $2, $3, 'active') ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role, status = 'active'`,
      [row.organization_id, userId, row.role],
    );
    await client.query(`UPDATE atlas_organization_invitations SET accepted_at = now() WHERE id = $1`, [row.id]);
    await writeAuditEvent({ actorUserId: userId, organizationId: row.organization_id, action: "organization.invitation.accepted", targetType: "organization_invitation", targetId: row.id, outcome: "success" }, client);
    await client.query("COMMIT");
    return row.organization_id;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
