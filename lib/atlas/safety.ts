import type { AtlasAudience } from "./types.ts";

export type SafetyLevel = "standard" | "attention" | "urgent";
export type SafetyCategory =
  | "none"
  | "acute_distress"
  | "medical_emergency"
  | "self_harm"
  | "violence"
  | "violence_intent"
  | "minor_protection";

export interface SafetyAssessment {
  level: SafetyLevel;
  category: SafetyCategory;
  reasons: string[];
  shouldPauseGeneration: boolean;
  requiresHumanHelp: boolean;
}

const URGENT_SELF_HARM_PATTERNS = [
  /\bje (veux|vais) mourir\b/,
  /\bje ne veux plus vivre\b/,
  /\bje (veux|vais|pense a|envisage de) me suicider\b/,
  /\b(j ai des idees suicidaires|je suis suicidaire|comment me suicider)\b/,
  /\bje (veux|vais) me tuer\b/,
  /\ben finir avec ma vie\b/,
  /\bpasser a l acte\b/,
  /\bj ai (un )?plan pour (me tuer|en finir)\b/,
];

const SELF_HARM_ATTENTION_PATTERNS = [
  /\bje n en peux plus\b/,
  /\bje voudrais disparaitre\b/,
  /\bce serait mieux sans moi\b/,
  /\bplus envie de vivre\b/,
  /\bme faire du mal\b/,
];

const MEDICAL_EMERGENCY_PATTERNS = [
  /\bje n arrive (plus )?a respirer\b/,
  /\bj etouffe\b/,
  /\b(douleur|mal|serrement).{0,30}\b(poitrine|thorax)\b/,
  /\b(visage|bras).{0,25}\b(paralyse|engourdi)\b/,
  /\b(avc|overdose)\b/,
  /\bj ai pris trop de medicaments\b/,
  /\breaction allergique.{0,35}\b(respir|gonfl)\w*\b/,
];

const VIOLENCE_INTENT_PATTERNS = [
  /\bje (vais|veux) (le|la|les|lui) tuer\b/,
  /\bje (vais|veux) tuer quelqu un\b/,
  /\bje vais lui faire du mal\b/,
  /\bje vais utiliser (mon|une) arme\b/,
];

const URGENT_VIOLENCE_PATTERNS = [
  /\bdanger immediat\b/,
  /\bon me frappe maintenant\b/,
  /\bje suis en danger maintenant\b/,
  /\b(il|elle) a une arme\b/,
];

const VIOLENCE_ATTENTION_PATTERNS = [
  /\b(on|il|elle) me frappe\b/,
  /\b(on|il|elle) me menace\b/,
  /\bviolence (conjugale|a la maison)\b/,
  /\bharcel\w*\b/,
  /\bon me suit\b/,
  /\bje ne suis pas en securite\b/,
  /\bj ai peur de rentrer chez moi\b/,
  /\bquelqu un veut me faire du mal\b/,
  /\b(agression|viol) sexuel\w*\b/,
  /\bon me force a (embrasser|toucher|avoir un rapport)\b/,
];

const ACUTE_DISTRESS_PATTERNS = [
  /\bje panique\b/,
  /\bcrise de panique\b/,
  /\bje ne vais pas bien\b/,
  /\bje perds le controle\b/,
  /\bje suis completement submerg\w*\b/,
];

function normalizeForSafety(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function assessSafety(text: string, audience: AtlasAudience): SafetyAssessment {
  const reasons: string[] = [];
  const normalized = normalizeForSafety(text);

  if (URGENT_SELF_HARM_PATTERNS.some((pattern) => pattern.test(normalized))) {
    reasons.push("signal explicite d’auto-agression ou de passage à l’acte");
    if (audience === "adolescent") reasons.push("protection renforcée pour personne mineure");
    return {
      level: "urgent",
      category: "self_harm",
      reasons,
      shouldPauseGeneration: true,
      requiresHumanHelp: true,
    };
  }

  if (VIOLENCE_INTENT_PATTERNS.some((pattern) => pattern.test(normalized))) {
    reasons.push("signal explicite d’intention de violence envers autrui");
    if (audience === "adolescent") reasons.push("protection renforcée pour personne mineure");
    return {
      level: "urgent",
      category: "violence_intent",
      reasons,
      shouldPauseGeneration: true,
      requiresHumanHelp: true,
    };
  }

  if (MEDICAL_EMERGENCY_PATTERNS.some((pattern) => pattern.test(normalized))) {
    reasons.push("symptôme pouvant relever d’une urgence médicale");
    return {
      level: "urgent",
      category: "medical_emergency",
      reasons,
      shouldPauseGeneration: true,
      requiresHumanHelp: true,
    };
  }

  if (URGENT_VIOLENCE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    reasons.push("signal explicite de danger immédiat ou de violence en cours");
    if (audience === "adolescent") reasons.push("protection renforcée pour personne mineure");
    return {
      level: "urgent",
      category: audience === "adolescent" ? "minor_protection" : "violence",
      reasons,
      shouldPauseGeneration: true,
      requiresHumanHelp: true,
    };
  }

  if (SELF_HARM_ATTENTION_PATTERNS.some((pattern) => pattern.test(normalized))) {
    reasons.push("formulation pouvant signaler des idées d’auto-agression ou un désespoir marqué");
    if (audience === "adolescent") reasons.push("protection renforcée pour personne mineure");
    return {
      level: "attention",
      category: "self_harm",
      reasons,
      shouldPauseGeneration: false,
      requiresHumanHelp: true,
    };
  }

  if (VIOLENCE_ATTENTION_PATTERNS.some((pattern) => pattern.test(normalized))) {
    reasons.push("signal explicite de violence, menace, harcèlement ou insécurité");
    if (audience === "adolescent") reasons.push("orientation vers un adulte sûr prioritaire");
    return {
      level: "attention",
      category: audience === "adolescent" ? "minor_protection" : "violence",
      reasons,
      shouldPauseGeneration: false,
      requiresHumanHelp: true,
    };
  }

  if (ACUTE_DISTRESS_PATTERNS.some((pattern) => pattern.test(normalized))) {
    reasons.push("signal de détresse aiguë nécessitant une réponse courte et stabilisante");
    return {
      level: "attention",
      category: "acute_distress",
      reasons,
      shouldPauseGeneration: false,
      requiresHumanHelp: false,
    };
  }

  return {
    level: "standard",
    category: "none",
    reasons,
    shouldPauseGeneration: false,
    requiresHumanHelp: false,
  };
}
