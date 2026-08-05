export interface AtlasPublicReadinessInput {
  database: boolean;
  externalAi: boolean;
  transactionalEmail: boolean;
  scheduledMaintenance: boolean;
  observability: boolean;
  incidentAlerting: boolean;
  rollbackReady: boolean;
  legalReview: boolean;
  privacyReview: boolean;
  securityReview: boolean;
  clinicalReview: boolean;
  minorSafetyReview: boolean;
  autonomousEmotionalCoreReady: boolean;
  governedDecisionEngineReady: boolean;
  automaticExternalActionsDisabled: boolean;
  emergencyResourcesValidated: boolean;
  accessibilityReview: boolean;
  loadTestingPassed: boolean;
  conversationEvaluationPassed: boolean;
  dataRetentionConfigured: boolean;
  deletionWorkflowReady: boolean;
  geographicScope: string;
}

export interface AtlasPublicReadinessResult {
  ready: boolean;
  scopeReady: boolean;
  missing: string[];
  blockers: string[];
}

const REQUIRED_BOOLEAN_KEYS: Array<keyof Omit<AtlasPublicReadinessInput, "geographicScope">> = [
  "database",
  "externalAi",
  "transactionalEmail",
  "scheduledMaintenance",
  "observability",
  "incidentAlerting",
  "rollbackReady",
  "legalReview",
  "privacyReview",
  "securityReview",
  "clinicalReview",
  "minorSafetyReview",
  "autonomousEmotionalCoreReady",
  "governedDecisionEngineReady",
  "automaticExternalActionsDisabled",
  "emergencyResourcesValidated",
  "accessibilityReview",
  "loadTestingPassed",
  "conversationEvaluationPassed",
  "dataRetentionConfigured",
  "deletionWorkflowReady",
];

export function evaluateAtlasPublicReadiness(input: AtlasPublicReadinessInput): AtlasPublicReadinessResult {
  const missing = REQUIRED_BOOLEAN_KEYS.filter((key) => !input[key]).map(String);
  const scopeReady = input.geographicScope === "FR";
  const blockers = [...missing];
  if (!scopeReady) blockers.push("geographicScope must be FR until country-specific validation is complete");

  return {
    ready: blockers.length === 0,
    scopeReady,
    missing,
    blockers,
  };
}

function enabled(value: string | undefined): boolean {
  return value === "true";
}

export function getAtlasPublicReadinessFromEnv(env: NodeJS.ProcessEnv): AtlasPublicReadinessResult {
  return evaluateAtlasPublicReadiness({
    database: Boolean(env.DATABASE_URL),
    externalAi: Boolean(env.OPENAI_API_KEY),
    transactionalEmail: Boolean(env.RESEND_API_KEY && env.ATLAS_EMAIL_FROM),
    scheduledMaintenance: Boolean(env.CRON_SECRET),
    observability: enabled(env.ATLAS_OBSERVABILITY_READY),
    incidentAlerting: enabled(env.ATLAS_INCIDENT_ALERTING_READY),
    rollbackReady: enabled(env.ATLAS_ROLLBACK_READY),
    legalReview: enabled(env.ATLAS_LEGAL_REVIEW_APPROVED),
    privacyReview: enabled(env.ATLAS_PRIVACY_REVIEW_APPROVED),
    securityReview: enabled(env.ATLAS_SECURITY_REVIEW_APPROVED),
    clinicalReview: enabled(env.ATLAS_CLINICAL_REVIEW_APPROVED),
    minorSafetyReview: enabled(env.ATLAS_MINOR_SAFETY_REVIEW_APPROVED),
    autonomousEmotionalCoreReady: enabled(env.ATLAS_AUTONOMOUS_EMOTIONAL_CORE_READY),
    governedDecisionEngineReady: enabled(env.ATLAS_GOVERNED_DECISION_ENGINE_READY),
    automaticExternalActionsDisabled: enabled(env.ATLAS_AUTOMATIC_EXTERNAL_ACTIONS_DISABLED),
    emergencyResourcesValidated: enabled(env.ATLAS_EMERGENCY_RESOURCES_VALIDATED),
    accessibilityReview: enabled(env.ATLAS_ACCESSIBILITY_REVIEW_APPROVED),
    loadTestingPassed: enabled(env.ATLAS_LOAD_TESTING_PASSED),
    conversationEvaluationPassed: enabled(env.ATLAS_CONVERSATION_EVALUATION_PASSED),
    dataRetentionConfigured: enabled(env.ATLAS_DATA_RETENTION_CONFIGURED),
    deletionWorkflowReady: enabled(env.ATLAS_DELETION_WORKFLOW_READY),
    geographicScope: env.ATLAS_PUBLIC_COUNTRY || "",
  });
}
