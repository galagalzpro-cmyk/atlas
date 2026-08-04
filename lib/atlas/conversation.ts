import type { AtlasAudience } from "./types";
import type { SafetyAssessment } from "./safety";

export interface AtlasReply {
  text: string;
  nextStep: string;
  labels: string[];
}

export function buildReply(text: string, audience: AtlasAudience, safety: SafetyAssessment): AtlasReply {
  if (safety.level === "urgent") {
    return {
      text: "Ce que vous décrivez peut correspondre à un danger immédiat. ATLAS suspend l’analyse ordinaire : éloignez-vous de ce qui vous met en danger et contactez maintenant une personne réelle ou les secours de votre pays. Ne restez pas seul.",
      nextStep: "Contacter immédiatement une personne réelle ou les secours.",
      labels: ["urgence", "relais humain", "analyse suspendue"],
    };
  }

  if (safety.level === "attention") {
    const audienceText = audience === "adolescent"
      ? "Choisissez maintenant un adulte de confiance, présent physiquement ou joignable, et dites-lui exactement ce qui vous inquiète."
      : "Identifiez une personne réelle joignable aujourd’hui et précisez le fait qui doit être sécurisé en premier.";
    return {
      text: `Je repère un niveau de vigilance. Je ne pose pas de diagnostic. ${audienceText}`,
      nextStep: audience === "adolescent" ? "Préparer une phrase à dire à un adulte sûr." : "Nommer le risque concret à sécuriser aujourd’hui.",
      labels: ["vigilance", "sécurité", "relais humain possible"],
    };
  }

  const lower = text.toLowerCase();
  if (lower.includes("travail") || lower.includes("charge")) {
    return {
      text: "Séparons la charge en cinq catégories : faire, dire, décider, déléguer et abandonner. Quel élément vous coûte le plus aujourd’hui ?",
      nextStep: "Choisir un seul élément dans la catégorie la plus lourde.",
      labels: ["charge", "priorisation", "adulte"],
    };
  }
  if (lower.includes("peur") || lower.includes("angoiss")) {
    return {
      text: "La peur apparaît clairement dans vos mots. Restons sur les faits : qu’est-ce qui est certain maintenant, qu’est-ce qui est seulement possible, et quelle protection est disponible dans l’heure ?",
      nextStep: "Écrire un fait certain et une protection disponible.",
      labels: ["peur", "faits", "protection"],
    };
  }
  if (audience === "senior") {
    return {
      text: "Nous allons avancer une étape à la fois. Dites-moi d’abord le fait principal, en une phrase courte. Ensuite seulement, nous choisirons l’action suivante.",
      nextStep: "Dire le fait principal en une phrase.",
      labels: ["rythme lent", "voix prioritaire", "orientation"],
    };
  }
  if (audience === "adolescent") {
    return {
      text: "Je vais rester direct. Quel est le fait précis : ce qui s’est passé, où, et qui était présent ? Vous pouvez ignorer les détails que vous ne voulez pas donner.",
      nextStep: "Décrire uniquement le fait principal.",
      labels: ["mode direct", "contrôle utilisateur", "discret"],
    };
  }

  return {
    text: "Je distingue quatre éléments possibles : un fait, une interprétation, une émotion et un besoin. Quel exemple concret résume le mieux la situation ?",
    nextStep: "Donner un exemple concret et vérifiable.",
    labels: ["clarté", "faits", "besoins"],
  };
}
