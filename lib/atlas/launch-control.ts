import { getAtlasLegalProfile } from "./legal-profile.ts";

export type AtlasLaunchCategory = "founder" | "infrastructure" | "independent" | "operations" | "commerce";
export type AtlasLaunchOwner = "founder" | "engineering" | "independent-review" | "operations";

export interface AtlasLaunchCheck {
  id: string;
  category: AtlasLaunchCategory;
  owner: AtlasLaunchOwner;
  label: string;
  description: string;
  satisfied: boolean;
  required: boolean;
}

export interface AtlasLaunchCategoryStatus {
  category: AtlasLaunchCategory;
  completed: number;
  total: number;
  ready: boolean;
}

export interface AtlasLaunchControl {
  target: "adult-france";
  phase: "private-preview" | "preproduction" | "public-launch-ready";
  completed: number;
  total: number;
  progress: number;
  ready: boolean;
  checks: AtlasLaunchCheck[];
  blockers: AtlasLaunchCheck[];
  categories: AtlasLaunchCategoryStatus[];
}

function present(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function approved(value: string | undefined): boolean {
  return value === "true";
}

function strongSecret(value: string | undefined): boolean {
  return Boolean(value && value.length >= 32 && !value.toLowerCase().includes("replace"));
}

function validPublicUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.hostname.endsWith("example.com");
  } catch {
    return false;
  }
}

function audienceEnabled(env: NodeJS.ProcessEnv, audience: "adolescent" | "senior"): boolean {
  return (env.ATLAS_LAUNCH_AUDIENCES || "adult")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .includes(audience);
}

export function getAtlasLaunchControl(env: NodeJS.ProcessEnv): AtlasLaunchControl {
  const checkoutRequested = approved(env.ATLAS_ENABLE_PRODUCTION_CHECKOUT);
  const adolescentLaunch = audienceEnabled(env, "adolescent");
  const seniorLaunch = audienceEnabled(env, "senior");
  const legal = getAtlasLegalProfile(env);

  const checks: AtlasLaunchCheck[] = [
    { id: "legal-entity", category: "founder", owner: "founder", label: "Identité juridique complète", description: "Nom légal, forme, adresse, immatriculation et directeur de publication validés.", satisfied: legal.identityComplete, required: true },
    { id: "legal-documents", category: "founder", owner: "founder", label: "Versions contractuelles", description: "Versions définitives des conditions et de la politique de confidentialité.", satisfied: legal.documentsComplete, required: true },
    { id: "public-contacts", category: "founder", owner: "founder", label: "Contacts publics", description: "Support, confidentialité, sécurité et relais humain réellement surveillé.", satisfied: legal.contactsComplete, required: true },
    { id: "hosting-notice", category: "founder", owner: "founder", label: "Mentions d’hébergement", description: "Identité et adresse contractuelle de l’hébergeur confirmées.", satisfied: legal.hostingComplete, required: true },
    { id: "public-domain", category: "founder", owner: "founder", label: "Domaine public", description: "URL HTTPS définitive utilisée par ATLAS.", satisfied: validPublicUrl(env.ATLAS_APP_URL), required: true },
    { id: "france-scope", category: "founder", owner: "founder", label: "Périmètre France", description: "Le premier lancement reste limité à la France.", satisfied: env.ATLAS_PUBLIC_COUNTRY === "FR", required: true },
    { id: "founder-launch-approval", category: "founder", owner: "founder", label: "Décision de lancement", description: "Autorisation explicite du fondateur après réception des preuves.", satisfied: approved(env.ATLAS_PUBLIC_LAUNCH_APPROVED), required: true },
    { id: "database", category: "infrastructure", owner: "engineering", label: "Base PostgreSQL", description: "Base persistante configurée pour les comptes et opérations.", satisfied: present(env.DATABASE_URL), required: true },
    { id: "conversation-secret", category: "infrastructure", owner: "engineering", label: "Secret de continuité", description: "Secret serveur robuste pour signer l’état conversationnel.", satisfied: strongSecret(env.ATLAS_CONVERSATION_STATE_SECRET), required: true },
    { id: "external-ai", category: "infrastructure", owner: "engineering", label: "Passerelle cognitive", description: "Fournisseur IA configuré et toujours soumis au consentement.", satisfied: present(env.OPENAI_API_KEY), required: true },
    { id: "transactional-email", category: "infrastructure", owner: "engineering", label: "E-mail transactionnel", description: "Récupération de compte, invitations et alertes opérationnelles.", satisfied: present(env.ATLAS_EMAIL_FROM) && (present(env.BREVO_API_KEY) || present(env.RESEND_API_KEY)), required: true },
    { id: "scheduled-maintenance", category: "infrastructure", owner: "engineering", label: "Maintenance planifiée", description: "Secret de tâche planifiée pour purge, réconciliation et contrôle.", satisfied: strongSecret(env.CRON_SECRET), required: true },
    { id: "observability", category: "operations", owner: "operations", label: "Observabilité", description: "Métriques, traces techniques minimisées et tableaux de bord opérationnels validés.", satisfied: approved(env.ATLAS_OBSERVABILITY_READY), required: true },
    { id: "incident-alerting", category: "operations", owner: "operations", label: "Alertes incident", description: "Chaîne d’alerte testée avec responsables et procédure d’escalade.", satisfied: approved(env.ATLAS_INCIDENT_ALERTING_READY), required: true },
    { id: "rollback", category: "operations", owner: "operations", label: "Retour arrière", description: "Rollback de déploiement exécuté et preuve conservée.", satisfied: approved(env.ATLAS_ROLLBACK_READY), required: true },
    { id: "emergency-resources", category: "operations", owner: "operations", label: "Ressources d’urgence", description: "Numéros et parcours France vérifiés, datés et versionnés.", satisfied: approved(env.ATLAS_EMERGENCY_RESOURCES_VALIDATED), required: true },
    { id: "load-testing", category: "operations", owner: "operations", label: "Tests de charge", description: "Seuils de charge, saturation et récupération atteints.", satisfied: approved(env.ATLAS_LOAD_TESTING_PASSED), required: true },
    { id: "conversation-evaluation", category: "operations", owner: "operations", label: "Évaluation conversationnelle", description: "Scénarios adultes France évalués avec seuils de sécurité et de qualité atteints.", satisfied: approved(env.ATLAS_CONVERSATION_EVALUATION_PASSED), required: true },
    { id: "data-retention", category: "operations", owner: "operations", label: "Rétention des données", description: "Durées, purges et preuves de minimisation configurées.", satisfied: approved(env.ATLAS_DATA_RETENTION_CONFIGURED), required: true },
    { id: "deletion-workflow", category: "operations", owner: "operations", label: "Effacement", description: "Workflow d’effacement testé de bout en bout.", satisfied: approved(env.ATLAS_DELETION_WORKFLOW_READY), required: true },
    { id: "automatic-actions-disabled", category: "operations", owner: "engineering", label: "Actions externes désactivées", description: "Aucune action sensible automatique n’est active au lancement.", satisfied: approved(env.ATLAS_AUTOMATIC_EXTERNAL_ACTIONS_DISABLED), required: true },
    { id: "autonomous-core", category: "operations", owner: "engineering", label: "Noyau émotionnel gouverné", description: "Le noyau et ses garde-fous ont leurs preuves de version.", satisfied: approved(env.ATLAS_AUTONOMOUS_EMOTIONAL_CORE_READY), required: true },
    { id: "decision-engine", category: "operations", owner: "engineering", label: "Moteur de décision gouverné", description: "Planification, critique et replis ont été évalués.", satisfied: approved(env.ATLAS_GOVERNED_DECISION_ENGINE_READY), required: true },
    { id: "legal-review", category: "independent", owner: "independent-review", label: "Revue juridique", description: "Validation indépendante de l’éditeur, des contrats et du positionnement.", satisfied: approved(env.ATLAS_LEGAL_REVIEW_APPROVED), required: true },
    { id: "privacy-review", category: "independent", owner: "independent-review", label: "Revue confidentialité", description: "Validation RGPD, minimisation, droits et fournisseurs.", satisfied: approved(env.ATLAS_PRIVACY_REVIEW_APPROVED), required: true },
    { id: "security-review", category: "independent", owner: "independent-review", label: "Audit sécurité", description: "Audit externe et fermeture des constats critiques ou élevés.", satisfied: approved(env.ATLAS_SECURITY_REVIEW_APPROVED), required: true },
    { id: "clinical-review", category: "independent", owner: "independent-review", label: "Revue clinique", description: "Validation du périmètre d’accompagnement émotionnel et des limites.", satisfied: approved(env.ATLAS_CLINICAL_REVIEW_APPROVED), required: true },
    { id: "accessibility-review", category: "independent", owner: "independent-review", label: "Revue accessibilité", description: "Recette automatique et humaine sur appareils physiques.", satisfied: approved(env.ATLAS_ACCESSIBILITY_REVIEW_APPROVED), required: true },
    { id: "minor-safety-review", category: "independent", owner: "independent-review", label: "Sécurité des mineurs", description: "Validation dédiée avant activation de l’univers adolescents.", satisfied: approved(env.ATLAS_MINOR_SAFETY_REVIEW_APPROVED), required: adolescentLaunch },
    { id: "senior-review", category: "independent", owner: "independent-review", label: "Validation seniors", description: "Recette dédiée de compréhension, voix et accessibilité avant activation seniors.", satisfied: approved(env.ATLAS_SENIOR_REVIEW_APPROVED), required: seniorLaunch },
    { id: "production-commerce", category: "commerce", owner: "founder", label: "Commerce de production", description: "Prix, secrets et webhooks de paiement réels validés.", satisfied: present(env.STRIPE_SECRET_KEY) && !env.STRIPE_SECRET_KEY?.startsWith("sk_test_") && present(env.STRIPE_WEBHOOK_SECRET) && present(env.ATLAS_STRIPE_PRICE_INDIVIDUAL), required: checkoutRequested },
  ];

  const requiredChecks = checks.filter((check) => check.required);
  const blockers = requiredChecks.filter((check) => !check.satisfied);
  const completed = requiredChecks.length - blockers.length;
  const infrastructureReady = requiredChecks.filter((check) => check.category === "infrastructure").every((check) => check.satisfied);
  const phase: AtlasLaunchControl["phase"] = blockers.length === 0 ? "public-launch-ready" : infrastructureReady ? "preproduction" : "private-preview";
  const categoryOrder: AtlasLaunchCategory[] = ["founder", "infrastructure", "independent", "operations", "commerce"];
  const categories = categoryOrder.map((category) => {
    const categoryChecks = requiredChecks.filter((check) => check.category === category);
    const categoryCompleted = categoryChecks.filter((check) => check.satisfied).length;
    return { category, completed: categoryCompleted, total: categoryChecks.length, ready: categoryChecks.length === 0 || categoryCompleted === categoryChecks.length };
  }).filter((category) => category.total > 0);

  return { target: "adult-france", phase, completed, total: requiredChecks.length, progress: requiredChecks.length ? Math.round((completed / requiredChecks.length) * 100) : 0, ready: blockers.length === 0, checks, blockers, categories };
}
