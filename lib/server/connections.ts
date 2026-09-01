import "server-only";
import type { QueryResultRow } from "pg";
import { hasCapability, type AtlasRole } from "../atlas/access";
import {
  ATLAS_CONNECTION_PROVIDER_DEFINITIONS,
  isConnectedToolAvailable,
  resolveConnectionCapabilities,
  type AtlasConnectedToolState,
  type AtlasConnectionProvider,
  type AtlasConnectionStatus,
} from "../atlas/connected-tools";
import { evaluateToolAccess, type AtlasToolAccessDecision } from "../atlas/tools";
import { writeAuditEvent } from "./audit";
import { hasRecentStrongAuth } from "./auth";
import {
  connectorSecretStoreConfigured,
  deleteConnectorSecret,
  readConnectorSecret,
  storeConnectorSecret,
} from "./connector-secrets";
import { getDatabase, queryMany } from "./database";
import {
  buildOAuthAuthorizationUrl,
  exchangeOAuthCode,
  getOAuthRequestedPermissions,
  oauthProviderConfigured,
  oauthProviderUsesPkce,
  refreshOAuthCredential,
  revokeOAuthCredential,
  type OAuthCredentialPayload,
} from "./oauth-providers";
import {
  createOAuthProof,
  getAtlasApplicationOrigin,
  OAUTH_TRANSACTION_TTL_SECONDS,
  sha256Hex,
} from "./oauth-security";

interface ConnectionRow extends QueryResultRow {
  id: string;
  provider: AtlasConnectionProvider;
  status: AtlasConnectionStatus;
  external_account_hint: string | null;
  granted_scopes: unknown;
  capabilities: unknown;
  secret_reference: string | null;
  token_expires_at: Date | string | null;
  updated_at: Date | string;
}

interface OAuthTransactionRow extends QueryResultRow {
  id: string;
  verifier_reference: string | null;
  requested_permissions: unknown;
  redirect_uri: string;
}

export interface AtlasConnectionSummary {
  provider: AtlasConnectionProvider;
  label: string;
  description: string;
  configured: boolean;
  status: AtlasConnectionStatus | "not_connected";
  externalAccountHint: string | null;
  grantedPermissions: string[];
  capabilities: string[];
  tokenExpiresAt: string | null;
  updatedAt: string | null;
}

export interface OAuthStartResult {
  authorizationUrl: URL;
  browserBinding: string;
}

export interface ConnectedToolCredential {
  connectionId: string;
  provider: AtlasConnectionProvider;
  credential: OAuthCredentialPayload;
}

export interface AuthorizedConnectedToolCredential {
  decision: AtlasToolAccessDecision;
  connection: ConnectedToolCredential | null;
}

interface ConsumedOAuthTransaction {
  id: string;
  codeVerifier?: string;
  requestedPermissions: string[];
  redirectUri: string;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function isoDate(value: Date | string | null): string | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function transactionExpiry(): Date {
  return new Date(Date.now() + OAUTH_TRANSACTION_TTL_SECONDS * 1000);
}

export async function listAtlasConnectionsForUser(userId: string): Promise<AtlasConnectionSummary[]> {
  const rows = await queryMany<ConnectionRow>(
    `SELECT id, provider, status, external_account_hint, granted_scopes, capabilities,
            secret_reference, token_expires_at, updated_at
     FROM atlas_tool_connections
     WHERE user_id = $1 AND organization_id IS NULL`,
    [userId],
  );
  const byProvider = new Map(rows.map((row) => [row.provider, row]));
  const secretStoreReady = connectorSecretStoreConfigured();

  return ATLAS_CONNECTION_PROVIDER_DEFINITIONS.map((definition) => {
    const row = byProvider.get(definition.provider);
    return {
      ...definition,
      configured: secretStoreReady && oauthProviderConfigured(definition.provider),
      status: row?.status ?? "not_connected",
      externalAccountHint: row?.external_account_hint ?? null,
      grantedPermissions: stringArray(row?.granted_scopes),
      capabilities: stringArray(row?.capabilities),
      tokenExpiresAt: isoDate(row?.token_expires_at ?? null),
      updatedAt: isoDate(row?.updated_at ?? null),
    };
  });
}

export async function listConnectedToolStates(userId: string): Promise<AtlasConnectedToolState[]> {
  const rows = await queryMany<ConnectionRow>(
    `SELECT id, provider, status, external_account_hint, granted_scopes, capabilities,
            secret_reference, token_expires_at, updated_at
     FROM atlas_tool_connections
     WHERE user_id = $1 AND organization_id IS NULL`,
    [userId],
  );
  return rows.map((row) => ({
    provider: row.provider,
    status: row.status,
    capabilities: stringArray(row.capabilities),
  }));
}

export async function connectedToolAvailableForUser(userId: string, toolId: string): Promise<boolean> {
  return isConnectedToolAvailable(toolId, await listConnectedToolStates(userId));
}

function credentialNeedsRefresh(credential: OAuthCredentialPayload): boolean {
  if (!credential.expiresAt) return false;
  const expiresAt = new Date(credential.expiresAt).getTime();
  return !Number.isFinite(expiresAt) || expiresAt <= Date.now() + 60_000;
}

async function getConnectedToolCredential(
  userId: string,
  toolId: string,
): Promise<ConnectedToolCredential | null> {
  const client = await getDatabase().connect();
  try {
    await client.query("BEGIN");
    const result = await client.query<ConnectionRow>(
      `SELECT id, provider, status, external_account_hint, granted_scopes, capabilities,
              secret_reference, token_expires_at, updated_at
       FROM atlas_tool_connections
       WHERE user_id = $1
         AND organization_id IS NULL
         AND status = 'active'
         AND capabilities @> $2::jsonb
       FOR UPDATE`,
      [userId, JSON.stringify([toolId])],
    );
    const connection = result.rows[0];
    if (!connection?.secret_reference) {
      await client.query("COMMIT");
      return null;
    }
    const context = { ownerUserId: userId, provider: connection.provider, purpose: "connection_credential" as const };
    const credential = await readConnectorSecret<OAuthCredentialPayload>(connection.secret_reference, context, client);
    if (!credentialNeedsRefresh(credential)) {
      await client.query("COMMIT");
      return { connectionId: connection.id, provider: connection.provider, credential };
    }
    if (!credential.refreshToken) {
      await client.query(
        `UPDATE atlas_tool_connections
         SET status = 'expired', last_error_code = 'refresh_unavailable', updated_at = now()
         WHERE id = $1`,
        [connection.id],
      );
      await client.query("COMMIT");
      return null;
    }

    const refresh = await refreshOAuthCredential(
      connection.provider,
      credential,
      stringArray(connection.granted_scopes),
    );
    const capabilities = resolveConnectionCapabilities(connection.provider, refresh.grantedPermissions);
    const nextReference = await storeConnectorSecret(context, refresh.credential, { client });
    await client.query(
      `UPDATE atlas_tool_connections
       SET secret_reference = $2, granted_scopes = $3::jsonb, capabilities = $4::jsonb,
           token_expires_at = $5, last_checked_at = now(), last_error_code = NULL,
           updated_at = now()
       WHERE id = $1`,
      [
        connection.id,
        nextReference,
        JSON.stringify(refresh.grantedPermissions),
        JSON.stringify(capabilities),
        refresh.credential.expiresAt ? new Date(refresh.credential.expiresAt) : null,
      ],
    );
    await deleteConnectorSecret(connection.secret_reference, context, client);
    await writeAuditEvent({
      actorUserId: userId,
      action: "connection.credential_refreshed",
      targetType: "tool_connection",
      targetId: connection.id,
      outcome: "success",
      metadata: { provider: connection.provider },
    }, client);
    await client.query("COMMIT");
    return { connectionId: connection.id, provider: connection.provider, credential: refresh.credential };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getAuthorizedConnectedToolCredential(input: {
  userId: string;
  role: AtlasRole;
  toolId: string;
  userConfirmed?: boolean;
}): Promise<AuthorizedConnectedToolCredential> {
  const connectionAvailable = await connectedToolAvailableForUser(input.userId, input.toolId);
  const strongAuthSatisfied = await hasRecentStrongAuth(input.userId);
  const decision = evaluateToolAccess({
    role: input.role,
    hasCapability,
    toolId: input.toolId,
    connectionAvailable,
    userConfirmed: input.userConfirmed,
    strongAuthSatisfied,
  });
  if (!decision.allowed) return { decision, connection: null };

  const connection = await getConnectedToolCredential(input.userId, input.toolId);
  if (connection) return { decision, connection };
  return {
    decision: {
      allowed: false,
      requiresConfirmation: false,
      requiresStrongAuth: false,
      reason: "connection_unavailable",
    },
    connection: null,
  };
}

export async function createOAuthTransaction(
  userId: string,
  provider: AtlasConnectionProvider,
): Promise<OAuthStartResult> {
  if (!connectorSecretStoreConfigured() || !oauthProviderConfigured(provider)) {
    throw new Error("OAuth provider is unavailable");
  }
  const origin = getAtlasApplicationOrigin();
  const redirectUri = new URL(`/api/connections/${provider}/callback`, origin).toString();
  const proof = createOAuthProof();
  const permissions = getOAuthRequestedPermissions(provider);
  const expiresAt = transactionExpiry();
  const client = await getDatabase().connect();

  try {
    await client.query("BEGIN");
    const verifierReference = oauthProviderUsesPkce(provider)
      ? await storeConnectorSecret(
        { ownerUserId: userId, provider, purpose: "pkce_verifier" },
        { codeVerifier: proof.codeVerifier },
        { expiresAt, client },
      )
      : null;
    await client.query(
      `INSERT INTO atlas_oauth_transactions
        (user_id, provider, state_hash, browser_binding_hash, verifier_reference,
         requested_permissions, redirect_uri, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)`,
      [
        userId,
        provider,
        proof.stateHash,
        proof.browserBindingHash,
        verifierReference,
        JSON.stringify(permissions),
        redirectUri,
        expiresAt,
      ],
    );
    await writeAuditEvent({
      actorUserId: userId,
      action: "connection.oauth_started",
      targetType: "tool_connection",
      targetId: provider,
      outcome: "success",
      metadata: { provider, permissionCount: permissions.length, pkce: oauthProviderUsesPkce(provider) },
    }, client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return {
    authorizationUrl: buildOAuthAuthorizationUrl(provider, {
      redirectUri,
      state: proof.state,
      codeChallenge: proof.codeChallenge,
    }),
    browserBinding: proof.browserBinding,
  };
}

async function consumeOAuthTransaction(
  userId: string,
  provider: AtlasConnectionProvider,
  state: string,
  browserBinding: string,
): Promise<ConsumedOAuthTransaction> {
  const result = await getDatabase().query<OAuthTransactionRow>(
    `UPDATE atlas_oauth_transactions
     SET consumed_at = now()
     WHERE user_id = $1
       AND provider = $2
       AND state_hash = $3
       AND browser_binding_hash = $4
       AND consumed_at IS NULL
       AND expires_at > now()
     RETURNING id, verifier_reference, requested_permissions, redirect_uri`,
    [userId, provider, sha256Hex(state), sha256Hex(browserBinding)],
  );
  const transaction = result.rows[0];
  if (!transaction) throw new Error("OAuth transaction is invalid or expired");

  let codeVerifier: string | undefined;
  if (transaction.verifier_reference) {
    try {
      const secret = await readConnectorSecret<{ codeVerifier?: unknown }>(
        transaction.verifier_reference,
        { ownerUserId: userId, provider, purpose: "pkce_verifier" },
      );
      codeVerifier = typeof secret.codeVerifier === "string" ? secret.codeVerifier : undefined;
    } finally {
      await deleteConnectorSecret(
        transaction.verifier_reference,
        { ownerUserId: userId, provider, purpose: "pkce_verifier" },
      ).catch(() => undefined);
    }
  }

  return {
    id: transaction.id,
    codeVerifier,
    requestedPermissions: stringArray(transaction.requested_permissions),
    redirectUri: transaction.redirect_uri,
  };
}

export async function recordOAuthDenial(
  userId: string,
  provider: AtlasConnectionProvider,
  state: string,
  browserBinding: string,
): Promise<void> {
  const transaction = await consumeOAuthTransaction(userId, provider, state, browserBinding);
  await writeAuditEvent({
    actorUserId: userId,
    action: "connection.oauth_denied",
    targetType: "oauth_transaction",
    targetId: transaction.id,
    outcome: "denied",
    metadata: { provider },
  });
}

export async function completeOAuthConnection(
  userId: string,
  provider: AtlasConnectionProvider,
  input: { state: string; browserBinding: string; code: string },
): Promise<void> {
  const transaction = await consumeOAuthTransaction(userId, provider, input.state, input.browserBinding);
  const exchange = await exchangeOAuthCode(provider, {
    code: input.code,
    codeVerifier: transaction.codeVerifier,
    redirectUri: transaction.redirectUri,
    requestedPermissions: transaction.requestedPermissions,
  });
  const capabilities = resolveConnectionCapabilities(provider, exchange.grantedPermissions);
  const tokenExpiresAt = exchange.credential.expiresAt ? new Date(exchange.credential.expiresAt) : null;
  const client = await getDatabase().connect();

  try {
    await client.query("BEGIN");
    const existing = await client.query<Pick<ConnectionRow, "secret_reference"> & QueryResultRow>(
      `SELECT secret_reference
       FROM atlas_tool_connections
       WHERE user_id = $1 AND provider = $2 AND organization_id IS NULL
       FOR UPDATE`,
      [userId, provider],
    );
    const previousReference = existing.rows[0]?.secret_reference;
    const secretReference = await storeConnectorSecret(
      { ownerUserId: userId, provider, purpose: "connection_credential" },
      exchange.credential,
      { client },
    );
    const connection = await client.query<{ id: string } & QueryResultRow>(
      `INSERT INTO atlas_tool_connections
        (user_id, provider, connection_type, status, external_account_hint,
         granted_scopes, capabilities, secret_reference, token_expires_at,
         last_checked_at, revoked_at, last_error_code)
       VALUES ($1, $2, 'oauth', 'active', $3, $4::jsonb, $5::jsonb, $6, $7, now(), NULL, NULL)
       ON CONFLICT (user_id, provider)
         WHERE user_id IS NOT NULL AND organization_id IS NULL
       DO UPDATE SET
         status = 'active',
         external_account_hint = EXCLUDED.external_account_hint,
         granted_scopes = EXCLUDED.granted_scopes,
         capabilities = EXCLUDED.capabilities,
         secret_reference = EXCLUDED.secret_reference,
         token_expires_at = EXCLUDED.token_expires_at,
         last_checked_at = now(),
         revoked_at = NULL,
         last_error_code = NULL,
         updated_at = now()
       RETURNING id`,
      [
        userId,
        provider,
        exchange.externalAccountHint,
        JSON.stringify(exchange.grantedPermissions),
        JSON.stringify(capabilities),
        secretReference,
        tokenExpiresAt,
      ],
    );
    if (previousReference) {
      await deleteConnectorSecret(
        previousReference,
        { ownerUserId: userId, provider, purpose: "connection_credential" },
        client,
      );
    }
    await writeAuditEvent({
      actorUserId: userId,
      action: "connection.oauth_completed",
      targetType: "tool_connection",
      targetId: connection.rows[0]?.id ?? provider,
      outcome: "success",
      metadata: { provider, permissionCount: exchange.grantedPermissions.length, capabilityCount: capabilities.length },
    }, client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function disconnectOAuthConnection(
  userId: string,
  provider: AtlasConnectionProvider,
): Promise<"disconnected" | "not_connected" | "revocation_failed"> {
  const result = await getDatabase().query<ConnectionRow>(
    `SELECT id, provider, status, external_account_hint, granted_scopes, capabilities,
            secret_reference, token_expires_at, updated_at
     FROM atlas_tool_connections
     WHERE user_id = $1 AND provider = $2 AND organization_id IS NULL`,
    [userId, provider],
  );
  const connection = result.rows[0];
  if (!connection?.secret_reference || connection.status === "revoked") return "not_connected";

  const credential = await readConnectorSecret<OAuthCredentialPayload>(
    connection.secret_reference,
    { ownerUserId: userId, provider, purpose: "connection_credential" },
  );
  const revoked = await revokeOAuthCredential(provider, credential).catch(() => false);
  if (!revoked) {
    await getDatabase().query(
      `UPDATE atlas_tool_connections
       SET last_error_code = 'remote_revocation_failed', updated_at = now()
       WHERE id = $1`,
      [connection.id],
    );
    await writeAuditEvent({
      actorUserId: userId,
      action: "connection.revoke_failed",
      targetType: "tool_connection",
      targetId: connection.id,
      outcome: "failure",
      metadata: { provider },
    });
    return "revocation_failed";
  }

  const client = await getDatabase().connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE atlas_tool_connections
       SET status = 'revoked', capabilities = '[]'::jsonb, secret_reference = NULL,
           token_expires_at = NULL, revoked_at = now(), last_error_code = NULL,
           last_checked_at = now(), updated_at = now()
       WHERE id = $1 AND user_id = $2`,
      [connection.id, userId],
    );
    await deleteConnectorSecret(
      connection.secret_reference,
      { ownerUserId: userId, provider, purpose: "connection_credential" },
      client,
    );
    await writeAuditEvent({
      actorUserId: userId,
      action: "connection.revoked",
      targetType: "tool_connection",
      targetId: connection.id,
      outcome: "success",
      metadata: { provider, strongAuth: true },
    }, client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  return "disconnected";
}
