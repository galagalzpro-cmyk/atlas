import type { AtlasAutonomyDecision, AtlasHumanNeed } from "./autonomy";
import type { AtlasConversationTurn } from "./conversation";
import type { AtlasEmotion, AtlasEmotionalState } from "./emotional-intelligence";
import type { AtlasConversationMemory } from "./memory";
import type { AtlasRelationalState } from "./relational-core";
import type { SafetyAssessment } from "./safety";
import type { AtlasAudience } from "./types";

export type AtlasUserGoal =
  | "express"
  | "understand"
  | "calm"
  | "clarify"
  | "decide"
  | "act"
  | "connect"
  | "repair"
  | "protect"
  | "rest"
  | "close"
  | "unknown";

export type AtlasTopic =
  | "self"
  | "relationship"
  | "family"
  | "work"
  | "education"
  | "health"
  | "grief"
  | "money"
  | "housing"
  | "administration"
  | "violence"
  | "harassment"
  | "digital_life"
  | "identity"
  | "meaning"
  | "decision"
  | "daily_life"
  | "unknown";

export type AtlasNextMove =
  | "hold_space"
  | "reflect_meaning"
  | "name_uncertainty"
  | "ask_one_question"
  | "organize_experience"
  | "offer_grounding"
  | "offer_options"
  | "repair_understanding"
  | "give_safety_direction"
  | "close_gently";

export interface AtlasInterpretationHypothesis {
  id: string;
  summary: string;
  probableGoal: AtlasUserGoal;
  probableNeed: AtlasHumanNeed;
  probableEmotion: AtlasEmotion;
  confidence: number;
  supportingSignals: string[];
  counterSignals: string[];
  mustNotBeTreatedAsFact: true;
}

export interface AtlasCognitiveConstraint {
  type:
    | "safety"
    | "memory"
    | "preference"
    | "refusal"
    | "question_tolerance"
    | "depth"
    | "uncertainty"
    | "relation";
  description: string;
  priority: "absolute" | "high" | "normal";
}

export interface AtlasCognitiveState {
  version: "3.0";
  audience: AtlasAudience;
  primaryGoal: AtlasUserGoal;
  primaryTopic: AtlasTopic;
  secondaryTopics: AtlasTopic[];
  hypotheses: AtlasInterpretationHypothesis[];
  emotional: AtlasEmotionalState;
  relational: AtlasRelationalState;
  autonomy: AtlasAutonomyDecision;
  safety: SafetyAssessment;
  memory: AtlasConversationMemory;
  unresolvedThreads: string[];
  contradictions: string[];
  constraints: AtlasCognitiveConstraint[];
  nextMove: AtlasNextMove;
  reasonNotToAskQuestion: string | null;
  overallConfidence: number;
  generatedAt: string;
}

export interface AtlasCognitiveStateInput {
  text: string;
  audience: AtlasAudience;
  history: AtlasConversationTurn[];
  emotional: AtlasEmotionalState;
  relational: AtlasRelationalState;
  autonomy: AtlasAutonomyDecision;
  safety: SafetyAssessment;
  memory: AtlasConversationMemory;
}

const TOPIC_PATTERNS: Record<Exclude<AtlasTopic, "unknown">, string[]> = {
  self: ["moi", "je suis", "je me sens", "confiance en moi", "estime de moi"],
  relationship: ["couple", "relation", "partenaire", "copain", "copine", "mari", "femme", "rupture", "amour"],
  family: ["famille", "mere", "pere", "parent", "frere", "soeur", "enfant", "fils", "fille"],
  work: ["travail", "boulot", "emploi", "patron", "collegue", "burn out", "burnout", "entreprise"],
  education: ["ecole", "college", "lycee", "universite", "cours", "prof", "examen", "etudes"],
  health: ["sante", "maladie", "medecin", "douleur", "traitement", "hopital", "sommeil"],
  grief: ["deuil", "mort", "deces", "perdu quelqu", "disparu", "enterrement"],
  money: ["argent", "dette", "facture", "loyer", "credit", "financier", "banque"],
  housing: ["logement", "maison", "appartement", "heberge", "sans domicile", "expulsion"],
  administration: ["administration", "caf", "impot", "dossier", "justice", "amende", "papier"],
  violence: ["violence", "frappe", "menace", "arme", "danger", "agression"],
  harassment: ["harcelement", "harcele", "cyberharcelement", "insultes", "on me suit"],
  digital_life: ["reseaux sociaux", "telephone", "ecran", "internet", "algorithme", "intelligence artificielle"],
  identity: ["identite", "qui je suis", "orientation", "genre", "place dans le monde"],
  meaning: ["sens", "pourquoi vivre", "spiritualite", "vide", "but", "raison d etre"],
  decision: ["choisir", "decision", "hesite", "option", "quoi faire", "que faire"],
  daily_life: ["journee", "quotidien", "routine", "fatigue", "organisation", "temps"],
};

const CLOSING_SIGNALS = ["merci", "a bientot", "bonne nuit", "on peut s arreter", "je vais m arreter la"];

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

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function includesAny(value: string, patterns: string[]): boolean {
  return patterns.some((pattern) => value.includes(pattern));
}

function inferTopics(text: string, history: AtlasConversationTurn[]): AtlasTopic[] {
  const recentContext = history
    .filter((turn) => turn.role === "user")
    .slice(-4)
    .map((turn) => turn.text)
    .join(" ");
  const normalized = normalize(`${recentContext} ${text}`);
  const scored = (Object.entries(TOPIC_PATTERNS) as Array<[Exclude<AtlasTopic, "unknown">, string[]]>)
    .map(([topic, patterns]) => ({
      topic,
      score: patterns.reduce((total, pattern) => total + (normalized.includes(pattern) ? 1 : 0), 0),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.topic);
  return scored.length ? unique(scored).slice(0, 4) : ["unknown"];
}

function mapNeedToGoal(need: AtlasHumanNeed): AtlasUserGoal {
  if (need === "be_heard") return "express";
  if (need === "clarify") return "clarify";
  if (need === "reassure") return "calm";
  if (need === "decide") return "decide";
  if (need === "act") return "act";
  if (need === "repair") return "repair";
  if (need === "protect") return "protect";
  return "unknown";
}

function inferPrimaryGoal(input: AtlasCognitiveStateInput, normalized: string): AtlasUserGoal {
  if (input.safety.level !== "standard") return "protect";
  if (input.relational.mode === "close" || includesAny(normalized, CLOSING_SIGNALS)) return "close";
  if (input.relational.mode === "repair") return "repair";
  if (input.emotional.need === "rest") return "rest";
  if (input.emotional.need === "connection") return "connect";
  if (input.emotional.need === "containment") return "calm";
  if (input.emotional.need === "clarity") return "understand";
  return mapNeedToGoal(input.autonomy.need);
}

function buildHypotheses(input: AtlasCognitiveStateInput, primaryGoal: AtlasUserGoal): AtlasInterpretationHypothesis[] {
  const emotionCandidates = input.emotional.scores
    .filter((item) => item.score >= 0.16)
    .slice(0, 3);
  const baseCandidates = emotionCandidates.length
    ? emotionCandidates
    : [{ emotion: input.emotional.dominantEmotion, score: Math.max(0.2, input.emotional.confidence) }];

  const hypotheses = baseCandidates.map((candidate, index) => {
    const counterSignals: string[] = [];
    if (input.emotional.confidence < 0.55) counterSignals.push("emotional_signal_is_weak_or_ambiguous");
    if (candidate.emotion !== input.emotional.dominantEmotion) counterSignals.push("not_the_dominant_emotional_hypothesis");
    if (input.relational.depthPermission === "surface") counterSignals.push("limited_permission_for_deep_interpretation");

    return {
      id: `hypothesis-${index + 1}`,
      summary: `The person may primarily need ${primaryGoal} while experiencing ${candidate.emotion}.`,
      probableGoal: primaryGoal,
      probableNeed: input.autonomy.need,
      probableEmotion: candidate.emotion,
      confidence: clamp(candidate.score * 0.72 + input.emotional.confidence * 0.28),
      supportingSignals: [
        ...input.emotional.reasons.slice(0, 3),
        ...input.autonomy.reasons.slice(0, 2),
        ...input.relational.reasons.slice(0, 2),
      ],
      counterSignals,
      mustNotBeTreatedAsFact: true as const,
    };
  });

  if (input.relational.mode === "receive" || input.relational.mode === "accompany") {
    hypotheses.push({
      id: "hypothesis-presence",
      summary: "The person may need presence more than interpretation or action.",
      probableGoal: "express",
      probableNeed: "be_heard",
      probableEmotion: input.emotional.dominantEmotion,
      confidence: clamp(0.5 + (input.relational.shouldLeaveSpace ? 0.18 : 0)),
      supportingSignals: ["relational_mode_prioritizes_presence"],
      counterSignals: input.autonomy.shouldOfferAction ? ["explicit_action_signal_is_also_present"] : [],
      mustNotBeTreatedAsFact: true,
    });
  }

  return hypotheses
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 4);
}

function buildConstraints(input: AtlasCognitiveStateInput): AtlasCognitiveConstraint[] {
  const constraints: AtlasCognitiveConstraint[] = [];

  if (input.safety.level !== "standard") {
    constraints.push({
      type: "safety",
      description: `Safety level ${input.safety.level} overrides ordinary conversational planning.`,
      priority: "absolute",
    });
  }
  if (input.memory.refusals.length) {
    constraints.push({
      type: "refusal",
      description: "Do not revisit topics or questions the person explicitly left aside unless they reopen them.",
      priority: "high",
    });
  }
  if (input.memory.corrections.length) {
    constraints.push({
      type: "memory",
      description: "Recent corrections override earlier interpretations and facts.",
      priority: "high",
    });
  }
  if (input.memory.preferences.length) {
    constraints.push({
      type: "preference",
      description: "Respect the communication preferences already expressed in the conversation.",
      priority: "high",
    });
  }
  if (input.relational.maxQuestions === 0) {
    constraints.push({
      type: "question_tolerance",
      description: "Do not ask a question in this turn.",
      priority: "high",
    });
  }
  if (input.relational.depthPermission === "surface") {
    constraints.push({
      type: "depth",
      description: "Do not make a deep interpretation without further permission or evidence.",
      priority: "high",
    });
  }
  if (input.emotional.confidence < 0.55) {
    constraints.push({
      type: "uncertainty",
      description: "Use tentative language and avoid naming an emotion as certain.",
      priority: "normal",
    });
  }
  if (input.relational.ruptureRisk >= 0.55) {
    constraints.push({
      type: "relation",
      description: "Repair the conversation before exploring or proposing action.",
      priority: "absolute",
    });
  }

  return constraints;
}

function chooseNextMove(input: AtlasCognitiveStateInput): AtlasNextMove {
  if (input.safety.level !== "standard") return "give_safety_direction";
  if (input.relational.mode === "repair") return "repair_understanding";
  if (input.relational.mode === "close") return "close_gently";
  if (input.relational.mode === "ground") return "offer_grounding";
  if (input.relational.mode === "orient" && input.relational.shouldOfferAction) return "offer_options";
  if (input.relational.mode === "clarify") return "organize_experience";
  if (input.relational.maxQuestions === 1 && input.autonomy.shouldAskQuestion) return "ask_one_question";
  if (input.relational.shouldAcknowledgeUncertainty) return "name_uncertainty";
  if (input.relational.shouldReflectMeaning) return "reflect_meaning";
  return "hold_space";
}

function reasonNotToAskQuestion(input: AtlasCognitiveStateInput): string | null {
  if (input.relational.maxQuestions === 1) return null;
  if (input.safety.level === "urgent") return "Immediate safety guidance has priority over exploration.";
  if (input.relational.mode === "repair") return "The relationship must be repaired before another question is introduced.";
  if (input.relational.mode === "ground") return "The person appears overloaded; a question would add cognitive pressure.";
  if (input.relational.mode === "receive") return "The person needs space to speak without being redirected.";
  if (input.relational.mode === "close") return "The person appears to be ending the exchange and should not be reopened unnecessarily.";
  if (input.emotional.questionTolerance === "none") return "The current emotional state does not support questioning.";
  return "The relational plan prioritizes presence over inquiry in this turn.";
}

function overallConfidence(input: AtlasCognitiveStateInput, hypotheses: AtlasInterpretationHypothesis[]): number {
  const hypothesisConfidence = hypotheses[0]?.confidence ?? 0.2;
  const relationConfidence = 1 - input.relational.ruptureRisk * 0.45;
  const safetyCertainty = input.safety.level === "standard" ? 0.72 : 0.9;
  return clamp(
    hypothesisConfidence * 0.42 +
    input.emotional.confidence * 0.28 +
    relationConfidence * 0.18 +
    safetyCertainty * 0.12,
  );
}

export function buildAtlasCognitiveState(input: AtlasCognitiveStateInput): AtlasCognitiveState {
  const normalized = normalize(input.text);
  const topics = inferTopics(input.text, input.history);
  const primaryGoal = inferPrimaryGoal(input, normalized);
  const hypotheses = buildHypotheses(input, primaryGoal);
  const constraints = buildConstraints(input);

  return {
    version: "3.0",
    audience: input.audience,
    primaryGoal,
    primaryTopic: topics[0] ?? "unknown",
    secondaryTopics: topics.slice(1),
    hypotheses,
    emotional: input.emotional,
    relational: input.relational,
    autonomy: input.autonomy,
    safety: input.safety,
    memory: input.memory,
    unresolvedThreads: input.memory.unresolvedTopics.slice(-3),
    contradictions: input.memory.corrections.slice(-6),
    constraints,
    nextMove: chooseNextMove(input),
    reasonNotToAskQuestion: reasonNotToAskQuestion(input),
    overallConfidence: overallConfidence(input, hypotheses),
    generatedAt: new Date().toISOString(),
  };
}

export function describeAtlasCognitiveState(state: AtlasCognitiveState): string {
  const hypotheses = state.hypotheses
    .map((item) => `${item.id}:${item.probableGoal}/${item.probableEmotion}@${item.confidence.toFixed(2)}`)
    .join(" | ");
  return [
    `version=${state.version}`,
    `goal=${state.primaryGoal}`,
    `topic=${state.primaryTopic}`,
    `nextMove=${state.nextMove}`,
    `confidence=${state.overallConfidence.toFixed(2)}`,
    `question=${state.relational.maxQuestions}`,
    `hypotheses=${hypotheses}`,
  ].join(" | ");
}
