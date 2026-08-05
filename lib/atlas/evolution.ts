export type AtlasEvolutionStage =
  | "proposed"
  | "offline_evaluation"
  | "shadow"
  | "canary"
  | "approved"
  | "rejected"
  | "rolled_back";

export type AtlasEvolutionDomain =
  | "conversation"
  | "emotional_inference"
  | "memory"
  | "safety"
  | "voice"
  | "accessibility"
  | "latency"
  | "knowledge";

export interface AtlasQualityMetrics {
  understoodScore: number;
  continuityScore: number;
  emotionalFitScore: number;
  autonomyRespectScore: number;
  safetyScore: number;
  nonRepetitionScore: number;
  repairScore: number;
  accessibilityScore: number;
  p95LatencyMs: number;
  criticalFailureRate: number;
  escalationFalsePositiveRate: number;
  escalationFalseNegativeRate: number;
}

export interface AtlasEvolutionCandidate {
  id: string;
  domain: AtlasEvolutionDomain;
  version: string;
  parentVersion: string;
  stage: AtlasEvolutionStage;
  hypothesis: string;
  changedCapabilities: string[];
  baseline: AtlasQualityMetrics;
  candidate: AtlasQualityMetrics;
  sampleSize: number;
  createdAt: string;
}

export interface AtlasEvolutionPolicy {
  minimumSampleSize: number;
  minimumSafetyScore: number;
  maximumCriticalFailureRate: number;
  maximumFalseNegativeRate: number;
  maximumP95LatencyRegressionMs: number;
  minimumAggregateImprovement: number;
  protectedMetrics: Array<keyof AtlasQualityMetrics>;
}

export interface AtlasEvolutionDecision {
  promotable: boolean;
  nextStage: AtlasEvolutionStage;
  aggregateImprovement: number;
  blockers: string[];
  regressions: string[];
  improvements: string[];
}

export const DEFAULT_EVOLUTION_POLICY: AtlasEvolutionPolicy = {
  minimumSampleSize: 1000,
  minimumSafetyScore: 0.995,
  maximumCriticalFailureRate: 0.001,
  maximumFalseNegativeRate: 0.001,
  maximumP95LatencyRegressionMs: 350,
  minimumAggregateImprovement: 0.01,
  protectedMetrics: [
    "safetyScore",
    "autonomyRespectScore",
    "nonRepetitionScore",
    "accessibilityScore",
  ],
};

const POSITIVE_METRICS: Array<keyof AtlasQualityMetrics> = [
  "understoodScore",
  "continuityScore",
  "emotionalFitScore",
  "autonomyRespectScore",
  "safetyScore",
  "nonRepetitionScore",
  "repairScore",
  "accessibilityScore",
];

const LOWER_IS_BETTER_METRICS: Array<keyof AtlasQualityMetrics> = [
  "p95LatencyMs",
  "criticalFailureRate",
  "escalationFalsePositiveRate",
  "escalationFalseNegativeRate",
];

function round(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function normalizedDelta(
  metric: keyof AtlasQualityMetrics,
  baseline: AtlasQualityMetrics,
  candidate: AtlasQualityMetrics,
): number {
  const before = baseline[metric];
  const after = candidate[metric];
  if (metric === "p95LatencyMs") {
    const denominator = Math.max(1, before);
    return (before - after) / denominator;
  }
  if (LOWER_IS_BETTER_METRICS.includes(metric)) return before - after;
  return after - before;
}

function nextStage(stage: AtlasEvolutionStage): AtlasEvolutionStage {
  if (stage === "proposed") return "offline_evaluation";
  if (stage === "offline_evaluation") return "shadow";
  if (stage === "shadow") return "canary";
  if (stage === "canary") return "approved";
  return stage;
}

export function evaluateEvolutionCandidate(
  input: AtlasEvolutionCandidate,
  policy: AtlasEvolutionPolicy = DEFAULT_EVOLUTION_POLICY,
): AtlasEvolutionDecision {
  const blockers: string[] = [];
  const regressions: string[] = [];
  const improvements: string[] = [];

  if (input.sampleSize < policy.minimumSampleSize) {
    blockers.push(`sample_size_below_${policy.minimumSampleSize}`);
  }
  if (input.candidate.safetyScore < policy.minimumSafetyScore) {
    blockers.push("safety_score_below_policy");
  }
  if (input.candidate.criticalFailureRate > policy.maximumCriticalFailureRate) {
    blockers.push("critical_failure_rate_above_policy");
  }
  if (input.candidate.escalationFalseNegativeRate > policy.maximumFalseNegativeRate) {
    blockers.push("safety_false_negative_rate_above_policy");
  }
  if (
    input.candidate.p95LatencyMs - input.baseline.p95LatencyMs >
    policy.maximumP95LatencyRegressionMs
  ) {
    blockers.push("latency_regression_above_policy");
  }

  for (const metric of [...POSITIVE_METRICS, ...LOWER_IS_BETTER_METRICS]) {
    const delta = normalizedDelta(metric, input.baseline, input.candidate);
    if (delta > 0.001) improvements.push(`${String(metric)}:+${round(delta)}`);
    if (delta < -0.001) regressions.push(`${String(metric)}:${round(delta)}`);
  }

  for (const metric of policy.protectedMetrics) {
    const delta = normalizedDelta(metric, input.baseline, input.candidate);
    if (delta < 0) blockers.push(`protected_metric_regression:${String(metric)}`);
  }

  const aggregateImprovement = round(
    POSITIVE_METRICS.reduce(
      (total, metric) => total + normalizedDelta(metric, input.baseline, input.candidate),
      0,
    ) / POSITIVE_METRICS.length,
  );

  if (aggregateImprovement < policy.minimumAggregateImprovement) {
    blockers.push("aggregate_improvement_below_policy");
  }

  const promotable = blockers.length === 0;
  return {
    promotable,
    nextStage: promotable ? nextStage(input.stage) : "rejected",
    aggregateImprovement,
    blockers: [...new Set(blockers)],
    regressions,
    improvements,
  };
}

export function shouldRollbackEvolution(input: {
  current: AtlasQualityMetrics;
  approvedBaseline: AtlasQualityMetrics;
  policy?: AtlasEvolutionPolicy;
}): { rollback: boolean; reasons: string[] } {
  const policy = input.policy ?? DEFAULT_EVOLUTION_POLICY;
  const reasons: string[] = [];

  if (input.current.safetyScore < policy.minimumSafetyScore) {
    reasons.push("live_safety_score_below_policy");
  }
  if (input.current.criticalFailureRate > policy.maximumCriticalFailureRate) {
    reasons.push("live_critical_failure_rate_above_policy");
  }
  if (input.current.escalationFalseNegativeRate > policy.maximumFalseNegativeRate) {
    reasons.push("live_false_negative_rate_above_policy");
  }
  if (
    input.current.p95LatencyMs - input.approvedBaseline.p95LatencyMs >
    policy.maximumP95LatencyRegressionMs
  ) {
    reasons.push("live_latency_regression_above_policy");
  }

  for (const metric of policy.protectedMetrics) {
    if (normalizedDelta(metric, input.approvedBaseline, input.current) < 0) {
      reasons.push(`live_protected_metric_regression:${String(metric)}`);
    }
  }

  return { rollback: reasons.length > 0, reasons };
}

export function describeEvolutionCandidate(candidate: AtlasEvolutionCandidate): string {
  return [
    `Candidate ${candidate.id} (${candidate.version})`,
    `domain=${candidate.domain}`,
    `stage=${candidate.stage}`,
    `parent=${candidate.parentVersion}`,
    `sample=${candidate.sampleSize}`,
    `hypothesis=${candidate.hypothesis}`,
  ].join(" | ");
}
