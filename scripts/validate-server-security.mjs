import { readFile } from "node:fs/promises";

const files = {
  auth: await readFile("lib/server/auth.ts", "utf8"),
  security: await readFile("lib/server/security.ts", "utf8"),
  audit: await readFile("lib/server/audit.ts", "utf8"),
  bootstrap: await readFile("scripts/bootstrap-admin.ts", "utf8"),
  payments: await readFile("lib/server/payments.ts", "utf8"),
  webhooks: await readFile("lib/server/webhooks.ts", "utf8"),
  stripeRoute: await readFile("app/api/webhooks/stripe/route.ts", "utf8"),
  paypalRoute: await readFile("app/api/webhooks/paypal/route.ts", "utf8"),
  conversationRoute: await readFile("app/api/conversation/route.ts", "utf8"),
  ai: await readFile("lib/server/ai.ts", "utf8"),
  tools: await readFile("lib/atlas/tools.ts", "utf8"),
  maintenance: await readFile("app/api/maintenance/route.ts", "utf8"),
  passwordReset: await readFile("lib/server/password-reset.ts", "utf8"),
  connectorSecrets: await readFile("lib/server/connector-secrets.ts", "utf8"),
  oauthSecurity: await readFile("lib/server/oauth-security.ts", "utf8"),
  oauthProviders: await readFile("lib/server/oauth-providers.ts", "utf8"),
  oauthConnections: await readFile("lib/server/connections.ts", "utf8"),
  oauthCallback: await readFile("app/api/connections/[provider]/callback/route.ts", "utf8"),
  oauthDisconnect: await readFile("app/api/connections/[provider]/disconnect/route.ts", "utf8"),
  schema: `${await readFile("database/001_foundation.sql", "utf8")}\n${await readFile("database/002_operations.sql", "utf8")}\n${await readFile("database/003_tooling.sql", "utf8")}\n${await readFile("database/004_oauth_connections.sql", "utf8")}`,
};

const requirements = [
  [files.auth.includes("httpOnly: true"), "session cookie must be HttpOnly"],
  [files.auth.includes("sameSite: \"lax\""), "session cookie must define SameSite"],
  [files.auth.includes("hashToken(token)"), "raw session token must not be persisted"],
  [files.security.includes("timingSafeEqual"), "password comparison must be timing safe"],
  [files.security.includes("scrypt"), "passwords must use scrypt"],
  [files.audit.includes("FORBIDDEN_METADATA_KEYS"), "audit metadata must be filtered"],
  [files.bootstrap.includes("pg_advisory_xact_lock"), "admin bootstrap must use a transaction lock"],
  [files.bootstrap.includes("platform_role = 'atlas_admin'"), "admin bootstrap must refuse a second administrator"],
  [files.payments.includes("ATLAS_PAYMENT_ENV !== \"sandbox\""), "payment adapters must be sandbox locked"],
  [files.payments.includes("sk_test_"), "Stripe adapter must require a test key"],
  [files.webhooks.includes("timingSafeEqual"), "Stripe webhook comparison must be timing safe"],
  [files.stripeRoute.includes("verifyStripeSignature"), "Stripe webhook must verify signatures"],
  [files.paypalRoute.includes("verifyPayPalWebhook"), "PayPal webhook must verify signatures"],
  [files.webhooks.includes("ON CONFLICT (provider, provider_event_id) DO NOTHING"), "webhooks must be idempotent"],
  [files.ai.includes("store: false"), "OpenAI requests must disable provider storage"],
  [files.conversationRoute.includes("assessSafety"), "local safety must run before external generation"],
  [files.conversationRoute.includes("externalAiConsent"), "external AI must require explicit consent"],
  [files.tools.includes('tool("gmail.send", "mail"') && files.tools.includes('"sensitive", "confirm"'), "email sending must require explicit confirmation"],
  [files.tools.includes('tool("github.merge", "code"') && files.tools.includes('"sensitive", "strong_auth"'), "GitHub merges must require strong authentication"],
  [files.tools.includes('tool("vercel.deploy.production", "deployment"') && files.tools.includes('"sensitive", "strong_auth"'), "production deployment must require strong authentication"],
  [files.tools.includes('tool("payments.checkout", "payments"') && files.tools.includes('"sensitive", "strong_auth"'), "payments must require strong authentication"],
  [files.tools.includes("connectionAvailable") && files.tools.includes("missing_capability"), "tool access must validate connection and role capability"],
  [files.maintenance.includes("timingSafeEqual"), "maintenance endpoint secret comparison must be timing safe"],
  [files.passwordReset.includes("UPDATE atlas_sessions SET revoked_at = now()"), "password reset must revoke sessions"],
  [files.schema.includes("token_hash text NOT NULL UNIQUE"), "session hashes must be unique"],
  [files.schema.includes("UNIQUE (provider, provider_event_id)"), "provider webhook identifiers must be unique"],
  [files.schema.includes("revoked_at timestamptz"), "sessions must support revocation"],
  [files.schema.includes("CREATE TABLE IF NOT EXISTS atlas_tool_runs"), "tool executions must have an action ledger"],
  [files.schema.includes("CREATE TABLE IF NOT EXISTS atlas_tool_approvals"), "sensitive tool actions must have approval evidence"],
  [files.schema.includes("secret_reference text") && !files.schema.includes("access_token text") && !files.schema.includes("refresh_token text"), "connector table must reference secrets rather than store raw OAuth tokens"],
  [files.connectorSecrets.includes('const ALGORITHM = "aes-256-gcm"') && files.connectorSecrets.includes("setAAD"), "connector credentials must use authenticated encryption"],
  [files.oauthSecurity.includes("randomBytes(32)") && files.schema.includes("state_hash text NOT NULL UNIQUE"), "OAuth state must be random, hashed and single-use"],
  [files.oauthSecurity.includes("browserBindingHash") && files.schema.includes("browser_binding_hash"), "OAuth callbacks must be bound to the initiating browser"],
  [files.oauthProviders.includes('code_challenge_method", "S256"') && files.oauthConnections.includes("pkce_verifier"), "supported OAuth providers must use PKCE S256"],
  [files.oauthConnections.includes("SET consumed_at = now()") && files.oauthCallback.includes("completeOAuthConnection"), "OAuth callbacks must atomically consume their transaction"],
  [files.oauthDisconnect.includes("hasRecentStrongAuth") && files.oauthDisconnect.includes("explicit_confirmation_required"), "connector revocation must require confirmation and recent strong authentication"],
  [files.oauthConnections.includes("evaluateToolAccess") && files.oauthConnections.includes("getAuthorizedConnectedToolCredential"), "connected credentials must remain behind the tool approval policy"],
  [files.schema.includes("encrypted_payload bytea") && files.schema.includes("verifier_reference text"), "OAuth credentials and PKCE verifiers must be stored behind secret references"],
];

const failures = requirements.filter(([passed]) => !passed).map(([, message]) => message);
if (failures.length) {
  for (const failure of failures) console.error(`SECURITY FAILURE: ${failure}`);
  process.exit(1);
}

console.log(`ATLAS server security validation passed (${requirements.length} controls).`);
