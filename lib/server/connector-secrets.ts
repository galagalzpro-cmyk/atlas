import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  randomUUID,
} from "node:crypto";
import type { Pool, PoolClient, QueryResultRow } from "pg";
import type { AtlasConnectionProvider } from "../atlas/connected-tools";
import { getDatabase } from "./database";

const ALGORITHM = "aes-256-gcm";
const NONCE_BYTES = 12;
const REFERENCE_PATTERN = /^atlas-secret:([a-zA-Z0-9._-]{1,32}):([0-9a-f-]{36})$/;

export type ConnectorSecretPurpose = "connection_credential" | "pkce_verifier";

interface SecretRecordRow extends QueryResultRow {
  id: string;
  purpose: ConnectorSecretPurpose;
  encrypted_payload: Buffer;
  encryption_nonce: Buffer;
  authentication_tag: Buffer;
  key_version: string;
}

type QueryExecutor = Pool | PoolClient;

export interface ConnectorSecretContext {
  ownerUserId: string;
  provider: AtlasConnectionProvider;
  purpose: ConnectorSecretPurpose;
}

function getKeyVersion(): string {
  const version = process.env.ATLAS_CONNECTOR_KEY_VERSION?.trim() || "v1";
  if (!/^[a-zA-Z0-9._-]{1,32}$/.test(version)) throw new Error("Invalid connector key version");
  return version;
}

function getEncryptionKey(): Buffer {
  const configured = process.env.ATLAS_CONNECTOR_KEY_ENCRYPTION_KEY?.trim();
  if (!configured) throw new Error("Connector encryption is not configured");

  const key = /^[0-9a-fA-F]{64}$/.test(configured)
    ? Buffer.from(configured, "hex")
    : Buffer.from(configured, "base64url");
  if (key.length !== 32) throw new Error("Connector encryption key must contain 32 bytes");
  return key;
}

function parseReference(reference: string): { keyVersion: string; id: string } {
  const match = REFERENCE_PATTERN.exec(reference);
  if (!match) throw new Error("Invalid connector secret reference");
  return { keyVersion: match[1], id: match[2] };
}

function additionalAuthenticatedData(
  id: string,
  keyVersion: string,
  context: ConnectorSecretContext,
): Buffer {
  return Buffer.from(
    ["atlas", "connector", keyVersion, id, context.ownerUserId, context.provider, context.purpose].join(":"),
    "utf8",
  );
}

export function connectorSecretStoreConfigured(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}

export async function storeConnectorSecret(
  context: ConnectorSecretContext,
  payload: Record<string, unknown>,
  options: { expiresAt?: Date | null; client?: PoolClient } = {},
): Promise<string> {
  const id = randomUUID();
  const keyVersion = getKeyVersion();
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), nonce);
  cipher.setAAD(additionalAuthenticatedData(id, keyVersion, context));
  const encryptedPayload = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const authenticationTag = cipher.getAuthTag();
  const executor: QueryExecutor = options.client ?? getDatabase();

  await executor.query(
    `INSERT INTO atlas_connector_secret_records
      (id, owner_user_id, provider, purpose, encrypted_payload, encryption_nonce,
       authentication_tag, key_version, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      id,
      context.ownerUserId,
      context.provider,
      context.purpose,
      encryptedPayload,
      nonce,
      authenticationTag,
      keyVersion,
      options.expiresAt ?? null,
    ],
  );

  return `atlas-secret:${keyVersion}:${id}`;
}

export async function readConnectorSecret<T extends Record<string, unknown>>(
  reference: string,
  context: ConnectorSecretContext,
  client?: PoolClient,
): Promise<T> {
  const { keyVersion, id } = parseReference(reference);
  const executor: QueryExecutor = client ?? getDatabase();
  const result = await executor.query<SecretRecordRow>(
    `SELECT id, purpose, encrypted_payload, encryption_nonce, authentication_tag, key_version
     FROM atlas_connector_secret_records
     WHERE id = $1
       AND owner_user_id = $2
       AND provider = $3
       AND purpose = $4
       AND (expires_at IS NULL OR expires_at > now())`,
    [id, context.ownerUserId, context.provider, context.purpose],
  );
  const row = result.rows[0];
  if (!row || row.key_version !== keyVersion) throw new Error("Connector secret is unavailable");

  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), row.encryption_nonce);
  decipher.setAAD(additionalAuthenticatedData(row.id, row.key_version, context));
  decipher.setAuthTag(row.authentication_tag);
  const cleartext = Buffer.concat([
    decipher.update(row.encrypted_payload),
    decipher.final(),
  ]).toString("utf8");

  return JSON.parse(cleartext) as T;
}

export async function deleteConnectorSecret(
  reference: string,
  context: ConnectorSecretContext,
  client?: PoolClient,
): Promise<void> {
  const { id } = parseReference(reference);
  const executor: QueryExecutor = client ?? getDatabase();
  await executor.query(
    `DELETE FROM atlas_connector_secret_records
     WHERE id = $1 AND owner_user_id = $2 AND provider = $3 AND purpose = $4`,
    [id, context.ownerUserId, context.provider, context.purpose],
  );
}
