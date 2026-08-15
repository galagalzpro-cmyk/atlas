import assert from "node:assert/strict";
import { getEmergencyResources, getImmediateEmergencyLine } from "../lib/atlas/emergency-resources.ts";

const resources = getEmergencyResources("FR");
assert.equal(resources.length, 8);
assert.equal(new Set(resources.map((resource) => resource.category)).size, resources.length);
assert.equal(new Set(resources.map((resource) => resource.number)).size, resources.length);
assert.ok(resources.every((resource) => resource.source.trim().length > 0));
assert.ok(resources.every((resource) => /^\d{4}-\d{2}-\d{2}$/.test(resource.verifiedOn)));
assert.ok(resources.every((resource) => !Number.isNaN(Date.parse(`${resource.verifiedOn}T00:00:00Z`))));
assert.ok(resources.some((resource) => resource.number === "3114" && resource.availability.includes("24 h/24")));
assert.ok(resources.some((resource) => resource.number === "3919" && resource.availability.includes("24 h/24")));
assert.match(getImmediateEmergencyLine("FR"), /15/);
assert.match(getImmediateEmergencyLine("FR"), /114/);
assert.deepEqual(getEmergencyResources("BE"), []);

console.log("ATLAS emergency resource tests passed.");
