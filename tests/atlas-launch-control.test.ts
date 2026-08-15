import assert from "node:assert/strict";
import { getAtlasLaunchControl } from "../lib/atlas/launch-control.ts";

{
  const status = getAtlasLaunchControl({ NODE_ENV: "test" });
  assert.equal(status.target, "adult-france");
  assert.equal(status.phase, "private-preview");
  assert.equal(status.ready, false);
  assert.ok(status.blockers.some((item) => item.id === "legal-entity"));
  assert.ok(status.blockers.some((item) => item.id === "hosting-notice"));
  assert.ok(!status.blockers.some((item) => item.id === "minor-safety-review"));
  assert.ok(!status.blockers.some((item) => item.id === "production-commerce"));
}

{
  const status = getAtlasLaunchControl({ NODE_ENV: "test", ATLAS_LAUNCH_AUDIENCES: "adult,adolescent,senior", ATLAS_ENABLE_PRODUCTION_CHECKOUT: "true" });
  assert.ok(status.blockers.some((item) => item.id === "minor-safety-review"));
  assert.ok(status.blockers.some((item) => item.id === "senior-review"));
  assert.ok(status.blockers.some((item) => item.id === "production-commerce"));
}

{
  const ready = getAtlasLaunchControl({
    NODE_ENV: "test",
    ATLAS_LEGAL_ENTITY: "ATLAS SAS",
    ATLAS_LEGAL_FORM: "Société par actions simplifiée",
    ATLAS_LEGAL_ADDRESS: "1 rue Exemple, 75000 Paris",
    ATLAS_LEGAL_PHONE: "+33 1 23 45 67 89",
    ATLAS_REGISTRATION_ID: "SIREN 000 000 000",
    ATLAS_PUBLICATION_DIRECTOR: "Direction ATLAS",
    ATLAS_TERMS_VERSION: "2026-08-15",
    ATLAS_PRIVACY_VERSION: "2026-08-15",
    ATLAS_SUPPORT_EMAIL: "support@atlas.fr",
    ATLAS_PRIVACY_EMAIL: "privacy@atlas.fr",
    ATLAS_SECURITY_EMAIL: "security@atlas.fr",
    ATLAS_HUMAN_RELAY: "Support humain surveillé",
    ATLAS_HOST_LEGAL_NAME: "Hébergeur Exemple",
    ATLAS_HOST_LEGAL_ADDRESS: "Adresse hébergeur",
    ATLAS_HOST_PHONE: "+1 555 123 4567",
    ATLAS_APP_URL: "https://atlas.fr",
    ATLAS_PUBLIC_COUNTRY: "FR",
    ATLAS_PUBLIC_LAUNCH_APPROVED: "true",
    DATABASE_URL: "postgresql://atlas",
    ATLAS_CONVERSATION_STATE_SECRET: "a-secure-secret-with-at-least-32-characters",
    OPENAI_API_KEY: "configured",
    BREVO_API_KEY: "configured",
    ATLAS_EMAIL_FROM: "ATLAS <security@atlas.fr>",
    CRON_SECRET: "another-secure-secret-with-32-characters",
    ATLAS_OBSERVABILITY_READY: "true",
    ATLAS_INCIDENT_ALERTING_READY: "true",
    ATLAS_ROLLBACK_READY: "true",
    ATLAS_EMERGENCY_RESOURCES_VALIDATED: "true",
    ATLAS_LOAD_TESTING_PASSED: "true",
    ATLAS_CONVERSATION_EVALUATION_PASSED: "true",
    ATLAS_DATA_RETENTION_CONFIGURED: "true",
    ATLAS_DELETION_WORKFLOW_READY: "true",
    ATLAS_AUTOMATIC_EXTERNAL_ACTIONS_DISABLED: "true",
    ATLAS_AUTONOMOUS_EMOTIONAL_CORE_READY: "true",
    ATLAS_GOVERNED_DECISION_ENGINE_READY: "true",
    ATLAS_LEGAL_REVIEW_APPROVED: "true",
    ATLAS_PRIVACY_REVIEW_APPROVED: "true",
    ATLAS_SECURITY_REVIEW_APPROVED: "true",
    ATLAS_CLINICAL_REVIEW_APPROVED: "true",
    ATLAS_ACCESSIBILITY_REVIEW_APPROVED: "true"
  });
  assert.equal(ready.ready, true);
  assert.equal(ready.phase, "public-launch-ready");
  assert.equal(ready.blockers.length, 0);
  assert.equal(ready.progress, 100);
}

{
  const commerce = getAtlasLaunchControl({
    NODE_ENV: "test",
    ATLAS_ENABLE_PRODUCTION_CHECKOUT: "true",
    ATLAS_PAYMENT_ENV: "production",
    STRIPE_SECRET_KEY: "sk_live_configured",
    STRIPE_WEBHOOK_SECRET: "whsec_configured",
    ATLAS_STRIPE_PRICE_INDIVIDUAL: "price_individual",
    ATLAS_STRIPE_PRICE_PROFESSIONAL: "price_professional",
    ATLAS_STRIPE_PRICE_ORGANIZATION: "price_organization",
    ATLAS_SALES_TERMS_VERSION: "2026-08-15",
    ATLAS_REFUND_POLICY_VERSION: "2026-08-15",
    ATLAS_CONSUMER_MEDIATOR: "Médiateur de la consommation configuré",
    ATLAS_CANCELLATION_URL: "https://atlas.fr/resilier",
  });
  const commerceCheck = commerce.checks.find((item) => item.id === "production-commerce");
  assert.equal(commerceCheck?.required, true);
  assert.equal(commerceCheck?.satisfied, true);
}

console.log("ATLAS launch control tests passed.");
