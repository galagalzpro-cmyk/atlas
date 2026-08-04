import "server-only";
import { databaseConfigured, getDatabase } from "./database";

export interface AtlasOperationsSnapshot {
  database: boolean;
  activeUsers: number;
  activeSessions: number;
  activeOrganizations: number;
  activeSubscriptions: number;
  failedWebhooks24h: number;
  pendingWebhooks: number;
  aiRuns24h: number;
  aiFailures24h: number;
  deniedActions24h: number;
}

const EMPTY: AtlasOperationsSnapshot = {
  database: false,
  activeUsers: 0,
  activeSessions: 0,
  activeOrganizations: 0,
  activeSubscriptions: 0,
  failedWebhooks24h: 0,
  pendingWebhooks: 0,
  aiRuns24h: 0,
  aiFailures24h: 0,
  deniedActions24h: 0,
};

export async function getOperationsSnapshot(): Promise<AtlasOperationsSnapshot> {
  if (!databaseConfigured()) return EMPTY;
  const result = await getDatabase().query<AtlasOperationsSnapshot>(
    `SELECT
      true AS database,
      (SELECT count(*)::int FROM atlas_users WHERE disabled_at IS NULL) AS "activeUsers",
      (SELECT count(*)::int FROM atlas_sessions WHERE revoked_at IS NULL AND expires_at > now()) AS "activeSessions",
      (SELECT count(*)::int FROM atlas_organizations WHERE status IN ('trial','active')) AS "activeOrganizations",
      (SELECT count(*)::int FROM atlas_subscriptions WHERE status IN ('trialing','active')) AS "activeSubscriptions",
      (SELECT count(*)::int FROM atlas_webhook_events WHERE status = 'failed' AND received_at > now() - interval '24 hours') AS "failedWebhooks24h",
      (SELECT count(*)::int FROM atlas_webhook_events WHERE status IN ('received','processing')) AS "pendingWebhooks",
      (SELECT count(*)::int FROM atlas_ai_runs WHERE created_at > now() - interval '24 hours') AS "aiRuns24h",
      (SELECT count(*)::int FROM atlas_ai_runs WHERE status = 'failed' AND created_at > now() - interval '24 hours') AS "aiFailures24h",
      (SELECT count(*)::int FROM atlas_audit_events WHERE outcome = 'denied' AND created_at > now() - interval '24 hours') AS "deniedActions24h"`,
  );
  return result.rows[0] ?? { ...EMPTY, database: true };
}

export async function runOperationalCleanup(): Promise<Record<string, number>> {
  if (!databaseConfigured()) throw new Error("Database unavailable");
  const database = getDatabase();
  const [sessions, resets, invitations, rateLimits] = await Promise.all([
    database.query(`DELETE FROM atlas_sessions WHERE expires_at < now() - interval '7 days' OR revoked_at < now() - interval '30 days'`),
    database.query(`DELETE FROM atlas_password_reset_tokens WHERE expires_at < now() - interval '24 hours' OR used_at < now() - interval '7 days'`),
    database.query(`DELETE FROM atlas_organization_invitations WHERE expires_at < now() - interval '30 days' OR revoked_at < now() - interval '30 days'`),
    database.query(`DELETE FROM atlas_rate_limit_windows WHERE expires_at < now()`),
  ]);
  return {
    sessions: sessions.rowCount ?? 0,
    passwordResets: resets.rowCount ?? 0,
    invitations: invitations.rowCount ?? 0,
    rateLimits: rateLimits.rowCount ?? 0,
  };
}
