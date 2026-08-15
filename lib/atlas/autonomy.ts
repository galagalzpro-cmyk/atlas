import type { AtlasConversationTurn } from "./conversation";
import type { SafetyAssessment } from "./safety";
import type { AtlasAudience } from "./types";

export type AtlasHumanNeed =
  | "be_heard"
  | "clarify"
  | "reassure"
  | "decide"
  | "act"
  | "repair"
  | "protect";

export type AtlasResponseMode =
  | "presence"
  | "exploration"
  | "orientation"
  | "repair"
  | "safety";

export type AtlasResponseDepth = "minimal" | "balanced" | "deep";

export interface AtlasAutonomyDecision {
  need: AtlasHumanNeed;
  mode: AtlasResponseMode;
  depth: AtlasResponseDepth;
  shouldAskQuestion: boolean;
  maxQuestions: 0 | 1;
  shouldOfferAction: boolean;
  shouldUseExternalIntelligence: boolean;
  memoryTurns: number;
  uncertainty: number;
  reasons: string[];
}

const LISTENING_ONLY_PATTERNS = [
  "je veux juste parler",
  "j'ai juste besoin de parler",
  "j’ai juste besoin de parler",
  "écoute-moi",
  "écoutez-moi",
  "pas de conseil",
  "je ne veux pas de solution",
  "laisse-moi parler",
  "laissez-moi parler",
];

const REPAIR_PATTERNS = [
  "tu ne comprends pas",
  "vous ne comprenez pas",
  "tu m'as mal compris",
  "vous m'avez mal compris",
  "c'est pas ça",
  "ce n'est pas ça",
  "tu es à côté",
  "vous êtes à côté",
  "je l'ai déjà dit",
  "je l’ai déjà dit",
  "je viens de le dire",
  "pourquoi tu redemandes",
  "pourquoi vous redemandez",
];

const ADVICE_PATTERNS = [
  "que faire",
  "quoi faire",
  "tu me conseilles",
  "vous me conseillez",
  "aide-moi à choisir",
  "aidez-moi à choisir",
  "comment je peux",
  "comment puis-je",
  "donne-moi une solution",
  "donnez-moi une solution",
];

const DECISION_PATTERNS = [
  "choisir",
  "décider",
  "décision",
  "hésite",
  "hésitation",
  "deux options",
  "je ne sais pas lequel",
  "je ne sais pas laquelle",
];

const DISTRESS_PATTERNS = [
  "je suis perdu",
  "je suis perdue",
  "je n'en peux plus",
  "je n’en peux plus",
  "je craque",
  "je suis épuisé",
  "je suis épuisée",
  "je me sens vide",
  "je me sens seul",
  "je me sens seule",
  "j'ai peur",
  "j’ai peur",
  "je panique",
];

function includesAny(text: string, patterns: string[]): boolean {
  return patterns.some((pattern) => text.includes(pattern));
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countUserTurns(history: AtlasConversationTurn[]): number {
  return history.filter((turn) => turn.role === "user").length;
}

function countRepairSignals(history: AtlasConversationTurn[]): number {
  return history
    .filter((turn) => turn.role === "user")
    .filter((turn) => includesAny(turn.text.toLowerCase(), REPAIR_PATTERNS))
    .length;
}

function audienceDepthLimit(audience: AtlasAudience, wordCount: number): AtlasResponseDepth {
  if (audience === "senior") return wordCount > 80 ? "balanced" : "minimal";
  if (wordCount > 120) return "deep";
  if (wordCount > 35) return "balanced";
  return "minimal";
}

export function decideAtlasAutonomy(input: {
  text: string;
  audience: AtlasAudience;
  safety: SafetyAssessment;
  history: AtlasConversationTurn[];
}): AtlasAutonomyDecision {
  const lower = input.text.toLowerCase().trim();
  const words = countWords(input.text);
  const userTurns = countUserTurns(input.history);
  const repairSignals = countRepairSignals(input.history);
  const reasons: string[] = [];

  if (input.safety.level === "urgent" || input.safety.shouldPauseGeneration) {
    return {
      need: "protect",
      mode: "safety",
      depth: "minimal",
      shouldAskQuestion: false,
      maxQuestions: 0,
      shouldOfferAction: true,
      shouldUseExternalIntelligence: false,
      memoryTurns: 12,
      uncertainty: 0.05,
      reasons: ["urgent_safety_signal"],
    };
  }

  if (input.safety.level === "attention") {
    return {
      need: "protect",
      mode: "safety",
      depth: "minimal",
      shouldAskQuestion: false,
      maxQuestions: 0,
      shouldOfferAction: false,
      shouldUseExternalIntelligence: false,
      memoryTurns: 16,
      uncertainty: 0.15,
      reasons: ["safety_attention_signal"],
    };
  }

  if (includesAny(lower, REPAIR_PATTERNS)) {
    return {
      need: "repair",
      mode: "repair",
      depth: "minimal",
      shouldAskQuestion: true,
      maxQuestions: 1,
      shouldOfferAction: false,
      shouldUseExternalIntelligence: true,
      memoryTurns: 24,
      uncertainty: Math.min(0.95, 0.55 + repairSignals * 0.1),
      reasons: ["explicit_repair_request", "preserve_existing_context"],
    };
  }

  if (includesAny(lower, LISTENING_ONLY_PATTERNS)) {
    reasons.push("explicit_listening_preference");
    return {
      need: "be_heard",
      mode: "presence",
      depth: audienceDepthLimit(input.audience, words),
      shouldAskQuestion: words < 30,
      maxQuestions: words < 30 ? 1 : 0,
      shouldOfferAction: false,
      shouldUseExternalIntelligence: true,
      memoryTurns: 24,
      uncertainty: 0.2,
      reasons,
    };
  }

  if (includesAny(lower, ADVICE_PATTERNS)) {
    reasons.push("explicit_request_for_help");
    return {
      need: includesAny(lower, DECISION_PATTERNS) ? "decide" : "act",
      mode: "orientation",
      depth: audienceDepthLimit(input.audience, words),
      shouldAskQuestion: words < 20,
      maxQuestions: words < 20 ? 1 : 0,
      shouldOfferAction: true,
      shouldUseExternalIntelligence: true,
      memoryTurns: 24,
      uncertainty: words < 20 ? 0.55 : 0.3,
      reasons,
    };
  }

  if (includesAny(lower, DECISION_PATTERNS)) {
    reasons.push("decision_conflict_detected");
    return {
      need: "decide",
      mode: "exploration",
      depth: audienceDepthLimit(input.audience, words),
      shouldAskQuestion: true,
      maxQuestions: 1,
      shouldOfferAction: false,
      shouldUseExternalIntelligence: true,
      memoryTurns: 24,
      uncertainty: 0.35,
      reasons,
    };
  }

  if (includesAny(lower, DISTRESS_PATTERNS)) {
    reasons.push("emotional_distress_detected");
    return {
      need: words > 45 ? "be_heard" : "reassure",
      mode: "presence",
      depth: audienceDepthLimit(input.audience, words),
      shouldAskQuestion: words < 45,
      maxQuestions: words < 45 ? 1 : 0,
      shouldOfferAction: false,
      shouldUseExternalIntelligence: true,
      memoryTurns: 24,
      uncertainty: 0.3,
      reasons,
    };
  }

  if (words > 90) {
    reasons.push("long_disclosure");
    return {
      need: "be_heard",
      mode: "presence",
      depth: "deep",
      shouldAskQuestion: false,
      maxQuestions: 0,
      shouldOfferAction: false,
      shouldUseExternalIntelligence: true,
      memoryTurns: 24,
      uncertainty: 0.25,
      reasons,
    };
  }

  if (userTurns === 0) {
    reasons.push("conversation_opening");
    return {
      need: "clarify",
      mode: "exploration",
      depth: "minimal",
      shouldAskQuestion: true,
      maxQuestions: 1,
      shouldOfferAction: false,
      shouldUseExternalIntelligence: true,
      memoryTurns: 18,
      uncertainty: 0.6,
      reasons,
    };
  }

  reasons.push("continue_existing_thread");
  return {
    need: "clarify",
    mode: "exploration",
    depth: audienceDepthLimit(input.audience, words),
    shouldAskQuestion: true,
    maxQuestions: 1,
    shouldOfferAction: false,
    shouldUseExternalIntelligence: true,
    memoryTurns: 24,
    uncertainty: 0.4,
    reasons,
  };
}

export function describeAtlasAutonomyDecision(decision: AtlasAutonomyDecision): string {
  return [
    `Besoin humain estimé : ${decision.need}.`,
    `Mode de réponse : ${decision.mode}.`,
    `Profondeur : ${decision.depth}.`,
    decision.shouldAskQuestion
      ? "Tu peux poser une seule question réellement nécessaire."
      : "Ne pose aucune question dans cette réponse.",
    decision.shouldOfferAction
      ? "Une action concrète peut être proposée sans l'imposer."
      : "N'impose aucune action et ne transforme pas l'échange en plan.",
    `Niveau d'incertitude interne : ${decision.uncertainty.toFixed(2)}. Plus il est élevé, plus tu dois rester prudent et ouvert.`,
  ].join(" ");
}
