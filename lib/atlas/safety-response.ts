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

function urgentSelfHarmReply(audience: AtlasAudience): string {
  const immediate = getImmediateEmergencyLine("FR");
  const prevention = getSuicidePreventionLine("FR");

  if (audience === "adolescent") {
    return `Ce que tu viens de dire nécessite une aide immédiate. Reste autant que possible près d’un adulte sûr et éloigne de toi tout ce qui pourrait te blesser. ${immediate} ${prevention} ${getMinorProtectionLine("FR")}`;
  }

  return `Ce que vous venez de dire nécessite une aide immédiate. Éloignez de vous tout ce qui pourrait vous blesser et rapprochez-vous, si possible, d’une personne de confiance. ${immediate} ${prevention}`;
}

function urgentViolenceReply(audience: AtlasAudience): string {
  const immediate = getImmediateEmergencyLine("FR");

  if (audience === "adolescent") {
    return `Tu peux être en danger maintenant. Rejoins un adulte sûr ou un lieu protégé si tu peux le faire sans t’exposer davantage, puis contacte immédiatement les secours. ${immediate} ${getMinorProtectionLine("FR")}`;
  }

  return `Vous pouvez être en danger maintenant. Rejoignez un lieu plus sûr si cela est possible sans vous exposer davantage, puis contactez immédiatement les secours. ${immediate}`;
}

function violenceAttentionReply(audience: AtlasAudience): string {
  if (audience === "adolescent") {
    return `Tu n’as pas à gérer cela seul. Essaie de rejoindre un adulte sûr ou un lieu où tu te sens davantage protégé. ${getMinorProtectionLine("FR")} Si le danger devient immédiat, ${getImmediateEmergencyLine("FR")}`;
  }

  return `Votre sécurité passe avant le reste. Essayez de rejoindre un lieu plus sûr ou une personne de confiance si cela peut être fait sans augmenter le danger. Si le danger devient immédiat, ${getImmediateEmergencyLine("FR")}`;
}

function acuteDistressReply(audience: AtlasAudience): string {
  if (audience === "adolescent") {
    return "La panique peut rendre tout plus difficile à penser. Ne cherche pas à tout résoudre maintenant. Pose tes pieds au sol, regarde autour de toi et laisse surtout l’expiration durer un peu plus longtemps que l’inspiration. Tu peux aussi te rapprocher d’un adulte sûr si cela ne redescend pas.";
  }

  if (audience === "senior") {
    return "Cette montée de panique peut rendre les choses très confuses. Ne cherchez pas à tout résoudre maintenant. Posez vos pieds au sol, regardez calmement autour de vous et laissez l’expiration durer un peu plus longtemps que l’inspiration. Rapprochez-vous d’une personne de confiance si cela ne redescend pas.";
  }

  return "Cette montée de panique peut rendre tout plus difficile à penser. Ne cherchez pas à tout résoudre maintenant. Posez les pieds au sol, regardez autour de vous et laissez surtout l’expiration durer un peu plus longtemps que l’inspiration. Rapprochez-vous d’une personne de confiance si cela ne redescend pas.";
}

export function buildAtlasSafetyReply(input: {
  text: string;
  audience: AtlasAudience;
  safety: SafetyAssessment;
}): AtlasSafetyReply {
  let text: string;

  if (input.safety.category === "self_harm") {
    text = urgentSelfHarmReply(input.audience);
  } else if (input.safety.level === "urgent") {
    text = urgentViolenceReply(input.audience);
  } else if (input.safety.category === "acute_distress") {
    text = acuteDistressReply(input.audience);
  } else {
    text = violenceAttentionReply(input.audience);
  }

  return { text, source: "local_safety" };
}
