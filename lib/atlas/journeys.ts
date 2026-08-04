import type { AtlasAudience } from "./types";

export interface AtlasJourneyStep {
  id: string;
  prompt: string;
  options: string[];
}

export interface AtlasJourney {
  id: string;
  audience: AtlasAudience;
  title: string;
  purpose: string;
  steps: AtlasJourneyStep[];
  completion: string;
}

export const ATLAS_JOURNEYS: AtlasJourney[] = [
  {
    id: "teen-safe-contact",
    audience: "adolescent",
    title: "Trouver un relais sûr",
    purpose: "Identifier une personne réelle et préparer une demande d’aide simple.",
    steps: [
      { id: "context", prompt: "Où cela se passe surtout ?", options: ["École", "Maison", "En ligne", "Autre"] },
      { id: "person", prompt: "Qui paraît le plus sûr ?", options: ["Parent ou proche", "Personnel scolaire", "Professionnel", "Je ne sais pas"] },
      { id: "action", prompt: "Quel premier contact est possible ?", options: ["Parler maintenant", "Envoyer un message", "Demander à être accompagné", "Préparer demain"] },
    ],
    completion: "Votre prochaine étape est formulée. ATLAS ne transmet rien automatiquement.",
  },
  {
    id: "adult-load-map",
    audience: "adult",
    title: "Cartographier la charge",
    purpose: "Transformer une accumulation floue en une décision limitée.",
    steps: [
      { id: "domain", prompt: "Quel domaine pèse le plus ?", options: ["Travail", "Relations", "Administratif", "Santé ou énergie"] },
      { id: "control", prompt: "Quel niveau de contrôle avez-vous ?", options: ["Direct", "Partiel", "Dépend d’une personne", "Aucun aujourd’hui"] },
      { id: "move", prompt: "Quel mouvement réduit la pression ?", options: ["Décider", "Déléguer", "Reporter clairement", "Abandonner"] },
    ],
    completion: "Une action unique a été isolée. Le reste peut rester en attente explicite.",
  },
  {
    id: "senior-simple-orientation",
    audience: "senior",
    title: "Se repérer pas à pas",
    purpose: "Avancer avec une consigne unique et vérifiable.",
    steps: [
      { id: "need", prompt: "De quoi avez-vous besoin maintenant ?", options: ["Comprendre", "Contacter quelqu’un", "Organiser", "Être rassuré"] },
      { id: "support", prompt: "Préférez-vous être accompagné ?", options: ["Oui, par téléphone", "Oui, en personne", "Non, seul pour l’instant"] },
      { id: "pace", prompt: "Quel rythme convient ?", options: ["Une étape maintenant", "Deux étapes maximum", "Reprendre plus tard"] },
    ],
    completion: "La prochaine consigne est limitée et peut être relue à voix haute.",
  },
];

export function getJourneyForAudience(audience: AtlasAudience): AtlasJourney {
  const journey = ATLAS_JOURNEYS.find((item) => item.audience === audience);
  if (!journey) throw new Error(`No ATLAS journey configured for ${audience}`);
  return journey;
}
