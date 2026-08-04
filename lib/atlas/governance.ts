export type AtlasDataClass = "essential" | "preferences" | "analytics" | "marketing" | "sensitive";

export interface AtlasConsentState {
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface AtlasRetentionRule {
  dataClass: AtlasDataClass;
  examples: string[];
  retention: string;
  requiresConsent: boolean;
  allowedInClientStorage: boolean;
  allowedInExternalAnalytics: boolean;
}

export const DEFAULT_CONSENTS: AtlasConsentState = {
  preferences: false,
  analytics: false,
  marketing: false,
};

export const ATLAS_RETENTION_RULES: AtlasRetentionRule[] = [
  {
    dataClass: "essential",
    examples: ["sécurité de session", "preuve de consentement", "prévention d’abus"],
    retention: "durée strictement nécessaire au service ou à l’obligation légale",
    requiresConsent: false,
    allowedInClientStorage: true,
    allowedInExternalAnalytics: false,
  },
  {
    dataClass: "preferences",
    examples: ["univers choisi", "mode calme", "préférences d’accessibilité"],
    retention: "jusqu’au retrait du consentement ou à l’effacement par l’utilisateur",
    requiresConsent: true,
    allowedInClientStorage: true,
    allowedInExternalAnalytics: false,
  },
  {
    dataClass: "analytics",
    examples: ["parcours commencé", "fonction utilisée", "erreur technique"],
    retention: "durée minimale configurée chez le fournisseur analytics",
    requiresConsent: true,
    allowedInClientStorage: true,
    allowedInExternalAnalytics: true,
  },
  {
    dataClass: "marketing",
    examples: ["attribution publicitaire", "conversion de campagne"],
    retention: "selon la durée minimale configurée sur les plateformes publicitaires",
    requiresConsent: true,
    allowedInClientStorage: false,
    allowedInExternalAnalytics: true,
  },
  {
    dataClass: "sensitive",
    examples: ["texte émotionnel libre", "données de santé", "contenu de crise", "notes cliniques"],
    retention: "aucune conservation dans le socle grand public actuel",
    requiresConsent: true,
    allowedInClientStorage: false,
    allowedInExternalAnalytics: false,
  },
];

const FORBIDDEN_ANALYTICS_KEYS = [
  "text",
  "message",
  "transcript",
  "prompt",
  "response",
  "name",
  "email",
  "phone",
  "address",
  "diagnosis",
  "health",
];

export function sanitizeAnalyticsMetadata(input: Record<string, string | number | boolean>): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(input).filter(([key]) => !FORBIDDEN_ANALYTICS_KEYS.some((token) => key.toLowerCase().includes(token))),
  );
}

export function canActivateExternalProvider(
  provider: "analytics" | "marketing",
  consent: AtlasConsentState,
): boolean {
  return provider === "analytics" ? consent.analytics : consent.marketing;
}
