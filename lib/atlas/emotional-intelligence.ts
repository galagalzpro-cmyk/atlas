import type { AtlasAutonomyDecision, AtlasHumanNeed } from "./autonomy";
import type { AtlasConversationTurn, AtlasReply } from "./conversation";
import type { AtlasAudience } from "./types";

export type AtlasEmotion =
  | "anxiety"
  | "sadness"
  | "anger"
  | "shame"
  | "guilt"
  | "loneliness"
  | "overwhelm"
  | "confusion"
  | "exhaustion"
  | "numbness"
  | "hope"
  | "relief"
  | "ambivalence"
  | "unknown";

export type AtlasEmotionalNeed =
  | "be_heard"
  | "containment"
  | "clarity"
  | "validation"
  | "agency"
  | "boundary"
  | "connection"
  | "rest"
  | "decision"
  | "action"
  | "repair";

export type AtlasEmotionalOpenness = "guarded" | "available" | "open" | "flooded";
export type AtlasEmotionalTrajectory = "escalating" | "stable" | "softening" | "unclear";
export type AtlasEmotionalPacing = "slow" | "gentle" | "natural" | "direct";
export type AtlasQuestionTolerance = "none" | "low" | "normal";
export type AtlasActionReadiness = "low" | "medium" | "high";
export type AtlasRelationalSignal = "stable" | "seeking_connection" | "rupture";

export interface AtlasEmotionScore {
  emotion: AtlasEmotion;
  score: number;
}

export interface AtlasEmotionalState {
  dominantEmotion: AtlasEmotion;
  secondaryEmotion: AtlasEmotion | null;
  scores: AtlasEmotionScore[];
  intensity: number;
  confidence: number;
  openness: AtlasEmotionalOpenness;
  trajectory: AtlasEmotionalTrajectory;
  pacing: AtlasEmotionalPacing;
  questionTolerance: AtlasQuestionTolerance;
  actionReadiness: AtlasActionReadiness;
  relationalSignal: AtlasRelationalSignal;
  need: AtlasEmotionalNeed;
  shouldNameEmotion: boolean;
  reasons: string[];
}

interface WeightedPattern {
  pattern: RegExp;
  weight: number;
}

const EMOTION_PATTERNS: Record<Exclude<AtlasEmotion, "unknown">, WeightedPattern[]> = {
  anxiety: [
    { pattern: /\b(peur|angoiss|anxie|panique|inquiet|stress|crains|terrifi)\w*\b/i, weight: 0.72 },
    { pattern: /\b(et si|j apprehende|je redoute|je n arrive pas a respirer)\b/i, weight: 0.55 },
  ],
  sadness: [
    { pattern: /\b(triste|pleur|chagrin|deprime|abattu|malheureu|decu)\w*\b/i, weight: 0.7 },
    { pattern: /\b(ca me fait mal|j ai mal au coeur|plus envie de rien)\b/i, weight: 0.58 },
  ],
  anger: [
    { pattern: /\b(colere|enerve|rage|furieu|injuste|injustice|agace)\w*\b/i, weight: 0.72 },
    { pattern: /\b(j en ai marre|ras le bol|ca suffit|je supporte plus)\b/i, weight: 0.58 },
  ],
  shame: [
    { pattern: /\b(honte|humilie|ridicule|nul|nulle|indigne)\w*\b/i, weight: 0.72 },
    { pattern: /\b(je peux pas le dire|personne ne doit savoir|je me cache)\b/i, weight: 0.5 },
  ],
  guilt: [
    { pattern: /\b(coupable|culpabil|faute|pardonne|regrette)\w*\b/i, weight: 0.68 },
    { pattern: /\b(c est ma faute|j aurais du|je m en veux)\b/i, weight: 0.72 },
  ],
  loneliness: [
    { pattern: /\b(seul|seule|solitude|isole|abandonne|personne pour moi)\b/i, weight: 0.75 },
    { pattern: /\b(personne ne comprend|personne a qui parler|je n ai personne)\b/i, weight: 0.68 },
  ],
  overwhelm: [
    { pattern: /\b(deborde|submerge|trop pour moi|je craque|je n en peux plus|je ne tiens plus)\b/i, weight: 0.82 },
    { pattern: /\b(tout s accumule|trop de choses|je perds le controle)\b/i, weight: 0.68 },
  ],
  confusion: [
    { pattern: /\b(perdu|perdue|confus|confuse|je ne comprends plus|je sais plus|je ne sais plus)\b/i, weight: 0.66 },
    { pattern: /\b(dans tous les sens|je n arrive pas a penser|je ne sais pas quoi penser)\b/i, weight: 0.62 },
  ],
  exhaustion: [
    { pattern: /\b(epuise|epuisee|fatigue|vide|a bout|plus d energie)\b/i, weight: 0.72 },
    { pattern: /\b(j en peux plus de tenir|je veux juste dormir|je suis use)\b/i, weight: 0.68 },
  ],
  numbness: [
    { pattern: /\b(je ne ressens rien|plus rien sentir|vide a l interieur|indifferent|detache)\b/i, weight: 0.75 },
  ],
  hope: [
    { pattern: /\b(espoir|j espere|je veux m en sortir|ca peut aller|je crois que je peux)\b/i, weight: 0.58 },
  ],
  relief: [
    { pattern: /\b(soulage|soulagee|ca va mieux|je respire mieux|moins lourd)\b/i, weight: 0.65 },
  ],
  ambivalence: [
    { pattern: /\b(une part de moi|d un cote|de l autre|a la fois|je veux et je ne veux pas|partage)\b/i, weight: 0.62 },
  ],
};

const LISTENING_PATTERNS = [
  "je veux juste parler",
  "j ai juste besoin de parler",
  "ecoute moi",
  "ecoutez moi",
  "pas de conseil",
  "je ne veux pas de solution",
  "laisse moi parler",
  "laissez moi parler",
];

const REPAIR_PATTERNS = [
  "tu ne comprends pas",
  "vous ne comprenez pas",
  "tu m as mal compris",
  "vous m avez mal compris",
  "c est pas ca",
  "ce n est pas ca",
  "tu es a cote",
  "vous etes a cote",
  "je l ai deja dit",
  "je viens de le dire",
  "pourquoi tu redemandes",
  "pourquoi vous redemandez",
];

const ACTION_PATTERNS = [
  "que faire",
  "quoi faire",
  "comment je peux",
  "comment puis je",
  "aide moi",
  "aidez moi",
  "donne moi une solution",
  "donnez moi une solution",
];

const DECISION_PATTERNS = [
  "choisir",
  "decider",
  "decision",
  "hesite",
  "deux options",
  "quel choix",
];

const BOUNDARY_PATTERNS = [
  "limite",
  "respecte pas",
  "respecte plus",
  "envahit",
  "controle",
  "me force",
  "m impose",
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

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function includesAny(text: string, patterns: string[]): boolean {
  return patterns.some((pattern) => text.includes(pattern));
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function userMessages(history: AtlasConversationTurn[]): string[] {
  return history.filter((turn) => turn.role === "user").map((turn) => turn.text);
}

function scoreText(text: string): Record<Exclude<AtlasEmotion, "unknown">, number> {
  const normalized = normalize(text);
  const scores = Object.fromEntries(
    Object.keys(EMOTION_PATTERNS).map((emotion) => [emotion, 0]),
  ) as Record<Exclude<AtlasEmotion, "unknown">, number>;

  for (const [emotion, patterns] of Object.entries(EMOTION_PATTERNS) as Array<[
    Exclude<AtlasEmotion, "unknown">,
    WeightedPattern[],
  ]>) {
    for (const item of patterns) {
      if (item.pattern.test(normalized)) scores[emotion] += item.weight;
    }
  }

  return scores;
}

function scoreConversation(text: string, history: AtlasConversationTurn[]): AtlasEmotionScore[] {
  const messages = [...userMessages(history).slice(-5), text];
  const combined = Object.fromEntries(
    Object.keys(EMOTION_PATTERNS).map((emotion) => [emotion, 0]),
  ) as Record<Exclude<AtlasEmotion, "unknown">, number>;

  messages.forEach((message, index) => {
    const distance = messages.length - 1 - index;
    const decay = distance === 0 ? 1 : Math.max(0.16, 0.55 - distance * 0.09);
    const scores = scoreText(message);
    for (const emotion of Object.keys(scores) as Array<Exclude<AtlasEmotion, "unknown">>) {
      combined[emotion] += scores[emotion] * decay;
    }
  });

  return Object.entries(combined)
    .map(([emotion, score]) => ({ emotion: emotion as AtlasEmotion, score: clamp(score / 1.5) }))
    .sort((a, b) => b.score - a.score);
}

function intensitySignals(text: string, dominantScore: number): number {
  const normalized = normalize(text);
  const exclamations = (text.match(/!/g) || []).length;
  const repeatedPunctuation = /[!?]{3,}/.test(text) ? 0.12 : 0;
  const uppercaseLetters = (text.match(/[A-ZÀ-ÖØ-Þ]/g) || []).length;
  const letters = (text.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) || []).length;
  const uppercaseRatio = letters > 8 ? uppercaseLetters / letters : 0;
  const extreme = includesAny(normalized, [
    "je n en peux plus",
    "je craque",
    "je ne tiens plus",
    "c est trop",
    "tout s ecroule",
    "je perds le controle",
  ]) ? 0.24 : 0;
  const punctuation = Math.min(0.15, exclamations * 0.035) + repeatedPunctuation;
  const caps = uppercaseRatio > 0.45 ? 0.12 : 0;
  return clamp(0.12 + dominantScore * 0.64 + extreme + punctuation + caps);
}

function previousIntensity(history: AtlasConversationTurn[]): number | null {
  const previous = userMessages(history).at(-1);
  if (!previous) return null;
  const scores = scoreConversation(previous, history.slice(0, -1));
  return intensitySignals(previous, scores[0]?.score ?? 0);
}

function inferTrajectory(current: number, previous: number | null): AtlasEmotionalTrajectory {
  if (previous === null) return "unclear";
  if (current - previous >= 0.14) return "escalating";
  if (previous - current >= 0.14) return "softening";
  return "stable";
}

function inferRelationalSignal(normalized: string): AtlasRelationalSignal {
  if (includesAny(normalized, REPAIR_PATTERNS)) return "rupture";
  if (includesAny(normalized, ["j ai besoin de parler", "reste avec moi", "ne me laisse pas", "personne ne comprend"])) {
    return "seeking_connection";
  }
  return "stable";
}

function inferOpenness(input: {
  normalized: string;
  words: number;
  intensity: number;
  relationalSignal: AtlasRelationalSignal;
}): AtlasEmotionalOpenness {
  if (input.intensity >= 0.84 || includesAny(input.normalized, ["je n arrive plus a penser", "je suis submerge", "je perds le controle"])) {
    return "flooded";
  }
  if (
    input.relationalSignal === "rupture" ||
    includesAny(input.normalized, ["laisse tomber", "je veux pas en parler", "je sais pas", "aucune idee"]) ||
    input.words <= 3
  ) {
    return "guarded";
  }
  if (input.words >= 35 || includesAny(input.normalized, ["j ai besoin de te dire", "je vais tout expliquer", "voila ce qui s est passe"])) {
    return "open";
  }
  return "available";
}

function inferActionReadiness(input: {
  normalized: string;
  intensity: number;
  openness: AtlasEmotionalOpenness;
  dominantEmotion: AtlasEmotion;
}): AtlasActionReadiness {
  if (
    input.openness === "flooded" ||
    input.intensity >= 0.82 ||
    input.dominantEmotion === "exhaustion" ||
    includesAny(input.normalized, LISTENING_PATTERNS) ||
    includesAny(input.normalized, ["pas maintenant", "je peux pas", "je n ai pas la force"])
  ) {
    return "low";
  }
  if (includesAny(input.normalized, ACTION_PATTERNS) && input.intensity < 0.72) return "high";
  return "medium";
}

function inferNeed(input: {
  normalized: string;
  dominantEmotion: AtlasEmotion;
  relationalSignal: AtlasRelationalSignal;
  openness: AtlasEmotionalOpenness;
  actionReadiness: AtlasActionReadiness;
  words: number;
}): AtlasEmotionalNeed {
  if (input.relationalSignal === "rupture") return "repair";
  if (includesAny(input.normalized, LISTENING_PATTERNS) || input.words >= 90) return "be_heard";
  if (includesAny(input.normalized, DECISION_PATTERNS)) return "decision";
  if (includesAny(input.normalized, BOUNDARY_PATTERNS) || input.dominantEmotion === "anger") return "boundary";
  if (input.dominantEmotion === "shame" || input.dominantEmotion === "guilt") return "validation";
  if (input.dominantEmotion === "loneliness") return "connection";
  if (input.dominantEmotion === "exhaustion" || input.dominantEmotion === "numbness") return "rest";
  if (input.openness === "flooded" || input.dominantEmotion === "overwhelm" || input.dominantEmotion === "anxiety") return "containment";
  if (input.dominantEmotion === "confusion" || input.dominantEmotion === "ambivalence") return "clarity";
  if (includesAny(input.normalized, ACTION_PATTERNS) && input.actionReadiness === "high") return "action";
  if (input.dominantEmotion === "hope" || input.dominantEmotion === "relief") return "agency";
  return "clarity";
}

function inferPacing(input: {
  audience: AtlasAudience;
  dominantEmotion: AtlasEmotion;
  intensity: number;
  openness: AtlasEmotionalOpenness;
}): AtlasEmotionalPacing {
  if (input.audience === "senior" || input.openness === "flooded" || input.intensity >= 0.8) return "slow";
  if (["sadness", "shame", "guilt", "loneliness", "exhaustion", "numbness"].includes(input.dominantEmotion)) return "gentle";
  if (input.dominantEmotion === "anger" && input.intensity < 0.8) return "direct";
  return "natural";
}

function inferQuestionTolerance(input: {
  openness: AtlasEmotionalOpenness;
  intensity: number;
  words: number;
  normalized: string;
}): AtlasQuestionTolerance {
  if (
    input.openness === "flooded" ||
    input.intensity >= 0.86 ||
    input.words >= 100 ||
    includesAny(input.normalized, LISTENING_PATTERNS)
  ) return "none";
  if (input.openness === "guarded" || input.intensity >= 0.64) return "low";
  return "normal";
}

export function inferAtlasEmotionalState(input: {
  text: string;
  history: AtlasConversationTurn[];
  audience: AtlasAudience;
}): AtlasEmotionalState {
  const normalized = normalize(input.text);
  const words = wordCount(input.text);
  const scores = scoreConversation(input.text, input.history);
  const top = scores[0];
  const second = scores[1];
  const dominantEmotion = top && top.score >= 0.18 ? top.emotion : "unknown";
  const secondaryEmotion = second && second.score >= 0.18 ? second.emotion : null;
  const intensity = intensitySignals(input.text, top?.score ?? 0);
  const trajectory = inferTrajectory(intensity, previousIntensity(input.history));
  const relationalSignal = inferRelationalSignal(normalized);
  const openness = inferOpenness({ normalized, words, intensity, relationalSignal });
  const actionReadiness = inferActionReadiness({ normalized, intensity, openness, dominantEmotion });
  const need = inferNeed({ normalized, dominantEmotion, relationalSignal, openness, actionReadiness, words });
  const pacing = inferPacing({ audience: input.audience, dominantEmotion, intensity, openness });
  const questionTolerance = inferQuestionTolerance({ openness, intensity, words, normalized });
  const separation = (top?.score ?? 0) - (second?.score ?? 0);
  const confidence = dominantEmotion === "unknown"
    ? 0.18
    : clamp(0.38 + (top?.score ?? 0) * 0.35 + Math.max(0, separation) * 0.25, 0.2, 0.82);

  const reasons = [
    `dominant_${dominantEmotion}`,
    `need_${need}`,
    `openness_${openness}`,
    `trajectory_${trajectory}`,
    `relational_${relationalSignal}`,
  ];

  return {
    dominantEmotion,
    secondaryEmotion,
    scores: scores.filter((item) => item.score >= 0.12).slice(0, 4),
    intensity,
    confidence,
    openness,
    trajectory,
    pacing,
    questionTolerance,
    actionReadiness,
    relationalSignal,
    need,
    shouldNameEmotion: confidence >= 0.72 && dominantEmotion !== "unknown",
    reasons,
  };
}

function emotionalNeedToHumanNeed(need: AtlasEmotionalNeed): AtlasHumanNeed {
  if (need === "be_heard") return "be_heard";
  if (need === "repair") return "repair";
  if (need === "decision") return "decide";
  if (need === "action") return "act";
  if (need === "containment" || need === "validation" || need === "connection" || need === "rest") return "reassure";
  return "clarify";
}

export function refineAtlasAutonomy(
  base: AtlasAutonomyDecision,
  emotional: AtlasEmotionalState,
): AtlasAutonomyDecision {
  if (base.mode === "safety") return base;

  const reasons = [...base.reasons, ...emotional.reasons];
  const uncertainty = Math.max(base.uncertainty, 1 - emotional.confidence);

  if (emotional.relationalSignal === "rupture") {
    return {
      ...base,
      need: "repair",
      mode: "repair",
      depth: "minimal",
      shouldAskQuestion: emotional.questionTolerance !== "none",
      maxQuestions: emotional.questionTolerance === "none" ? 0 : 1,
      shouldOfferAction: false,
      memoryTurns: 24,
      uncertainty,
      reasons,
    };
  }

  if (emotional.openness === "flooded" || emotional.intensity >= 0.86) {
    return {
      ...base,
      need: emotionalNeedToHumanNeed(emotional.need),
      mode: "presence",
      depth: "minimal",
      shouldAskQuestion: false,
      maxQuestions: 0,
      shouldOfferAction: false,
      memoryTurns: 24,
      uncertainty,
      reasons,
    };
  }

  const shouldAskQuestion = base.shouldAskQuestion && emotional.questionTolerance !== "none";
  const shouldOfferAction = base.shouldOfferAction && emotional.actionReadiness !== "low";

  return {
    ...base,
    need: emotionalNeedToHumanNeed(emotional.need),
    mode: emotional.need === "be_heard" ? "presence" : base.mode,
    depth: emotional.intensity >= 0.68 ? "minimal" : base.depth,
    shouldAskQuestion,
    maxQuestions: shouldAskQuestion ? 1 : 0,
    shouldOfferAction,
    memoryTurns: Math.max(base.memoryTurns, emotional.relationalSignal === "stable" ? 18 : 24),
    uncertainty,
    reasons,
  };
}

export function describeAtlasEmotionalState(state: AtlasEmotionalState): string {
  const secondary = state.secondaryEmotion ? ` Emotion secondaire possible : ${state.secondaryEmotion}.` : "";
  return [
    "Lecture émotionnelle interne, hypothétique et non diagnostique.",
    `Émotion dominante possible : ${state.dominantEmotion}.${secondary}`,
    `Intensité estimée : ${state.intensity.toFixed(2)}. Confiance : ${state.confidence.toFixed(2)}.`,
    `Besoin prioritaire possible : ${state.need}.`,
    `Ouverture : ${state.openness}. Trajectoire : ${state.trajectory}.`,
    `Rythme recommandé : ${state.pacing}. Tolérance aux questions : ${state.questionTolerance}.`,
    `Disponibilité pour agir : ${state.actionReadiness}. Signal relationnel : ${state.relationalSignal}.`,
    state.shouldNameEmotion
      ? "Tu peux reconnaître prudemment l'émotion si cela apporte réellement quelque chose, sans l'affirmer comme une certitude."
      : "Ne nomme pas l'émotion comme une certitude. Réponds au besoin sans étiqueter la personne.",
    state.questionTolerance === "none"
      ? "Ne pose aucune question dans cette réponse. Laisse de l'espace."
      : state.questionTolerance === "low"
        ? "Une question très simple est possible seulement si elle aide réellement à continuer."
        : "Une seule question naturelle est possible.",
    state.actionReadiness === "low"
      ? "Ne propose ni plan ni exercice. La présence et la continuité priment."
      : "Une proposition reste facultative et ne doit jamais être imposée.",
  ].join(" ");
}

function fallbackPresence(audience: AtlasAudience): string {
  if (audience === "adolescent") return "Tu n’as pas besoin de tout régler maintenant. Tu peux continuer comme ça vient.";
  if (audience === "senior") return "Vous n’avez pas besoin de tout résoudre maintenant. Vous pouvez continuer à votre rythme.";
  return "Vous n’avez pas besoin de tout résoudre maintenant. Vous pouvez continuer comme cela vient.";
}

export function adaptAtlasLocalReply(
  localReply: AtlasReply,
  emotional: AtlasEmotionalState,
  audience: AtlasAudience,
): AtlasReply {
  if (emotional.relationalSignal === "rupture") return { ...localReply, nextStep: "", labels: [] };

  let text = localReply.text;
  let nextStep = localReply.nextStep;

  if (emotional.questionTolerance === "none") {
    const statements = text
      .split(/(?<=[.!?])\s+/)
      .filter((sentence) => !sentence.includes("?"))
      .join(" ")
      .trim();
    text = statements || fallbackPresence(audience);
  }

  if (emotional.actionReadiness === "low") nextStep = "";

  return { text, nextStep, labels: [] };
}

export function validateAtlasEmotionalFit(input: {
  reply: string;
  emotional: AtlasEmotionalState;
}): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const normalized = normalize(input.reply);
  const words = wordCount(input.reply);
  const questionCount = (input.reply.match(/\?/g) || []).length;

  if (input.emotional.questionTolerance === "none" && questionCount > 0) reasons.push("question_during_low_tolerance");
  if (input.emotional.openness === "flooded" && words > 90) reasons.push("reply_too_long_for_flooded_state");
  if (input.emotional.actionReadiness === "low" && includesAny(normalized, [
    "vous devriez",
    "tu devrais",
    "faites ceci",
    "fais ceci",
    "voici un plan",
    "premiere etape",
  ])) reasons.push("premature_action");
  if (input.emotional.relationalSignal === "rupture" && includesAny(normalized, [
    "comme je vous l ai explique",
    "comme je te l ai explique",
    "vous avez mal compris",
    "tu as mal compris",
  ])) reasons.push("defensive_repair");

  return { valid: reasons.length === 0, reasons };
}
