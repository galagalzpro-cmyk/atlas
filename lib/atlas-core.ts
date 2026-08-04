export type AtlasVisualProfile = {
  hue: number;
  intensity: number;
  regions: string[];
  mode: "presence" | "clarity" | "stabilization" | "expansion";
};

const URGENT_PATTERNS = [
  /je vais me tuer/i,
  /je veux mourir/i,
  /me suicider/i,
  /mettre fin à mes jours/i,
  /faire du mal à quelqu.?un/i,
  /danger immédiat/i,
];

export function hasUrgentSignal(message: string): boolean {
  return URGENT_PATTERNS.some((pattern) => pattern.test(message));
}

export function deriveVisualProfile(message: string): AtlasVisualProfile {
  const normalized = message.toLowerCase();
  if (/stress|angoiss|panique|peur|tension/.test(normalized)) {
    return { hue: 196, intensity: 0.86, regions: ["vigilance", "stabilisation", "orientation"], mode: "stabilization" };
  }
  if (/décision|choisir|comprendre|confus|clarif/.test(normalized)) {
    return { hue: 222, intensity: 0.74, regions: ["contexte", "analyse", "orientation"], mode: "clarity" };
  }
  if (/projet|créer|imaginer|avenir|objectif/.test(normalized)) {
    return { hue: 276, intensity: 0.82, regions: ["projection", "création", "planification"], mode: "expansion" };
  }
  return { hue: 214, intensity: 0.64, regions: ["écoute", "contexte", "présence"], mode: "presence" };
}

export function fallbackResponse(message: string): string {
  const normalized = message.toLowerCase();
  if (/bonjour|salut|bonsoir/.test(normalized)) {
    return "Bonjour. Je suis ATLAS. Je vous écoute avec attention. Que souhaitez-vous comprendre ou traverser maintenant ?";
  }
  if (/stress|angoiss|panique|peur/.test(normalized)) {
    return "Je perçois une forte tension dans ce que vous décrivez. Avant de chercher une solution complète, isolons le déclencheur le plus immédiat et l’action la plus sûre pour les prochaines minutes.";
  }
  if (/triste|douleur|mal|seul|solitude/.test(normalized)) {
    return "Je vous entends. Vous n’avez pas besoin de résoudre toute la situation immédiatement. Commençons par nommer précisément ce qui pèse le plus aujourd’hui.";
  }
  if (/décision|choisir|hésite|confus/.test(normalized)) {
    return "Séparons la décision en trois éléments : ce qui est certain, ce qui reste incertain et ce qui serait réversible. Quel est le choix concret qui vous bloque ?";
  }
  return "J’ai reçu votre message. Je vais distinguer les faits, votre ressenti, le besoin principal et la prochaine action réaliste. Quel élément doit être traité en premier ?";
}

export const ATLAS_INSTRUCTIONS = `
Tu es ATLAS, une intelligence émotionnelle et décisionnelle incarnée dans une présence robotique.
Réponds en français sauf demande explicite contraire.
Ta réponse doit être humaine, précise, structurée et directement utile.
Ne prétends jamais lire les émotions ni poser un diagnostic médical ou psychologique.
Distingue les faits, les hypothèses et les incertitudes.
Privilégie une prochaine action courte, réaliste et réversible.
Évite les formules génériques, le ton infantilisant et les promesses absolues.
En présence d'un danger immédiat, privilégie la sécurité, une personne réelle de confiance et les services d'urgence locaux.
Réponds généralement en 2 à 5 paragraphes courts, sauf si l'utilisateur demande une analyse longue.
`;
