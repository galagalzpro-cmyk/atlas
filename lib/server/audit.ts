import "server-only";
import type { PoolClient } from "pg";
import { getDatabase } from "./database";

export type AtlasAuditOutcome = "success" | "denied" | "failure";

export interface AtlasAuditInput {
  actorUserId?: string | null;
  organizationId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  outcome: AtlasAuditOutcome;
  metadata?: Record<string, string | number | boolean | null>;
}

const FORBIDDEN_METADATA_KEYS = [
  "password",
  "secret",
  "token",
  "cookie",
  "authorization",
  "message",
  "transcript",
  "prompt",
  "response",
  "health",
  "diagnosis",
];

export function sanitizeAuditMetadata(
  metadata: Record<string, string | number | boolean | null> = {},
): Record<string, string | number | boolean | null> {
  return Object.fromEntries(
    Object.entries(metadata).filter(
      ([key]) => !FORBIDDEN_METADATA_KEYS.some((token) => key.toLowerCase().includes(token)),
    ),
  );
}

export async function writeAuditEvent(
  input: AtlasAuditInput,
  client?: PoolClient,
): Promise<void> {
  const executor = client ?? getDatabase();
  await executor.query(
    `INSERT INTO atlas_audit_events
      (actor_user_id, organization_id, action, target_type, target_id, outcome, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      input.actorUserId ?? null,
      input.organizationId ?? null,
      input.action,
      input.targetType,
      input.targetId ?? null,
      input.outcome,
      JSON.stringify(sanitizeAuditMetadata(input.metadata)),
    ],
  );
}
