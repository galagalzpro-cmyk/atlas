import type { AtlasAutonomyDecision } from "./autonomy";
import type { AtlasConversationTurn } from "./conversation";
import type { AtlasEmotionalState } from "./emotional-intelligence";
import type { SafetyAssessment } from "./safety";
import type { AtlasAudience } from "./types";

export type AtlasRelationalMode =
  | "receive"
  | "accompany"
  | "explore"
  | "clarify"
  | "ground"
  | "orient"
  | "repair"
  | "protect"
  | "close";

export type AtlasConversationRhythm = "still" | "slow" | "natural" | "direct";
export type AtlasDepthPermission = "surface" | "emerging" | "open";
export type AtlasResponseLength = "very_short" | "short" | "balanced" | "developed";

export interface AtlasRelationalState {
  mode: AtlasRelationalMode;
  rhythm: AtlasConversationRhythm;
  depthPermission: AtlasDepthPermission;
  responseLength: AtlasResponseLength;
  trustEstimate: number;
  continuityEstimate: number;
  ruptureRisk: number;
  userControl: number;
  maxQuestions: 0 | 1;
  shouldReflectMeaning: boolean;
  shouldReferenceContinuity: boolean;
  shouldOfferAction: boolean;
  shouldLeaveSpace: boolean;
  shouldAcknowledgeUncertainty: boolean;
  shouldCloseGently: boolean;
  reasons: string[];
}

export interface AtlasRelationalInput {
  text: string;
  audience: AtlasAudience;
  history: AtlasConversationTurn[];
  safety: SafetyAssessment;
  emotional: AtlasEmotionalState;
  autonomy: AtlasAutonomyDecision;
  previous?: AtlasRelationalState | null;
}

const LISTENING_SIGNALS = [
  "je veux juste parler",
  "j ai juste besoin de parler",
  "ecoute moi",
  "pas de conseil",
  "je ne veux pas de solution",
  "laisse moi parler",
];

const RUPTURE_SIGNALS = [
  "tu ne comprends pas",
  "vous ne comprenez pas",
  "tu m as mal compris",
  "vous m avez mal compris",
  "ce n est pas ca",
  "c est pas ca",
  "je l ai deja dit",
  "pourquoi tu redemandes",
  "laisse tomber",
];

const CLOSING_SIGNALS = [
  "merci",
  "ca va mieux",
  "je vais m arreter la",
  "on peut s arreter",
  "a bientot",
  "bonne nuit",
  "je reviendrai",
];

const CONTROL_SIGNALS = [
  "je veux",
  "je prefere",
  "je ne veux pas",
  "pas maintenant",
  "on peut",
  "je choisis",
  "j aimerais",
];

const DEEP_DISCLOSURE_SIGNALS = [
  "je n en ai jamais parle",
  "je ne l ai dit a personne",
  "j ai besoin de te dire",
  "voila ce qui s est vraiment passe",
  "je vais etre honnete",
  "je vais tout expliquer",
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9!?\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function includesAny(value: string, patterns: string[]): boolean {
  return patterns.some((pattern) => value.includes(pattern));
}

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function userTurns(history: AtlasConversationTurn[]): AtlasConversationTurn[] {
  return history.filter((turn) => turn.role === "user");
}

function assistantTurns(history: AtlasConversationTurn[]): AtlasConversationTurn[] {
  return history.filter((turn) => turn.role === "assistant");
}

function questionCount(value: string): number {
  return (value.match(/\?/g) || []).length;
}

function estimateContinuity(history: AtlasConversationTurn[]): number {
  const users = userTurns(history).length;
  const assistants = assistantTurns(history).length;
  if (users === 0) return 0.08;
  const balance = 1 - Math.min(1, Math.abs(users - assistants) / Math.max(1, users));
  return clamp(0.18 + Math.min(0.58, users * 0.06) + balance * 0.2);
}

function estimateTrust(input: AtlasRelationalInput, normalized: string): number {
  const words = wordCount(input.text);
  const previous = input.previous?.trustEstimate ?? 0.2;
  const disclosure = words >= 80 ? 0.16 : words >= 35 ? 0.09 : 0;
  const deepDisclosure = includesAny(normalized, DEEP_DISCLOSURE_SIGNALS) ? 0.16 : 0;
  const explicitPreference = includesAny(normalized, CONTROL_SIGNALS) ? 0.04 : 0;
  const repairPenalty = includesAny(normalized, RUPTURE_SIGNALS) ? 0.28 : 0;
  const guardedPenalty = input.emotional.openness === "guarded" ? 0.05 : 0;
  const historyGain = Math.min(0.18, userTurns(input.history).length * 0.018);
  return clamp(previous * 0.62 + 0.16 + disclosure + deepDisclosure + explicitPreference + historyGain - repairPenalty - guardedPenalty);
}

function estimateRuptureRisk(input: AtlasRelationalInput, normalized: string): number {
  const explicit = includesAny(normalized, RUPTURE_SIGNALS) || input.emotional.relationalSignal === "rupture";
  const prior = input.previous?.ruptureRisk ?? 0;
  const repeatedQuestions = assistantTurns(input.history)
    .slice(-3)
    .reduce((total, turn) => total + questionCount(turn.text), 0);
  const questionPressure = repeatedQuestions >= 3 && input.emotional.questionTolerance !== "normal" ? 0.18 : 0;
  const lowControl = input.autonomy.shouldAskQuestion && includesAny(normalized, LISTENING_SIGNALS) ? 0.2 : 0;
  return clamp((explicit ? 0.78 : prior * 0.42) + questionPressure + lowControl);
}

function inferDepth(input: AtlasRelationalInput, normalized: string, trust: number): AtlasDepthPermission {
  if (input.emotional.openness === "guarded" || input.emotional.openness === "flooded") return "surface";
  if (includesAny(normalized, DEEP_DISCLOSURE_SIGNALS) || (trust >= 0.68 && wordCount(input.text) >= 55)) return "open";
  if (wordCount(input.text) >= 22 || trust >= 0.42) return "emerging";
  return "surface";
}

function inferMode(input: AtlasRelationalInput, normalized: string, ruptureRisk: number): AtlasRelationalMode {
  if (input.safety.level !== "standard") return "protect";
  if (ruptureRisk >= 0.55 || input.autonomy.mode === "repair") return "repair";
  if (includesAny(normalized, CLOSING_SIGNALS) && wordCount(input.text) <= 18) return "close";
  if (input.emotional.openness === "flooded" || input.emotional.need === "containment") return "ground";
  if (includesAny(normalized, LISTENING_SIGNALS) || input.autonomy.mode === "presence") {
    return wordCount(input.text) >= 45 ? "accompany" : "receive";
  }
  if (input.autonomy.mode === "orientation" || input.emotional.need === "action" || input.emotional.need === "decision") {
    return "orient";
  }
  if (input.emotional.need === "clarity" || input.autonomy.need === "clarify") return "clarify";
  if (input.autonomy.mode === "exploration") return "explore";
  return "accompany";
}

function inferRhythm(input: AtlasRelationalInput, mode: AtlasRelationalMode): AtlasConversationRhythm {
  if (mode === "close") return "still";
  if (mode === "protect" || mode === "orient") return "direct";
  if (
    mode === "ground" ||
    mode === "repair" ||
    input.emotional.pacing === "slow" ||
    input.emotional.openness === "flooded"
  ) return "slow";
  if (mode === "receive") return "still";
  return "natural";
}

function inferLength(
  input: AtlasRelationalInput,
  mode: AtlasRelationalMode,
  depth: AtlasDepthPermission,
): AtlasResponseLength {
  if (mode === "protect" || mode === "repair" || mode === "close") return "very_short";
  if (input.emotional.openness === "flooded" || input.emotional.questionTolerance === "none") return "very_short";
  if (mode === "receive" || depth === "surface") return "short";
  if (depth === "open" && wordCount(input.text) >= 80) return "developed";
  return "balanced";
}

function inferUserControl(input: AtlasRelationalInput, normalized: string): number {
  const explicitControl = includesAny(normalized, CONTROL_SIGNALS) ? 0.18 : 0;
  const respectedPreference = input.autonomy.need === "be_heard" && !input.autonomy.shouldOfferAction ? 0.16 : 0;
  const questionPenalty = input.autonomy.shouldAskQuestion && input.emotional.questionTolerance === "none" ? 0.24 : 0;
  return clamp(0.58 + explicitControl + respectedPreference - questionPenalty);
}

export function buildAtlasRelationalState(input: AtlasRelationalInput): AtlasRelationalState {
  const normalized = normalize(input.text);
  const reasons: string[] = [];
  const trustEstimate = estimateTrust(input, normalized);
  const continuityEstimate = estimateContinuity(input.history);
  const ruptureRisk = estimateRuptureRisk(input, normalized);
  const depthPermission = inferDepth(input, normalized, trustEstimate);
  const mode = inferMode(input, normalized, ruptureRisk);
  const rhythm = inferRhythm(input, mode);
  const responseLength = inferLength(input, mode, depthPermission);
  const userControl = inferUserControl(input, normalized);

  if (input.safety.level !== "standard") reasons.push("safety_overrides_ordinary_relation");
  if (ruptureRisk >= 0.55) reasons.push("relationship_requires_repair");
  if (input.emotional.openness === "flooded") reasons.push("reduce_cognitive_load");
  if (includesAny(normalized, LISTENING_SIGNALS)) reasons.push("explicit_permission_to_listen_only");
  if (depthPermission === "open") reasons.push("deeper_disclosure_is_present_but_not_unlimited_permission");
  if (input.emotional.confidence < 0.55) reasons.push("emotional_interpretation_is_uncertain");
  if (continuityEstimate >= 0.55) reasons.push("conversation_has_established_continuity");

  const noQuestion =
    mode === "receive" ||
    mode === "ground" ||
    mode === "repair" ||
    mode === "close" ||
    input.emotional.questionTolerance === "none" ||
    includesAny(normalized, LISTENING_SIGNALS);

  const maxQuestions: 0 | 1 = noQuestion ? 0 : 1;
  const shouldOfferAction =
    mode === "orient" &&
    input.emotional.actionReadiness !== "low" &&
    input.safety.level === "standard";

  return {
    mode,
    rhythm,
    depthPermission,
    responseLength,
    trustEstimate,
    continuityEstimate,
    ruptureRisk,
    userControl,
    maxQuestions,
    shouldReflectMeaning: mode !== "protect" && mode !== "close",
    shouldReferenceContinuity: continuityEstimate >= 0.45 && ruptureRisk < 0.55,
    shouldOfferAction,
    shouldLeaveSpace: mode === "receive" || mode === "accompany" || mode === "ground",
    shouldAcknowledgeUncertainty: input.emotional.confidence < 0.55 || depthPermission === "surface",
    shouldCloseGently: mode === "close",
    reasons,
  };
}

export function describeAtlasRelationalState(state: AtlasRelationalState): string {
  return [
    `mode=${state.mode}`,
    `rhythm=${state.rhythm}`,
    `depth=${state.depthPermission}`,
    `length=${state.responseLength}`,
    `trust=${state.trustEstimate.toFixed(2)}`,
    `continuity=${state.continuityEstimate.toFixed(2)}`,
    `rupture=${state.ruptureRisk.toFixed(2)}`,
    `control=${state.userControl.toFixed(2)}`,
    `maxQuestions=${state.maxQuestions}`,
    `offerAction=${state.shouldOfferAction}`,
    `leaveSpace=${state.shouldLeaveSpace}`,
  ].join(" | ");
}
