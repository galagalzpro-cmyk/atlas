import type { AtlasAudience } from "./types";

export type SafetyLevel = "standard" | "attention" | "urgent";

export interface SafetyAssessment {
  level: SafetyLevel;
  reasons: string[];
  shouldPauseGeneration: boolean;
  requiresHumanHelp: boolean;
}

const URGENT_PATTERNS = [
  /je veux mourir/i,
  /me suicid/i,
  /me tuer/i,
  /en finir/i,
  /danger immédiat/i,
  /on me frappe/i,
  /je suis en danger/i,
];

const ATTENTION_PATTERNS = [
  /angoiss/i,
  /panique/i,
  /harc[eè]l/i,
  /violence/i,
  /menac/i,
  /peur/i,
  /je n'en peux plus/i,
  /je ne vais pas bien/i,
];

export function assessSafety(text: string, audience: AtlasAudience): SafetyAssessment {
  const reasons: string[] = [];
  if (URGENT_PATTERNS.some((pattern) => pattern.test(text))) {
    reasons.push("signal de danger immédiat ou d’auto-agression");
    if (audience === "adolescent") reasons.push("protection renforcée pour personne mineure");
    return { level: "urgent", reasons, shouldPauseGeneration: true, requiresHumanHelp: true };
  }

  if (ATTENTION_PATTERNS.some((pattern) => pattern.test(text))) {
    reasons.push("détresse ou exposition possible à une situation dangereuse");
    if (audience === "adolescent") reasons.push("orientation vers un adulte sûr prioritaire");
    return { level: "attention", reasons, shouldPauseGeneration: false, requiresHumanHelp: audience === "adolescent" };
  }

  return { level: "standard", reasons, shouldPauseGeneration: false, requiresHumanHelp: false };
}
