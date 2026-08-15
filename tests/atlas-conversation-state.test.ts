import assert from "node:assert/strict";
import {
  conversationStateConfigured,
  signConversationState,
  verifyConversationState,
} from "../lib/server/conversation-state.ts";

process.env.ATLAS_CONVERSATION_STATE_SECRET = "atlas-conversation-state-test-secret-2026";
assert.equal(conversationStateConfigured(), true);

const token = signConversationState({
  audience: "adult",
  history: [
    { role: "user", text: "Je suis stressé par mon travail." },
    { role: "assistant", text: "Qu’est-ce qui vous affecte le plus aujourd’hui ?" },
  ],
});
assert.ok(token);

const valid = verifyConversationState(token, "adult");
assert.equal(valid.valid, true);
assert.equal(valid.reason, "valid");
assert.equal(valid.history.length, 2);

const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;
assert.equal(verifyConversationState(tampered, "adult").reason, "invalid_signature");
assert.equal(verifyConversationState(token, "adolescent").reason, "audience_mismatch");
assert.equal(verifyConversationState(null, "adult").reason, "missing");

delete process.env.ATLAS_CONVERSATION_STATE_SECRET;
assert.equal(conversationStateConfigured(), false);
assert.equal(signConversationState({ audience: "adult", history: [] }), null);

console.log("ATLAS signed conversation state tests passed.");
