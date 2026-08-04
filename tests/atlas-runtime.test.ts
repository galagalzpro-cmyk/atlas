import assert from "node:assert/strict";
import { assessSafety } from "../lib/atlas/safety.ts";
import { atlasReducer } from "../lib/atlas/reducer.ts";
import { INITIAL_ATLAS_STATE } from "../lib/atlas/types.ts";

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

console.log("ATLAS runtime and safety tests passed.");
