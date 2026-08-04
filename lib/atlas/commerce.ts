export type AtlasPaymentProvider = "stripe" | "paypal";
export type AtlasPlan = "individual" | "professional" | "organization";

export interface AtlasPlanDefinition {
  id: AtlasPlan;
  label: string;
  audience: "individual" | "professional" | "organization";
  billing: "monthly" | "annual" | "contract";
  features: string[];
}

export const ATLAS_PLANS: AtlasPlanDefinition[] = [
  {
    id: "individual",
    label: "ATLAS Individuel",
    audience: "individual",
    billing: "monthly",
    features: ["sessions guidées", "préférences d’accessibilité", "parcours personnels"],
  },
  {
    id: "professional",
    label: "ATLAS Professionnel",
    audience: "professional",
    billing: "monthly",
    features: ["espace professionnel", "mesures agrégées", "gestion de parcours"],
  },
  {
    id: "organization",
    label: "ATLAS Organisation",
    audience: "organization",
    billing: "contract",
    features: ["gestion multi-utilisateurs", "gouvernance", "support et déploiement encadrés"],
  },
];

export interface AtlasCommerceReadiness {
  stripe: boolean;
  paypal: boolean;
  productionCheckoutEnabled: boolean;
  missingRequirements: string[];
}

export function getCommerceReadiness(env: Record<string, string | undefined>): AtlasCommerceReadiness {
  const stripe = Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);
  const paypal = Boolean(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET);
  const legalReady = Boolean(env.ATLAS_LEGAL_ENTITY && env.ATLAS_TERMS_VERSION && env.ATLAS_PRIVACY_VERSION);

  const missingRequirements: string[] = [];
  if (!stripe) missingRequirements.push("clés Stripe et secret webhook");
  if (!paypal) missingRequirements.push("identifiants PayPal");
  if (!legalReady) missingRequirements.push("entité légale et versions des documents contractuels");

  return {
    stripe,
    paypal,
    productionCheckoutEnabled: (stripe || paypal) && legalReady && env.ATLAS_ENABLE_PRODUCTION_CHECKOUT === "true",
    missingRequirements,
  };
}

export function requireConfiguredProvider(provider: AtlasPaymentProvider, readiness: AtlasCommerceReadiness): void {
  if (!readiness[provider]) throw new Error(`${provider} is not configured`);
  if (!readiness.productionCheckoutEnabled) throw new Error("Production checkout is disabled");
}
