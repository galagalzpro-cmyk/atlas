import assert from "node:assert/strict";
import { assessSafety } from "../lib/atlas/safety.ts";
import { atlasReducer } from "../lib/atlas/reducer.ts";
import { INITIAL_ATLAS_STATE } from "../lib/atlas/types.ts";
import { hasCapability } from "../lib/atlas/access.ts";
import { canActivateExternalProvider, sanitizeAnalyticsMetadata } from "../lib/atlas/governance.ts";
import { getCommerceReadiness } from "../lib/atlas/commerce.ts";
import { evaluateToolAccess, getAtlasTool } from "../lib/atlas/tools.ts";

const standard = assessSafety("Je dois organiser ma semaine", "adult");
assert.equal(standard.level, "standard");
assert.equal(standard.shouldPauseGeneration, false);

const attention = assessSafety("Je panique et je ne vais pas bien", "adult");
assert.equal(attention.level, "attention");
assert.equal(attention.shouldPauseGeneration, false);

const urgent = assessSafety("Je veux mourir", "adult");
assert.equal(urgent.level, "urgent");
assert.equal(urgent.shouldPauseGeneration, true);
assert.equal(urgent.requiresHumanHelp, true);

const minorAttention = assessSafety("On me harcèle à l'école", "adolescent");
assert.equal(minorAttention.level, "attention");
assert.equal(minorAttention.requiresHumanHelp, true);

const ready = atlasReducer(INITIAL_ATLAS_STATE, { type: "AWAKENING_COMPLETE" });
assert.equal(ready.presence, "ready");
const listening = atlasReducer(ready, { type: "USER_STARTED_INPUT" });
assert.equal(listening.presence, "listening");
const vigilance = atlasReducer(listening, { type: "SAFETY_ALERT" });
assert.equal(vigilance.presence, "vigilance");

assert.equal(hasCapability("visitor", "manage_billing"), false);
assert.equal(hasCapability("organization_admin", "manage_billing"), true);
assert.equal(hasCapability("professional", "manage_platform_configuration"), false);
assert.equal(hasCapability("member", "use_connected_tools"), true);
assert.equal(hasCapability("visitor", "use_connected_tools"), false);

const cleanMetadata = sanitizeAnalyticsMetadata({ audience: "adult", step: 2, message: "private", email: "private@example.com" });
assert.deepEqual(cleanMetadata, { audience: "adult", step: 2 });
assert.equal(canActivateExternalProvider("analytics", { preferences: true, analytics: false, marketing: true }), false);
assert.equal(canActivateExternalProvider("marketing", { preferences: false, analytics: true, marketing: true }), true);

const commerce = getCommerceReadiness({});
assert.equal(commerce.productionCheckoutEnabled, false);
assert.equal(commerce.stripe, false);
assert.equal(commerce.paypal, false);

assert.equal(getAtlasTool("gmail.read")?.approval, "automatic");
assert.equal(getAtlasTool("gmail.send")?.approval, "confirm");
assert.equal(getAtlasTool("vercel.deploy.production")?.approval, "strong_auth");

const automaticRead = evaluateToolAccess({
  role: "member",
  hasCapability,
  toolId: "gmail.read",
  connectionAvailable: true,
});
assert.equal(automaticRead.allowed, true);

const sendWithoutConfirmation = evaluateToolAccess({
  role: "member",
  hasCapability,
  toolId: "gmail.send",
  connectionAvailable: true,
});
assert.equal(sendWithoutConfirmation.allowed, false);
assert.equal(sendWithoutConfirmation.reason, "confirmation_required");

const sendConfirmed = evaluateToolAccess({
  role: "member",
  hasCapability,
  toolId: "gmail.send",
  connectionAvailable: true,
  userConfirmed: true,
});
assert.equal(sendConfirmed.allowed, true);

const productionDeployWithoutStrongAuth = evaluateToolAccess({
  role: "member",
  hasCapability,
  toolId: "vercel.deploy.production",
  connectionAvailable: true,
  userConfirmed: true,
});
assert.equal(productionDeployWithoutStrongAuth.allowed, false);
assert.equal(productionDeployWithoutStrongAuth.reason, "strong_auth_required");

const productionDeployAuthorized = evaluateToolAccess({
  role: "member",
  hasCapability,
  toolId: "vercel.deploy.production",
  connectionAvailable: true,
  strongAuthSatisfied: true,
});
assert.equal(productionDeployAuthorized.allowed, true);

const visitorDenied = evaluateToolAccess({
  role: "visitor",
  hasCapability,
  toolId: "gmail.read",
  connectionAvailable: true,
});
assert.equal(visitorDenied.allowed, false);
assert.equal(visitorDenied.reason, "missing_capability");

console.log("ATLAS runtime, safety, governance and tool-policy tests passed.");
