import assert from "node:assert/strict";
import { planAtlasTurn } from "../lib/atlas/orchestrator.ts";
import { chooseAtlasModelLane, scoreAtlasModelComplexity } from "../lib/atlas/model-routing.ts";
import type { AtlasConversationTurn } from "../lib/atlas/conversation.ts";

function plan(text: string, history: AtlasConversationTurn[] = []) {
  return planAtlasTurn({
    text,
    audience: "adult",
    history,
    externalAiConsent: true,
    memoryConsent: false,
    externalProviderConfigured: true,
  });
}

{
  const text = "Je suis fatigué aujourd’hui.";
  const turnPlan = plan(text);
  const complexity = scoreAtlasModelComplexity({ plan: turnPlan, history: [], text });
  assert.ok(complexity.score <= 4);

  const route = chooseAtlasModelLane({
    plan: turnPlan,
    history: [],
    text,
    powerMode: "maximum",
  });
  assert.equal(route.lane, "balanced");
}

{
  const history: AtlasConversationTurn[] = Array.from({ length: 14 }, (_, index) => ({
    role: index % 2 === 0 ? "user" as const : "assistant" as const,
    text: index % 2 === 0
      ? "Je ne sais plus quoi décider, plusieurs choses se contredisent et j’ai besoin de comprendre ce qui compte vraiment."
      : "Je garde le fil avec vous et je vais éviter de décider à votre place.",
  }));
  const text = "Je dois maintenant choisir entre plusieurs options importantes, mais chaque option a des conséquences différentes et j’ai peur de manquer quelque chose.".repeat(5);
  const turnPlan = plan(text, history);

  const route = chooseAtlasModelLane({
    plan: turnPlan,
    history,
    text,
    powerMode: "maximum",
  });
  assert.equal(route.lane, "deep");
  assert.ok(route.complexityScore >= 5);
}

{
  const text = "Aide-moi à comprendre ce que je ressens.";
  const turnPlan = plan(text);
  const route = chooseAtlasModelLane({
    plan: turnPlan,
    history: [],
    text,
    powerMode: "economy",
  });
  assert.ok(route.lane === "fast" || route.lane === "balanced");
  assert.notEqual(route.lane, "deep");
}

{
  const text = "Je veux une réponse plus précise.";
  const turnPlan = plan(text);
  const generateRoute = chooseAtlasModelLane({
    plan: turnPlan,
    history: [],
    text,
    powerMode: "maximum",
    purpose: "generate",
  });
  const revisionRoute = chooseAtlasModelLane({
    plan: turnPlan,
    history: [],
    text,
    powerMode: "maximum",
    purpose: "revise",
  });
  assert.ok(revisionRoute.complexityScore >= generateRoute.complexityScore);
}
