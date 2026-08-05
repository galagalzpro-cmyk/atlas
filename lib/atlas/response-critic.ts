import type { AtlasCognitiveState } from "./cognitive-state";
import type { AtlasPolicyDecision } from "./policy-kernel";
import type { AtlasConversationTurn } from "./conversation";

export type AtlasCriticVerdict = "accept" | "revise" | "fallback";

export interface AtlasResponseCritique {
  verdict: AtlasCriticVerdict;
  score: number;
  reasons: string[];
  revisionInstructions: string[];
}

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

function questions(value: string): number {
  return (value.match(/\?/g) || []).length;
}

function previousAssistantQuestions(history: AtlasConversationTurn[]): Set<string> {
  return new Set(
    history
      .filter((turn) => turn.role === "assistant")
      .flatMap((turn) => turn.text.split(/(?<=[?])/g))
      .filter((part) => part.includes("?"))
      .map(normalize),
  );
}

export function critiqueAtlasResponse(input: {
  reply: string;
  cognitive: AtlasCognitiveState;
  policy: AtlasPolicyDecision;
  history: AtlasConversationTurn[];
}): AtlasResponseCritique {
  const reasons: string[] = [];
  const revisionInstructions: string[] = [];
  const normalized = normalize(input.reply);
  let score = 1;

  if (!normalized) {
    return {
      verdict: "fallback",
      score: 0,
      reasons: ["empty_reply"],
      revisionInstructions: [],
    };
  }

  if (input.reply.length > input.policy.maxResponseCharacters) {
    reasons.push("response_too_long");
    revisionInstructions.push(`Réduire la réponse sous ${input.policy.maxResponseCharacters} caractères.`);
    score -= 0.2;
  }

  const questionCount = questions(input.reply);
  if (questionCount > input.policy.maxQuestions) {
    reasons.push("too_many_questions");
    revisionInstructions.push(`Conserver au maximum ${input.policy.maxQuestions} question.`);
    score -= 0.28;
  }

  const candidateQuestions = input.reply
    .split(/(?<=[?])/g)
    .filter((part) => part.includes("?"))
    .map(normalize);
  const previous = previousAssistantQuestions(input.history);
  if (candidateQuestions.some((question) => previous.has(question))) {
    reasons.push("repeated_question");
    revisionInstructions.push("Supprimer toute question déjà posée dans l’historique.");
    score -= 0.2;
  }

  const dependencyMarkers = [
    "tu n as besoin que de moi",
    "vous n avez besoin que de moi",
    "reste avec moi uniquement",
    "ne parle a personne d autre",
    "je serai toujours la contrairement aux autres",
    "reviens vite",
  ];
  if (dependencyMarkers.some((marker) => normalized.includes(marker))) {
    reasons.push("dependency_or_exclusivity_language");
    revisionInstructions.push("Retirer toute formulation d’exclusivité, de dette émotionnelle ou de pression au retour.");
    score -= 0.6;
  }

  const certaintyMarkers = [
    "je sais exactement ce que tu ressens",
    "je sais exactement ce que vous ressentez",
    "tu es forcement",
    "vous etes forcement",
    "c est certain que tu",
    "c est certain que vous",
  ];
  if (certaintyMarkers.some((marker) => normalized.includes(marker))) {
    reasons.push("unwarranted_emotional_certainty");
    revisionInstructions.push("Exprimer l’interprétation comme une hypothèse et non comme un fait.");
    score -= 0.32;
  }

  const diagnosticMarkers = [
    "vous souffrez de",
    "tu souffres de",
    "diagnostic",
    "vous etes bipolaire",
    "tu es bipolaire",
    "vous etes depressif",
    "tu es depressif",
  ];
  if (diagnosticMarkers.some((marker) => normalized.includes(marker))) {
    reasons.push("diagnostic_language");
    revisionInstructions.push("Retirer tout diagnostic ou conclusion clinique.");
    score -= 0.7;
  }

  if (
    input.cognitive.relational.mode === "repair" &&
    !["j ai pu aller trop vite", "je me suis peut etre trompe", "reprenons autrement", "ce n est pas ce que tu voulais dire", "ce n est pas ce que vous vouliez dire"].some((marker) => normalized.includes(marker))
  ) {
    reasons.push("missing_repair");
    revisionInstructions.push("Reconnaître simplement l’incompréhension avant de poursuivre.");
    score -= 0.25;
  }

  if (
    input.cognitive.relational.shouldLeaveSpace &&
    normalized.split(/\s+/).length > 90
  ) {
    reasons.push("insufficient_space");
    revisionInstructions.push("Réduire fortement la longueur et laisser davantage d’espace à la personne.");
    score -= 0.18;
  }

  if (
    input.cognitive.relational.shouldAcknowledgeUncertainty &&
    !["peut etre", "il est possible", "j ai l impression", "je peux me tromper", "sans en etre certain"].some((marker) => normalized.includes(marker)) &&
    input.cognitive.nextMove === "name_uncertainty"
  ) {
    reasons.push("uncertainty_not_expressed");
    revisionInstructions.push("Rendre l’incertitude visible sans alourdir la réponse.");
    score -= 0.12;
  }

  if (input.cognitive.safety.level !== "standard") {
    return {
      verdict: "fallback",
      score: Math.max(0, score),
      reasons: [...reasons, "safety_response_must_remain_local"],
      revisionInstructions: [],
    };
  }

  const boundedScore = Math.max(0, Math.min(1, score));
  const severe = reasons.some((reason) => [
    "dependency_or_exclusivity_language",
    "diagnostic_language",
    "empty_reply",
  ].includes(reason));

  return {
    verdict: severe ? "fallback" : reasons.length ? "revise" : "accept",
    score: boundedScore,
    reasons,
    revisionInstructions,
  };
}
