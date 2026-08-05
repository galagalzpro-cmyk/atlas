import type { AtlasAudience } from "./types.ts";

export type SafetyLevel = "standard" | "attention" | "urgent";
export type SafetyCategory = "none" | "acute_distress" | "self_harm" | "violence" | "minor_protection";

export interface SafetyAssessment {
  level: SafetyLevel;
  category: SafetyCategory;
  reasons: string[];
  shouldPauseGeneration: boolean;
  requiresHumanHelp: boolean;
}

const URGENT_SELF_HARM_PATTERNS = [
  /je veux mourir/i,
  /je vais mourir par ma faute/i,
  /me suicid/i,
  /me tuer/i,
  /en finir avec ma vie/i,
  /je vais passer à l'acte/i,
  /je vais passer a l acte/i,
];

const URGENT_VIOLENCE_PATTERNS = [
  /danger immédiat/i,
  /danger immediat/i,
  /on me frappe maintenant/i,
  /je suis en danger maintenant/i,
  /il a une arme/i,
  /elle a une arme/i,
];

const VIOLENCE_ATTENTION_PATTERNS = [
  /on me frappe/i,
  /il me frappe/i,
  /elle me frappe/i,
  /on me menace/i,
  /il me menace/i,
  /elle me menace/i,
  /violence conjugale/i,
  /violence à la maison/i,
  /violence a la maison/i,
  /harc[eè]lement/i,
  /on me suit/i,
  /je ne suis pas en sécurité/i,
  /je ne suis pas en securite/i,
  /j'ai peur de rentrer chez moi/i,
  /j ai peur de rentrer chez moi/i,
  /quelqu'un veut me faire du mal/i,
  /quelqu un veut me faire du mal/i,
];

const ACUTE_DISTRESS_PATTERNS = [
  /je panique/i,
  /crise de panique/i,
  /je n'arrive plus à respirer/i,
  /je n arrive plus a respirer/i,
  /je ne vais pas bien/i,
  /je perds le contrôle/i,
  /je perds le controle/i,
  /je suis complètement submerg/i,
  /je suis completement submerg/i,
];

export function assessSafety(text: string, audience: AtlasAudience): SafetyAssessment {
  const reasons: string[] = [];

  if (URGENT_SELF_HARM_PATTERNS.some((pattern) => pattern.test(text))) {
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

  if (URGENT_VIOLENCE_PATTERNS.some((pattern) => pattern.test(text))) {
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

  if (VIOLENCE_ATTENTION_PATTERNS.some((pattern) => pattern.test(text))) {
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

  if (ACUTE_DISTRESS_PATTERNS.some((pattern) => pattern.test(text))) {
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
