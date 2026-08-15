import assert from "node:assert/strict";
import { getAtlasLaunchControl } from "../lib/atlas/launch-control.ts";

{
  const status = getAtlasLaunchControl({});
  assert.equal(status.target, "adult-france");
  assert.equal(status.phase, "private-preview");
  assert.equal(status.ready, false);
  assert.ok(status.blockers.some((item) => item.id === "legal-entity"));
  assert.ok(!status.blockers.some((item) => item.id === "minor-safety-review"));
  assert.ok(!status.blockers.some((item) => item.id === "production-commerce"));
}

{
  const status = getAtlasLaunchControl({ ATLAS_LAUNCH_AUDIENCES: "adult,adolescent,senior", ATLAS_ENABLE_PRODUCTION_CHECKOUT: "true" });
  assert.ok(status.blockers.some((item) => item.id === "minor-safety-review"));
  assert.ok(status.blockers.some((item) => item.id === "senior-review"));
  assert.ok(status.blockers.some((item) => item.id === "production-commerce"));
}

{
  const ready = getAtlasLaunchControl({
    ATLAS_LEGAL_ENTITY: "ATLAS SAS",
    ATLAS_TERMS_VERSION: "2026-08-15",
    ATLAS_PRIVACY_VERSION: "2026-08-15",
    ATLAS_SUPPORT_EMAIL: "support@atlas.example",
    ATLAS_PRIVACY_EMAIL: "privacy@atlas.example",
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

console.log("ATLAS launch control tests passed.");
