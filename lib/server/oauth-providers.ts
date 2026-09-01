import "server-only";
import type { AtlasConnectionProvider } from "../atlas/connected-tools";

const GOOGLE_DEFAULT_PERMISSIONS = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.events.readonly",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
] as const;

const GOOGLE_ALLOWED_PERMISSIONS = [
  ...GOOGLE_DEFAULT_PERMISSIONS,
  "profile",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.file",
] as const;

const SLACK_DEFAULT_PERMISSIONS = [
  "search:read",
  "channels:read",
  "channels:history",
  "groups:read",
  "groups:history",
  "im:read",
  "im:history",
  "mpim:read",
  "mpim:history",
  "users:read",
] as const;

const SLACK_ALLOWED_PERMISSIONS = [...SLACK_DEFAULT_PERMISSIONS, "chat:write"] as const;
const GITHUB_DEFAULT_PERMISSIONS = ["metadata:read", "contents:read", "issues:read", "pull_requests:read"] as const;
const GITHUB_ALLOWED_PERMISSIONS = [
  ...GITHUB_DEFAULT_PERMISSIONS,
  "contents:write",
  "issues:write",
  "pull_requests:write",
] as const;
const LINEAR_DEFAULT_PERMISSIONS = ["read"] as const;
const LINEAR_ALLOWED_PERMISSIONS = ["read", "issues:create", "comments:create", "write"] as const;

interface ProviderConfiguration {
  clientId: string;
  clientSecret: string;
  permissions: string[];
  usesPkce: boolean;
}

export interface OAuthCredentialPayload extends Record<string, unknown> {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresAt?: string;
  refreshTokenExpiresAt?: string;
}

export interface OAuthExchangeResult {
  credential: OAuthCredentialPayload;
  grantedPermissions: string[];
  externalAccountHint: string;
}

export interface OAuthRefreshResult {
  credential: OAuthCredentialPayload;
  grantedPermissions: string[];
}

interface OAuthAuthorizationInput {
  redirectUri: string;
  state: string;
  codeChallenge: string;
}

interface OAuthExchangeInput {
  code: string;
  redirectUri: string;
  codeVerifier?: string;
  requestedPermissions: string[];
}

type JsonRecord = Record<string, unknown>;

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function recordValue(value: unknown): JsonRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as JsonRecord : null;
}

function secondsValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function expiresAt(seconds: number | null): string | undefined {
  return seconds ? new Date(Date.now() + seconds * 1000).toISOString() : undefined;
}

function normalizeHint(value: string): string {
  return value.replace(/[\r\n\t]/g, " ").trim().slice(0, 180) || "Compte connecté";
}

function parsePermissionResponse(value: unknown, fallback: string[]): string[] {
  if (Array.isArray(value)) {
    const parsed = value.filter((item): item is string => typeof item === "string" && item.length > 0);
    return parsed.length ? [...new Set(parsed)] : fallback;
  }
  if (typeof value === "string") {
    const parsed = value.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean);
    return parsed.length ? [...new Set(parsed)] : fallback;
  }
  return fallback;
}

function configuredPermissions(
  environmentName: string,
  defaults: readonly string[],
  allowed: readonly string[],
): string[] {
  const configured = process.env[environmentName]?.trim();
  const values = configured
    ? configured.split(",").map((value) => value.trim()).filter(Boolean)
    : [...defaults];
  const allowedSet = new Set(allowed);
  if (!values.length || values.some((value) => !allowedSet.has(value))) {
    throw new Error(`Unsupported permission in ${environmentName}`);
  }
  return [...new Set(values)];
}

function getProviderConfiguration(provider: AtlasConnectionProvider): ProviderConfiguration {
  switch (provider) {
    case "google":
      return {
        clientId: process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() || "",
        clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() || "",
        permissions: configuredPermissions("ATLAS_GOOGLE_SCOPES", GOOGLE_DEFAULT_PERMISSIONS, GOOGLE_ALLOWED_PERMISSIONS),
        usesPkce: true,
      };
    case "slack":
      return {
        clientId: process.env.SLACK_OAUTH_CLIENT_ID?.trim() || "",
        clientSecret: process.env.SLACK_OAUTH_CLIENT_SECRET?.trim() || "",
        permissions: configuredPermissions("ATLAS_SLACK_SCOPES", SLACK_DEFAULT_PERMISSIONS, SLACK_ALLOWED_PERMISSIONS),
        usesPkce: false,
      };
    case "github":
      return {
        clientId: process.env.GITHUB_APP_CLIENT_ID?.trim() || "",
        clientSecret: process.env.GITHUB_APP_CLIENT_SECRET?.trim() || "",
        permissions: configuredPermissions("ATLAS_GITHUB_PERMISSIONS", GITHUB_DEFAULT_PERMISSIONS, GITHUB_ALLOWED_PERMISSIONS),
        usesPkce: true,
      };
    case "linear":
      return {
        clientId: process.env.LINEAR_OAUTH_CLIENT_ID?.trim() || "",
        clientSecret: process.env.LINEAR_OAUTH_CLIENT_SECRET?.trim() || "",
        permissions: configuredPermissions("ATLAS_LINEAR_SCOPES", LINEAR_DEFAULT_PERMISSIONS, LINEAR_ALLOWED_PERMISSIONS),
        usesPkce: true,
      };
  }
}

function requireProviderConfiguration(provider: AtlasConnectionProvider): ProviderConfiguration {
  const configuration = getProviderConfiguration(provider);
  if (!configuration.clientId || !configuration.clientSecret) {
    throw new Error(`OAuth provider ${provider} is not configured`);
  }
  return configuration;
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  return fetch(url, {
    ...init,
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
  });
}

async function readJsonResponse(response: Response): Promise<JsonRecord> {
  const body = recordValue(await response.json().catch(() => null));
  if (!response.ok || !body) throw new Error("OAuth provider request failed");
  return body;
}

async function exchangeForm(url: string, body: URLSearchParams, headers: HeadersInit = {}): Promise<JsonRecord> {
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded", ...headers },
    body,
  });
  return readJsonResponse(response);
}

async function fetchGoogleAccountHint(accessToken: string): Promise<string> {
  const response = await fetchWithTimeout("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  const body = await readJsonResponse(response);
  return normalizeHint(stringValue(body.email) || stringValue(body.name) || "Compte Google");
}

async function fetchGitHubAccountHint(accessToken: string): Promise<string> {
  const response = await fetchWithTimeout("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2026-03-10",
      "User-Agent": "ATLAS-Connected-Services",
    },
  });
  const body = await readJsonResponse(response);
  return normalizeHint(stringValue(body.login) || "Compte GitHub");
}

async function fetchLinearAccountHint(accessToken: string): Promise<string> {
  const response = await fetchWithTimeout("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: "query AtlasOAuthViewer { viewer { id name email } }" }),
  });
  const body = await readJsonResponse(response);
  const viewer = recordValue(recordValue(body.data)?.viewer);
  if (!viewer) throw new Error("Linear account lookup failed");
  return normalizeHint(stringValue(viewer.email) || stringValue(viewer.name) || "Compte Linear");
}

export function oauthProviderConfigured(provider: AtlasConnectionProvider): boolean {
  try {
    const configuration = getProviderConfiguration(provider);
    return Boolean(configuration.clientId && configuration.clientSecret);
  } catch {
    return false;
  }
}

export function oauthProviderUsesPkce(provider: AtlasConnectionProvider): boolean {
  return getProviderConfiguration(provider).usesPkce;
}

export function getOAuthRequestedPermissions(provider: AtlasConnectionProvider): string[] {
  return requireProviderConfiguration(provider).permissions;
}

export function buildOAuthAuthorizationUrl(
  provider: AtlasConnectionProvider,
  input: OAuthAuthorizationInput,
): URL {
  const configuration = requireProviderConfiguration(provider);
  let authorizationUrl: URL;

  switch (provider) {
    case "google":
      authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authorizationUrl.searchParams.set("client_id", configuration.clientId);
      authorizationUrl.searchParams.set("redirect_uri", input.redirectUri);
      authorizationUrl.searchParams.set("response_type", "code");
      authorizationUrl.searchParams.set("scope", configuration.permissions.join(" "));
      authorizationUrl.searchParams.set("access_type", "offline");
      authorizationUrl.searchParams.set("include_granted_scopes", "true");
      authorizationUrl.searchParams.set("prompt", "consent select_account");
      break;
    case "slack":
      authorizationUrl = new URL("https://slack.com/oauth/v2/authorize");
      authorizationUrl.searchParams.set("client_id", configuration.clientId);
      authorizationUrl.searchParams.set("redirect_uri", input.redirectUri);
      authorizationUrl.searchParams.set("user_scope", configuration.permissions.join(","));
      break;
    case "github":
      authorizationUrl = new URL("https://github.com/login/oauth/authorize");
      authorizationUrl.searchParams.set("client_id", configuration.clientId);
      authorizationUrl.searchParams.set("redirect_uri", input.redirectUri);
      authorizationUrl.searchParams.set("allow_signup", "false");
      authorizationUrl.searchParams.set("prompt", "select_account");
      break;
    case "linear":
      authorizationUrl = new URL("https://linear.app/oauth/authorize");
      authorizationUrl.searchParams.set("client_id", configuration.clientId);
      authorizationUrl.searchParams.set("redirect_uri", input.redirectUri);
      authorizationUrl.searchParams.set("response_type", "code");
      authorizationUrl.searchParams.set("scope", configuration.permissions.join(","));
      authorizationUrl.searchParams.set("actor", "user");
      break;
  }

  authorizationUrl.searchParams.set("state", input.state);
  if (configuration.usesPkce) {
    authorizationUrl.searchParams.set("code_challenge", input.codeChallenge);
    authorizationUrl.searchParams.set("code_challenge_method", "S256");
  }
  return authorizationUrl;
}

export async function exchangeOAuthCode(
  provider: AtlasConnectionProvider,
  input: OAuthExchangeInput,
): Promise<OAuthExchangeResult> {
  const configuration = requireProviderConfiguration(provider);
  if (configuration.usesPkce && !input.codeVerifier) throw new Error("PKCE verifier is unavailable");

  if (provider === "google") {
    const body = await exchangeForm("https://oauth2.googleapis.com/token", new URLSearchParams({
      client_id: configuration.clientId,
      client_secret: configuration.clientSecret,
      code: input.code,
      code_verifier: input.codeVerifier || "",
      grant_type: "authorization_code",
      redirect_uri: input.redirectUri,
    }));
    const accessToken = stringValue(body.access_token);
    if (!accessToken) throw new Error("Google OAuth token is unavailable");
    const grantedPermissions = parsePermissionResponse(body.scope, input.requestedPermissions);
    return {
      credential: {
        accessToken,
        refreshToken: stringValue(body.refresh_token) || undefined,
        tokenType: stringValue(body.token_type) || "Bearer",
        expiresAt: expiresAt(secondsValue(body.expires_in)),
      },
      grantedPermissions,
      externalAccountHint: await fetchGoogleAccountHint(accessToken),
    };
  }

  if (provider === "slack") {
    const body = await exchangeForm("https://slack.com/api/oauth.v2.access", new URLSearchParams({
      client_id: configuration.clientId,
      client_secret: configuration.clientSecret,
      code: input.code,
      redirect_uri: input.redirectUri,
    }));
    if (body.ok !== true) throw new Error("Slack OAuth token exchange failed");
    const authenticatedUser = recordValue(body.authed_user);
    const accessToken = stringValue(authenticatedUser?.access_token);
    if (!authenticatedUser || !accessToken) throw new Error("Slack user token is unavailable");
    const team = recordValue(body.team);
    const teamName = stringValue(team?.name) || stringValue(team?.id) || "Slack";
    const userId = stringValue(authenticatedUser.id) || "utilisateur";
    return {
      credential: {
        accessToken,
        refreshToken: stringValue(authenticatedUser.refresh_token) || undefined,
        tokenType: stringValue(authenticatedUser.token_type) || "Bearer",
        expiresAt: expiresAt(secondsValue(authenticatedUser.expires_in)),
      },
      grantedPermissions: parsePermissionResponse(authenticatedUser.scope, input.requestedPermissions),
      externalAccountHint: normalizeHint(`${teamName} · ${userId}`),
    };
  }

  if (provider === "github") {
    const body = await exchangeForm("https://github.com/login/oauth/access_token", new URLSearchParams({
      client_id: configuration.clientId,
      client_secret: configuration.clientSecret,
      code: input.code,
      code_verifier: input.codeVerifier || "",
      redirect_uri: input.redirectUri,
    }));
    const accessToken = stringValue(body.access_token);
    if (!accessToken) throw new Error("GitHub App user token is unavailable");
    return {
      credential: {
        accessToken,
        refreshToken: stringValue(body.refresh_token) || undefined,
        tokenType: stringValue(body.token_type) || "Bearer",
        expiresAt: expiresAt(secondsValue(body.expires_in)),
        refreshTokenExpiresAt: expiresAt(secondsValue(body.refresh_token_expires_in)),
      },
      grantedPermissions: configuration.permissions,
      externalAccountHint: await fetchGitHubAccountHint(accessToken),
    };
  }

  const body = await exchangeForm("https://api.linear.app/oauth/token", new URLSearchParams({
    client_id: configuration.clientId,
    client_secret: configuration.clientSecret,
    code: input.code,
    code_verifier: input.codeVerifier || "",
    grant_type: "authorization_code",
    redirect_uri: input.redirectUri,
  }));
  const accessToken = stringValue(body.access_token);
  if (!accessToken) throw new Error("Linear OAuth token is unavailable");
  return {
    credential: {
      accessToken,
      refreshToken: stringValue(body.refresh_token) || undefined,
      tokenType: stringValue(body.token_type) || "Bearer",
      expiresAt: expiresAt(secondsValue(body.expires_in)),
    },
    grantedPermissions: parsePermissionResponse(body.scope, input.requestedPermissions),
    externalAccountHint: await fetchLinearAccountHint(accessToken),
  };
}

export async function refreshOAuthCredential(
  provider: AtlasConnectionProvider,
  credential: OAuthCredentialPayload,
  currentPermissions: string[],
): Promise<OAuthRefreshResult> {
  const configuration = requireProviderConfiguration(provider);
  if (!credential.refreshToken) throw new Error("OAuth refresh credential is unavailable");

  if (provider === "google") {
    const body = await exchangeForm("https://oauth2.googleapis.com/token", new URLSearchParams({
      client_id: configuration.clientId,
      client_secret: configuration.clientSecret,
      refresh_token: credential.refreshToken,
      grant_type: "refresh_token",
    }));
    const accessToken = stringValue(body.access_token);
    if (!accessToken) throw new Error("Google OAuth refresh failed");
    return {
      credential: {
        accessToken,
        refreshToken: stringValue(body.refresh_token) || credential.refreshToken,
        tokenType: stringValue(body.token_type) || credential.tokenType,
        expiresAt: expiresAt(secondsValue(body.expires_in)),
      },
      grantedPermissions: parsePermissionResponse(body.scope, currentPermissions),
    };
  }

  if (provider === "slack") {
    const body = await exchangeForm("https://slack.com/api/oauth.v2.access", new URLSearchParams({
      client_id: configuration.clientId,
      client_secret: configuration.clientSecret,
      refresh_token: credential.refreshToken,
      grant_type: "refresh_token",
    }));
    if (body.ok !== true) throw new Error("Slack OAuth refresh failed");
    const authenticatedUser = recordValue(body.authed_user);
    const tokenContainer = authenticatedUser ?? body;
    const accessToken = stringValue(tokenContainer.access_token);
    const refreshToken = stringValue(tokenContainer.refresh_token);
    if (!accessToken || !refreshToken) throw new Error("Slack rotated credential is unavailable");
    return {
      credential: {
        accessToken,
        refreshToken,
        tokenType: stringValue(tokenContainer.token_type) || credential.tokenType,
        expiresAt: expiresAt(secondsValue(tokenContainer.expires_in)),
      },
      grantedPermissions: parsePermissionResponse(tokenContainer.scope, currentPermissions),
    };
  }

  if (provider === "github") {
    const body = await exchangeForm("https://github.com/login/oauth/access_token", new URLSearchParams({
      client_id: configuration.clientId,
      client_secret: configuration.clientSecret,
      refresh_token: credential.refreshToken,
      grant_type: "refresh_token",
    }));
    const accessToken = stringValue(body.access_token);
    const refreshToken = stringValue(body.refresh_token);
    if (!accessToken || !refreshToken) throw new Error("GitHub App credential refresh failed");
    return {
      credential: {
        accessToken,
        refreshToken,
        tokenType: stringValue(body.token_type) || credential.tokenType,
        expiresAt: expiresAt(secondsValue(body.expires_in)),
        refreshTokenExpiresAt: expiresAt(secondsValue(body.refresh_token_expires_in)),
      },
      grantedPermissions: configuration.permissions,
    };
  }

  const body = await exchangeForm("https://api.linear.app/oauth/token", new URLSearchParams({
    client_id: configuration.clientId,
    client_secret: configuration.clientSecret,
    refresh_token: credential.refreshToken,
    grant_type: "refresh_token",
  }));
  const accessToken = stringValue(body.access_token);
  const refreshToken = stringValue(body.refresh_token);
  if (!accessToken || !refreshToken) throw new Error("Linear credential refresh failed");
  return {
    credential: {
      accessToken,
      refreshToken,
      tokenType: stringValue(body.token_type) || credential.tokenType,
      expiresAt: expiresAt(secondsValue(body.expires_in)),
    },
    grantedPermissions: parsePermissionResponse(body.scope, currentPermissions),
  };
}

async function revokeLinearToken(token: string, hint: "access_token" | "refresh_token"): Promise<boolean> {
  const response = await fetchWithTimeout("https://api.linear.app/oauth/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token, token_type_hint: hint }),
  });
  return response.status === 200 || response.status === 400 || response.status === 401;
}

export async function revokeOAuthCredential(
  provider: AtlasConnectionProvider,
  credential: OAuthCredentialPayload,
): Promise<boolean> {
  const configuration = requireProviderConfiguration(provider);

  if (provider === "google") {
    const response = await fetchWithTimeout("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: credential.refreshToken || credential.accessToken }),
    });
    return response.ok || response.status === 400;
  }

  if (provider === "slack") {
    const response = await fetchWithTimeout("https://slack.com/api/auth.revoke", {
      method: "POST",
      headers: { Authorization: `Bearer ${credential.accessToken}`, Accept: "application/json" },
    });
    const body = recordValue(await response.json().catch(() => null));
    return response.ok && (body?.ok === true || body?.error === "token_revoked");
  }

  if (provider === "github") {
    const basicAuthorization = Buffer.from(`${configuration.clientId}:${configuration.clientSecret}`).toString("base64");
    const response = await fetchWithTimeout(
      `https://api.github.com/applications/${encodeURIComponent(configuration.clientId)}/grant`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${basicAuthorization}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2026-03-10",
          "User-Agent": "ATLAS-Connected-Services",
        },
        body: JSON.stringify({ access_token: credential.accessToken }),
      },
    );
    return response.status === 204 || response.status === 404;
  }

  const refreshRevoked = credential.refreshToken
    ? await revokeLinearToken(credential.refreshToken, "refresh_token")
    : true;
  const accessRevoked = await revokeLinearToken(credential.accessToken, "access_token");
  return refreshRevoked && accessRevoked;
}
