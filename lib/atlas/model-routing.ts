import type { AtlasTurnPlan } from "./orchestrator.ts";
import type { AtlasConversationTurn } from "./conversation.ts";

export type AtlasOpenAIPowerMode = "economy" | "balanced" | "maximum";
export type AtlasModelLane = "fast" | "balanced" | "deep";

export interface AtlasModelRoutingDecision {
  lane: AtlasModelLane;
  complexityScore: number;
  reasons: string[];
}

export function scoreAtlasModelComplexity(input: {
  plan: AtlasTurnPlan;
  history: AtlasConversationTurn[];
  text: string;
  purpose?: "generate" | "revise";
}): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  if (input.text.length >= 900) {
    score += 2;
    reasons.push("long_user_input");
  } else if (input.text.length >= 420) {
    score += 1;
    reasons.push("medium_user_input");
  }

  if (input.history.length >= 12) {
    score += 2;
    reasons.push("long_conversation_context");
  } else if (input.history.length >= 6) {
    score += 1;
    reasons.push("multi_turn_context");
  }

  if (input.plan.cognitive.hypotheses.length >= 3) {
    score += 1;
    reasons.push("multiple_interpretation_hypotheses");
  }

  if (input.plan.cognitive.secondaryTopics.length >= 2) {
    score += 1;
    reasons.push("multiple_topics");
  }

  if (input.plan.cognitive.contradictions.length > 0) {
    score += 2;
    reasons.push("conversation_contradiction");
  }

  if (input.plan.cognitive.overallConfidence < 0.52) {
    score += 2;
    reasons.push("low_cognitive_confidence");
  } else if (input.plan.cognitive.overallConfidence < 0.68) {
    score += 1;
    reasons.push("moderate_cognitive_uncertainty");
  }

  if (["understand", "clarify", "decide", "repair"].includes(input.plan.cognitive.primaryGoal)) {
    score += 1;
    reasons.push("reasoning_heavy_goal");
  }

  if (input.plan.relational.responseLength === "developed") {
    score += 1;
    reasons.push("developed_response_requested");
  }

  if (input.purpose === "revise") {
    score += 1;
    reasons.push("guardrail_revision");
  }

  return { score, reasons };
}

export function chooseAtlasModelLane(input: {
  plan: AtlasTurnPlan;
  history: AtlasConversationTurn[];
  text: string;
  powerMode: AtlasOpenAIPowerMode;
  purpose?: "generate" | "revise";
}): AtlasModelRoutingDecision {
  const complexity = scoreAtlasModelComplexity(input);

  if (input.powerMode === "economy") {
    return {
      lane: complexity.score >= 6 ? "balanced" : "fast",
      complexityScore: complexity.score,
      reasons: ["power_mode_economy", ...complexity.reasons],
    };
  }

  if (input.powerMode === "balanced") {
    return {
      lane: complexity.score >= 4 ? "balanced" : "fast",
      complexityScore: complexity.score,
      reasons: ["power_mode_balanced", ...complexity.reasons],
    };
  }

  return {
    lane: complexity.score >= 5 ? "deep" : "balanced",
    complexityScore: complexity.score,
    reasons: ["power_mode_maximum", ...complexity.reasons],
  };
}
