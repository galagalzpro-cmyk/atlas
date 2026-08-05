import { assessSafety } from "./safety.ts";
import { decideAtlasAutonomy } from "./autonomy.ts";
import {
  inferAtlasEmotionalState,
  refineAtlasAutonomy,
  adaptAtlasLocalReply,
} from "./emotional-intelligence.ts";
import { buildConversationMemory } from "./memory.ts";
import { buildAtlasRelationalState } from "./relational-core.ts";
import { buildAtlasCognitiveState } from "./cognitive-state.ts";
import { evaluateAtlasPolicy } from "./policy-kernel.ts";
import { buildReply, type AtlasConversationTurn, type AtlasReply } from "./conversation.ts";
import type { AtlasAudience } from "./types.ts";

export interface AtlasTurnPlan {
  safety: ReturnType<typeof assessSafety>;
  emotional: ReturnType<typeof inferAtlasEmotionalState>;
  autonomy: ReturnType<typeof refineAtlasAutonomy>;
  memory: ReturnType<typeof buildConversationMemory>;
  relational: ReturnType<typeof buildAtlasRelationalState>;
  cognitive: ReturnType<typeof buildAtlasCognitiveState>;
  policy: ReturnType<typeof evaluateAtlasPolicy>;
  localFallback: AtlasReply;
}

export function planAtlasTurn(input: {
  text: string;
  audience: AtlasAudience;
  history: AtlasConversationTurn[];
  externalAiConsent: boolean;
  memoryConsent: boolean;
  externalProviderConfigured: boolean;
}): AtlasTurnPlan {
  const safety = assessSafety(input.text, input.audience);
  const emotional = inferAtlasEmotionalState({
    text: input.text,
    audience: input.audience,
    history: input.history,
  });
  const autonomy = refineAtlasAutonomy(
    decideAtlasAutonomy({
      text: input.text,
      audience: input.audience,
      safety,
      history: input.history,
    }),
    emotional,
  );
  const memory = buildConversationMemory(input.history, input.text);
  const relational = buildAtlasRelationalState({
    text: input.text,
    audience: input.audience,
    history: input.history,
    safety,
    emotional,
    autonomy,
  });
  const cognitive = buildAtlasCognitiveState({
    text: input.text,
    audience: input.audience,
    history: input.history,
    emotional,
    relational,
    autonomy,
    safety,
    memory,
  });
  const policy = evaluateAtlasPolicy({
    cognitive,
    externalAiConsent: input.externalAiConsent,
    memoryConsent: input.memoryConsent,
    externalProviderConfigured: input.externalProviderConfigured,
  });
  const rawLocalReply = buildReply(input.text, input.audience, safety, input.history);
  const localFallback = adaptAtlasLocalReply(rawLocalReply, emotional, input.audience);

  return {
    safety,
    emotional,
    autonomy,
    memory,
    relational,
    cognitive,
    policy,
    localFallback,
  };
}

export function describeAtlasTurnPlan(plan: AtlasTurnPlan): string {
  return [
    `goal=${plan.cognitive.primaryGoal}`,
    `topic=${plan.cognitive.primaryTopic}`,
    `mode=${plan.relational.mode}`,
    `nextMove=${plan.cognitive.nextMove}`,
    `confidence=${plan.cognitive.overallConfidence.toFixed(2)}`,
    `external=${plan.policy.externalGenerationAllowed}`,
    `questions=${plan.policy.maxQuestions}`,
    `revisions=${plan.policy.maxRevisions}`,
  ].join(" | ");
}
