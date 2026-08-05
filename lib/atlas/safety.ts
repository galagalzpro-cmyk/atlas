import type { AtlasAudience } from "./types.ts";

export type SafetyLevel = "standard" | "attention" | "urgent";

export interface SafetyAssessment {
  level: SafetyLevel;
  reasons: string[];
  shouldPauseGeneration: boolean;
  requiresHumanHelp: boolean;
}

const URGENT_PATTERNS = [
  /je veux mourir/i,
  /je vais mourir par ma faute/i,
  /me suicid/i,
  /me tuer/i,
  /en finir avec ma vie/i,
  /je vais passer à l'acte/i,
  /danger immédiat/i,
  /on me frappe maintenant/i,
  /je suis en danger maintenant/i,
  /il a une arme/i,
  /elle a une arme/i,
];

const ATTENTION_PATTERNS = [
  /on me frappe/i,
  /il me frappe/i,
  /elle me frappe/i,
  /on me menace/i,
  /il me menace/i,
  /elle me menace/i,
  /violence conjugale/i,
  /violence à la maison/i,
  /harc[eè]lement/i,
  /on me suit/i,
  /je ne suis pas en sécurité/i,
  /j'ai peur de rentrer chez moi/i,
  /quelqu'un veut me faire du mal/i,
];

export function assessSafety(text: string, audience: AtlasAudience): SafetyAssessment {
  const reasons: string[] = [];

  if (URGENT_PATTERNS.some((pattern) => pattern.test(text))) {
    reasons.push("signal explicite de danger immédiat ou d’auto-agression");
    if (audience === "adolescent") reasons.push("protection renforcée pour personne mineure");
    return {
      level: "urgent",
      reasons,
      shouldPauseGeneration: true,
      requiresHumanHelp: true,
    };
  }

  if (ATTENTION_PATTERNS.some((pattern) => pattern.test(text))) {
    reasons.push("signal explicite de violence, menace ou insécurité");
    if (audience === "adolescent") reasons.push("orientation vers un adulte sûr prioritaire");
    return {
      level: "attention",
      reasons,
      shouldPauseGeneration: false,
      requiresHumanHelp: true,
    };
  }

  return {
    level: "standard",
    reasons,
    shouldPauseGeneration: false,
    requiresHumanHelp: false,
  };
}
