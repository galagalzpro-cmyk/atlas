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
  orchestrator: await readFile("lib/atlas/orchestrator.ts", "utf8"),
  policyKernel: await readFile("lib/atlas/policy-kernel.ts", "utf8"),
  conversationState: await readFile("lib/server/conversation-state.ts", "utf8"),
  testMode: await readFile("lib/server/test-mode.ts", "utf8"),
  ai: await readFile("lib/server/ai.ts", "utf8"),
  maintenance: await readFile("app/api/maintenance/route.ts", "utf8"),
  health: await readFile("app/api/health/route.ts", "utf8"),
  consentManager: await readFile("components/site/AtlasConsentManager.tsx", "utf8"),
  passwordReset: await readFile("lib/server/password-reset.ts", "utf8"),
  schema: `${await readFile("database/001_foundation.sql", "utf8")}\n${await readFile("database/002_operations.sql", "utf8")}`,
};

const planIndex = files.conversationRoute.indexOf("planAtlasTurn(");
const generationIndex = files.conversationRoute.indexOf("generateAtlasReply(");

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
  [files.ai.includes("store: false"), "external AI requests must disable provider storage"],
  [files.orchestrator.includes("assessSafety"), "V4 orchestrator must perform local safety assessment"],
  [planIndex >= 0 && generationIndex > planIndex, "local V4 planning and safety must run before external generation"],
  [files.conversationRoute.includes("buildAtlasSafetyReply"), "sensitive responses must remain local"],
  [files.conversationRoute.includes("externalAiConsent"), "external AI must require explicit consent"],
  [files.policyKernel.includes("automaticExternalActionsAllowed: false"), "automatic external actions must remain disabled"],
  [files.policyKernel.includes("rawConversationLoggingAllowed: false"), "raw conversation logging must remain disabled"],
  [files.conversationState.includes("createHmac") && files.conversationState.includes("timingSafeEqual"), "conversation continuity must be signed and timing-safe"],
  [files.testMode.includes("if (databaseConfigured()) return false;"), "test identities must be disabled when a database is configured"],
  [files.testMode.includes('process.env.VERCEL_ENV === "preview"'), "test identities must be scoped to Vercel preview"],
  [files.testMode.includes('process.env.ATLAS_TEST_MODE === "true"') && files.testMode.includes('process.env.NODE_ENV === "development"'), "local test identities must require explicit non-production configuration"],
  [!files.testMode.includes("|| !databaseConfigured()"), "a missing database must never automatically enable test identities"],
  [files.maintenance.includes("timingSafeEqual"), "maintenance endpoint secret comparison must be timing safe"],
  [files.passwordReset.includes("UPDATE atlas_sessions SET revoked_at = now()"), "password reset must revoke sessions"],
  [files.schema.includes("token_hash text NOT NULL UNIQUE"), "session hashes must be unique"],
  [files.schema.includes("UNIQUE (provider, provider_event_id)"), "provider webhook identifiers must be unique"],
  [files.schema.includes("revoked_at timestamptz"), "sessions must support revocation"],
  [files.health.includes('"Cache-Control": "no-store') && !files.health.includes("process.env"), "health endpoint must be uncached and must not expose configuration"],
  [files.consentManager.includes("DEFAULT_CONSENT") && files.consentManager.includes("analytics: false") && files.consentManager.includes("marketing: false"), "analytics and marketing consent must default to denied"],
  [files.consentManager.includes("googleLoaderId ?") && files.consentManager.includes("consent.marketing && metaPixelId"), "external trackers must be loaded only after category consent"],
];

const failures = requirements.filter(([passed]) => !passed).map(([, message]) => message);
if (failures.length) {
  for (const failure of failures) console.error(`SECURITY FAILURE: ${failure}`);
  process.exit(1);
}

console.log(`ATLAS server security validation passed (${requirements.length} controls).`);
