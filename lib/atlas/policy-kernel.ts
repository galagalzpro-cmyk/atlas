import type { AtlasCognitiveState } from "./cognitive-state";

export interface AtlasPolicyKernelInput {
  cognitive: AtlasCognitiveState;
  externalAiConsent: boolean;
  memoryConsent: boolean;
  externalProviderConfigured: boolean;
}

export interface AtlasPolicyDecision {
  version: "4.0";
  externalGenerationAllowed: boolean;
  automaticExternalActionsAllowed: false;
  liveHumanMonitoringAllowed: false;
  rawConversationLoggingAllowed: false;
  persistentMemoryWriteAllowed: boolean;
  maxQuestions: 0 | 1;
  maxResponseCharacters: number;
  maxRevisions: 0 | 1;
  requiredBehaviors: string[];
  prohibitedBehaviors: string[];
  reasons: string[];
}

function responseLimit(cognitive: AtlasCognitiveState): number {
  if (cognitive.safety.level !== "standard") return 900;
  if (cognitive.relational.responseLength === "very_short") return 520;
  if (cognitive.relational.responseLength === "short") return 900;
  if (cognitive.relational.responseLength === "developed") return 2400;
  return 1500;
}

export function evaluateAtlasPolicy(input: AtlasPolicyKernelInput): AtlasPolicyDecision {
  const reasons: string[] = [];
  const requiredBehaviors = [
    "preserve_user_agency",
    "represent_uncertainty_honestly",
    "respect_memory_corrections_and_refusals",
    "remain_transparent_as_a_digital_system",
    "allow_the_person_to_end_the_exchange_freely",
  ];
  const prohibitedBehaviors = [
    "claim_to_be_human",
    "claim_exact_knowledge_of_the_person_inner_state",
    "diagnose_or_prescribe",
    "create_exclusivity_or_emotional_debt",
    "pressure_the_person_to_continue_or_return",
    "perform_automatic_external_contact",
    "transmit_the_conversation_to_an_authority_or_person",
    "log_raw_conversation_content",
    "optimize_for_dependency_or_session_duration",
  ];

  if (input.cognitive.relational.maxQuestions === 0) {
    requiredBehaviors.push("do_not_ask_a_question_this_turn");
  }
  if (input.cognitive.relational.shouldLeaveSpace) {
    requiredBehaviors.push("leave_conversational_space");
  }
  if (input.cognitive.relational.mode === "repair") {
    requiredBehaviors.push("repair_before_exploring");
  }
  if (input.cognitive.overallConfidence < 0.58) {
    requiredBehaviors.push("use_tentative_language");
  }
  if (input.cognitive.safety.level !== "standard") {
    requiredBehaviors.push("safety_overrides_ordinary_conversation");
  }

  const externalGenerationAllowed =
    input.externalAiConsent &&
    input.externalProviderConfigured &&
    input.cognitive.safety.level === "standard" &&
    !input.cognitive.safety.shouldPauseGeneration;

  if (!input.externalAiConsent) reasons.push("external_generation_requires_explicit_consent");
  if (!input.externalProviderConfigured) reasons.push("external_provider_not_configured");
  if (input.cognitive.safety.level !== "standard") reasons.push("local_safety_policy_has_priority");
  if (input.memoryConsent) reasons.push("persistent_memory_may_be_considered_but_is_not_automatic");
  if (!input.memoryConsent) reasons.push("memory_is_limited_to_the_current_working_session");

  return {
    version: "4.0",
    externalGenerationAllowed,
    automaticExternalActionsAllowed: false,
    liveHumanMonitoringAllowed: false,
    rawConversationLoggingAllowed: false,
    persistentMemoryWriteAllowed: input.memoryConsent,
    maxQuestions: input.cognitive.relational.maxQuestions,
    maxResponseCharacters: responseLimit(input.cognitive),
    maxRevisions: input.cognitive.safety.level === "standard" ? 1 : 0,
    requiredBehaviors,
    prohibitedBehaviors,
    reasons,
  };
}

export function describeAtlasPolicy(policy: AtlasPolicyDecision): string {
  return [
    `Policy kernel ${policy.version}.`,
    `External generation allowed: ${policy.externalGenerationAllowed}.`,
    `Automatic external actions allowed: ${policy.automaticExternalActionsAllowed}.`,
    `Maximum questions: ${policy.maxQuestions}.`,
    `Maximum response characters: ${policy.maxResponseCharacters}.`,
    `Maximum revisions: ${policy.maxRevisions}.`,
    `Required: ${policy.requiredBehaviors.join(", ")}.`,
    `Prohibited: ${policy.prohibitedBehaviors.join(", ")}.`,
  ].join(" ");
}
