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
  maintenance: await readFile("app/api/maintenance/route.ts", "utf8"),
  passwordReset: await readFile("lib/server/password-reset.ts", "utf8"),
  schema: `${await readFile("database/001_foundation.sql", "utf8")}\n${await readFile("database/002_operations.sql", "utf8")}`,
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
  [files.ai.includes("store: false"), "external AI requests must disable provider storage"],
  [files.conversationRoute.includes("assessSafety"), "local safety must run before external generation"],
  [files.conversationRoute.includes("externalAiConsent"), "external AI must require explicit consent"],
  [files.maintenance.includes("timingSafeEqual"), "maintenance endpoint secret comparison must be timing safe"],
  [files.passwordReset.includes("UPDATE atlas_sessions SET revoked_at = now()"), "password reset must revoke sessions"],
  [files.schema.includes("token_hash text NOT NULL UNIQUE"), "session hashes must be unique"],
  [files.schema.includes("UNIQUE (provider, provider_event_id)"), "provider webhook identifiers must be unique"],
  [files.schema.includes("revoked_at timestamptz"), "sessions must support revocation"],
];

const failures = requirements.filter(([passed]) => !passed).map(([, message]) => message);
if (failures.length) {
  for (const failure of failures) console.error(`SECURITY FAILURE: ${failure}`);
  process.exit(1);
}

console.log(`ATLAS server security validation passed (${requirements.length} controls).`);
