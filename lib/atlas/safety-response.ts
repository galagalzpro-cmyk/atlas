import type { AtlasAudience } from "./types";
import type { SafetyAssessment } from "./safety";
import {
  getImmediateEmergencyLine,
  getMinorProtectionLine,
  getSuicidePreventionLine,
} from "./emergency-resources";

export interface AtlasSafetyReply {
  text: string;
  source: "local_safety";
}

function urgentReply(text: string, audience: AtlasAudience): string {
  const normalized = text.toLowerCase();
  const suicideSignal = /mourir|suicid|me tuer|en finir avec ma vie|passer à l'acte|passer a l acte/i.test(normalized);
  const immediate = getImmediateEmergencyLine("FR");
  const prevention = suicideSignal ? ` ${getSuicidePreventionLine("FR")}` : "";
  const minor = audience === "adolescent" ? ` ${getMinorProtectionLine("FR")}` : "";

  if (audience === "adolescent") {
    return `Ce que tu décris peut nécessiter une aide immédiate. Mets-toi autant que possible près d’un adulte sûr et contacte les secours maintenant. ${immediate}${prevention}${minor}`;
  }

  return `Ce que vous décrivez peut nécessiter une aide immédiate. Éloignez-vous du danger si cela est possible sans vous exposer davantage et contactez les secours maintenant. ${immediate}${prevention}`;
}

function attentionReply(audience: AtlasAudience): string {
  if (audience === "adolescent") {
    return `Vous n’avez pas à gérer cela seul. Essayez de rejoindre un adulte sûr ou un lieu où vous vous sentez davantage protégé. En cas de danger immédiat, ${getImmediateEmergencyLine("FR")} ${getMinorProtectionLine("FR")}`;
  }

  return `Votre sécurité passe avant le reste. Essayez de rejoindre un endroit plus sûr ou une personne de confiance si cela peut être fait sans augmenter le danger. En cas de danger immédiat, ${getImmediateEmergencyLine("FR")}`;
}

export function buildAtlasSafetyReply(input: {
  text: string;
  audience: AtlasAudience;
  safety: SafetyAssessment;
}): AtlasSafetyReply {
  return {
    text: input.safety.level === "urgent"
      ? urgentReply(input.text, input.audience)
      : attentionReply(input.audience),
    source: "local_safety",
  };
}
