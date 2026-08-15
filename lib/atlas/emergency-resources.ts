export type AtlasResourceCategory =
  | "immediate_medical"
  | "immediate_police"
  | "european_emergency"
  | "accessible_emergency"
  | "suicide_prevention"
  | "child_protection"
  | "harassment"
  | "violence_against_women";

export interface AtlasEmergencyResource {
  category: AtlasResourceCategory;
  number: string;
  label: string;
  availability: string;
  urgent: boolean;
  notes: string;
  source: string;
  verifiedOn: string;
}

const VERIFIED_ON = "2026-08-15";

const FRANCE_RESOURCES: AtlasEmergencyResource[] = [
  {
    category: "immediate_medical",
    number: "15",
    label: "SAMU",
    availability: "24 h/24, 7 j/7",
    urgent: true,
    notes: "Urgence médicale immédiate en France.",
    source: "Service-Public.fr",
    verifiedOn: VERIFIED_ON,
  },
  {
    category: "immediate_police",
    number: "17",
    label: "Police secours",
    availability: "24 h/24, 7 j/7",
    urgent: true,
    notes: "Danger, violence ou infraction nécessitant une intervention rapide.",
    source: "Service-Public.fr",
    verifiedOn: VERIFIED_ON,
  },
  {
    category: "european_emergency",
    number: "112",
    label: "Numéro d’urgence européen",
    availability: "24 h/24, 7 j/7",
    urgent: true,
    notes: "Oriente vers le service d’urgence adapté.",
    source: "Service-Public.fr",
    verifiedOn: VERIFIED_ON,
  },
  {
    category: "accessible_emergency",
    number: "114",
    label: "Urgence 114 — écrit, visio ou SMS",
    availability: "24 h/24, 7 j/7",
    urgent: true,
    notes: "Service d’urgence destiné aux personnes sourdes, malentendantes, sourdaveugles ou aphasiques.",
    source: "urgence114.fr et Service-Public.fr",
    verifiedOn: VERIFIED_ON,
  },
  {
    category: "suicide_prevention",
    number: "3114",
    label: "Numéro national de prévention du suicide",
    availability: "24 h/24, 7 j/7",
    urgent: false,
    notes: "Gratuit en France ; professionnels formés à la prévention du suicide.",
    source: "3114.fr",
    verifiedOn: VERIFIED_ON,
  },
  {
    category: "child_protection",
    number: "119",
    label: "Enfance en danger",
    availability: "24 h/24, 7 j/7",
    urgent: false,
    notes: "Gratuit et confidentiel pour un enfant en danger ou toute personne inquiète pour un enfant.",
    source: "allo119.gouv.fr",
    verifiedOn: VERIFIED_ON,
  },
  {
    category: "harassment",
    number: "3018",
    label: "Harcèlement et violences numériques",
    availability: "7 j/7, 9 h–23 h",
    urgent: false,
    notes: "Gratuit et anonyme ; écoute, conseil et orientation.",
    source: "Ministère de l’Éducation nationale et e-Enfance",
    verifiedOn: VERIFIED_ON,
  },
  {
    category: "violence_against_women",
    number: "3919",
    label: "Violences Femmes Info",
    availability: "24 h/24, 7 j/7",
    urgent: false,
    notes: "Écoute, information et orientation ; ce numéro ne remplace pas les secours en cas d’urgence immédiate.",
    source: "arretonslesviolences.gouv.fr",
    verifiedOn: VERIFIED_ON,
  },
];

export function getEmergencyResources(countryCode = "FR"): AtlasEmergencyResource[] {
  return countryCode.toUpperCase() === "FR" ? FRANCE_RESOURCES : [];
}

export function getImmediateEmergencyLine(countryCode = "FR"): string {
  if (countryCode.toUpperCase() === "FR") {
    return "Appelez maintenant le 15, le 17 ou le 112. Les personnes sourdes, malentendantes, sourdaveugles ou aphasiques peuvent joindre le 114 par écrit, visio ou SMS.";
  }
  return "Contactez immédiatement les services d’urgence de votre pays.";
}

export function getSuicidePreventionLine(countryCode = "FR"): string {
  if (countryCode.toUpperCase() === "FR") return "Vous pouvez aussi appeler gratuitement le 3114, 24 h/24 et 7 j/7.";
  return "Contactez une ligne locale de prévention du suicide ou un professionnel de santé.";
}

export function getMinorProtectionLine(countryCode = "FR"): string {
  if (countryCode.toUpperCase() === "FR") return "Le 119 est disponible gratuitement et confidentiellement, 24 h/24 et 7 j/7.";
  return "Contactez immédiatement un adulte sûr ou le service de protection de l’enfance de votre pays.";
}
