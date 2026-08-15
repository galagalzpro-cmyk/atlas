import assert from "node:assert/strict";
import { assessSafety } from "../lib/atlas/safety.ts";
import { buildConversationMemory } from "../lib/atlas/memory.ts";
import { decideAtlasAutonomy } from "../lib/atlas/autonomy.ts";
import {
  adaptAtlasLocalReply,
  inferAtlasEmotionalState,
  refineAtlasAutonomy,
  validateAtlasEmotionalFit,
} from "../lib/atlas/emotional-intelligence.ts";
import { buildReply, type AtlasConversationTurn } from "../lib/atlas/conversation.ts";
import { validateAtlasPresenceReply } from "../lib/atlas/presence.ts";

function state(text: string, history: AtlasConversationTurn[] = []) {
  const safety = assessSafety(text, "adult");
  const emotional = inferAtlasEmotionalState({ text, audience: "adult", history });
  const autonomy = refineAtlasAutonomy(
    decideAtlasAutonomy({ text, audience: "adult", safety, history }),
    emotional,
  );
  return { safety, emotional, autonomy };
}

{
  const history: AtlasConversationTurn[] = [
    { role: "assistant", text: "Depuis quand cela dure-t-il ?" },
    { role: "user", text: "Depuis trois mois, et je préfère ne pas parler de mon responsable." },
    { role: "assistant", text: "Qu’est-ce qui vous pèse le plus ?" },
    { role: "user", text: "En fait, ce n’est pas mon travail, c’est ma situation familiale." },
  ];
  const memory = buildConversationMemory(history);
  assert.equal(memory.askedQuestions.length, 2);
  assert.equal(memory.corrections.length, 1);
  assert.equal(memory.preferences.length, 1);
  assert.ok(memory.corrections[0].includes("situation familiale"));
}

{
  const history: AtlasConversationTurn[] = [
    { role: "assistant", text: "Qu’est-ce qui vous pèse le plus aujourd’hui ?" },
    { role: "user", text: "La solitude." },
  ];
  const reply = "Qu’est-ce qui vous pèse le plus aujourd’hui ?";
  const result = validateAtlasPresenceReply({ reply, latestUserText: "La solitude.", history });
  assert.equal(result.valid, false);
  assert.ok(result.reasons.includes("repeated_question"));
}

{
  const text = "Je n’en peux plus, tout s’accumule, je n’arrive même plus à réfléchir !!!";
  const { emotional, autonomy } = state(text);
  assert.equal(emotional.openness, "flooded");
  assert.equal(emotional.questionTolerance, "none");
  assert.equal(autonomy.shouldAskQuestion, false);
  assert.equal(autonomy.shouldOfferAction, false);

  const raw = buildReply(text, "adult", assessSafety(text, "adult"), []);
  const adapted = adaptAtlasLocalReply(raw, emotional, "adult");
  assert.equal(adapted.text.includes("?"), false);
}

{
  const text = "Tu ne comprends pas, je viens déjà de l’expliquer.";
  const { emotional, autonomy } = state(text);
  assert.equal(emotional.relationalSignal, "rupture");
  assert.equal(autonomy.mode, "repair");
  assert.equal(autonomy.shouldOfferAction, false);
}

{
  const text = "Je veux juste parler, pas de conseil.";
  const { emotional, autonomy } = state(text);
  assert.equal(emotional.need, "be_heard");
  assert.equal(autonomy.need, "be_heard");
  assert.equal(autonomy.shouldOfferAction, false);
}

{
  const text = "Je me sens dispersé et je ne sais pas par quoi commencer.";
  const reply = buildReply(text, "adult", assessSafety(text, "adult"), []);
  assert.ok(reply.text.includes("réduire le champ"));
  assert.ok(reply.text.includes("ne peut vraiment pas attendre"));
  assert.equal(reply.text.includes("laisser cette question de côté"), false);
}

{
  const text = "Je ne sais pas.";
  const reply = buildReply(text, "adult", assessSafety(text, "adult"), []);
  assert.ok(reply.text.includes("laisser cette question de côté"));
}

{
  const text = "Je veux mourir.";
  const safety = assessSafety(text, "adult");
  assert.equal(safety.level, "urgent");
  assert.equal(safety.shouldPauseGeneration, true);
}

{
  const emotional = inferAtlasEmotionalState({
    text: "Je suis complètement submergé et je ne peux plus réfléchir.",
    audience: "adult",
    history: [],
  });
  const fit = validateAtlasEmotionalFit({
    reply: "Voici un plan en cinq étapes. Première étape : prenez une feuille. Que voulez-vous faire ensuite ?",
    emotional,
  });
  assert.equal(fit.valid, false);
}

console.log("ATLAS core conversation, memory and emotional governance tests passed.");
