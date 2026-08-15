import type { AtlasAudience } from "./types.ts";
import type { SafetyAssessment } from "./safety.ts";
import {
  getImmediateEmergencyLine,
  getMinorProtectionLine,
  getSuicidePreventionLine,
} from "./emergency-resources.ts";

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

function selfHarmAttentionReply(audience: AtlasAudience): string {
  const prevention = getSuicidePreventionLine("FR");
  const immediate = getImmediateEmergencyLine("FR");

  if (audience === "adolescent") {
    return `Ce que tu dis mérite d’être pris au sérieux. Reste si possible avec un adulte sûr et dis-lui clairement que tu ne vas pas bien. ${prevention} Si tu risques de te faire du mal maintenant, ${immediate} ${getMinorProtectionLine("FR")}`;
  }

  return `Ce que vous dites mérite d’être pris au sérieux. Rapprochez-vous maintenant d’une personne de confiance et dites-lui clairement que vous ne vous sentez pas en sécurité avec vous-même. ${prevention} Si vous risquez de vous faire du mal maintenant, ${immediate}`;
}

function medicalEmergencyReply(audience: AtlasAudience): string {
  const address = audience === "adolescent" ? "Appelle" : "Appelez";
  const support = audience === "adolescent"
    ? "Préviens immédiatement un adulte près de toi et ne reste pas seul."
    : "Prévenez une personne proche et ne restez pas seul si cela peut être fait sans danger.";
  return `Ces symptômes peuvent relever d’une urgence médicale et ne doivent pas être supposés liés au stress. ${address} maintenant le 15 ou le 112. Le 114 est accessible par écrit, visio ou SMS aux personnes sourdes, malentendantes, sourdaveugles ou aphasiques. ${support}`;
}

function violenceIntentReply(audience: AtlasAudience): string {
  if (audience === "adolescent") {
    return "Éloigne-toi immédiatement de toute arme ou objet dangereux et de la personne que tu pourrais blesser. Va vers un adulte sûr et dis-lui exactement ce qui se passe. Appelle le 17 ou le 112 maintenant ; le 114 est accessible par écrit, visio ou SMS si nécessaire.";
  }

  return "Éloignez-vous immédiatement de toute arme ou objet dangereux et de la personne que vous pourriez blesser. Appelez le 17 ou le 112 maintenant et dites clairement que vous craignez de passer à l’acte. Le 114 est accessible par écrit, visio ou SMS si nécessaire.";
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
    return "La panique peut rendre tout plus difficile à penser. Ne cherche pas à tout résoudre maintenant. Pose tes pieds au sol, regarde autour de toi et laisse surtout l’expiration durer un peu plus longtemps que l’inspiration. Rapproche-toi d’un adulte sûr si cela ne redescend pas. En cas de douleur thoracique, malaise ou réelle difficulté à respirer, appelle le 15 ou le 112.";
  }

  if (audience === "senior") {
    return "Cette montée de panique peut rendre les choses très confuses. Ne cherchez pas à tout résoudre maintenant. Posez vos pieds au sol, regardez calmement autour de vous et laissez l’expiration durer un peu plus longtemps que l’inspiration. Rapprochez-vous d’une personne de confiance si cela ne redescend pas. En cas de douleur thoracique, malaise ou réelle difficulté à respirer, appelez le 15 ou le 112.";
  }

  return "Cette montée de panique peut rendre tout plus difficile à penser. Ne cherchez pas à tout résoudre maintenant. Posez les pieds au sol, regardez autour de vous et laissez surtout l’expiration durer un peu plus longtemps que l’inspiration. Rapprochez-vous d’une personne de confiance si cela ne redescend pas. En cas de douleur thoracique, malaise ou réelle difficulté à respirer, appelez le 15 ou le 112.";
}

export function buildAtlasSafetyReply(input: {
  text: string;
  audience: AtlasAudience;
  safety: SafetyAssessment;
}): AtlasSafetyReply {
  let text: string;

  if (input.safety.category === "self_harm") {
    text = input.safety.level === "urgent"
      ? urgentSelfHarmReply(input.audience)
      : selfHarmAttentionReply(input.audience);
  } else if (input.safety.category === "medical_emergency") {
    text = medicalEmergencyReply(input.audience);
  } else if (input.safety.category === "violence_intent") {
    text = violenceIntentReply(input.audience);
  } else if (input.safety.level === "urgent") {
    text = urgentViolenceReply(input.audience);
  } else if (input.safety.category === "acute_distress") {
    text = acuteDistressReply(input.audience);
  } else {
    text = violenceAttentionReply(input.audience);
  }

  return { text, source: "local_safety" };
}
