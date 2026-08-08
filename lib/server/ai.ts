import "server-only";
import type { AtlasConversationTurn } from "../atlas/conversation";
import type { AtlasTurnPlan } from "../atlas/orchestrator";
import { describeAtlasTurnPlan } from "../atlas/orchestrator";
import { describeAtlasCognitiveState } from "../atlas/cognitive-state";
import { describeAtlasRelationalState } from "../atlas/relational-core";
import { describeAtlasPolicy } from "../atlas/policy-kernel";
import { describeConversationMemory } from "../atlas/memory";
import {
  chooseAtlasModelLane,
  type AtlasModelLane,
  type AtlasOpenAIPowerMode,
} from "../atlas/model-routing";
import {
  ATLAS_PRESENCE_CONTRACT,
  buildAtlasConversationContext,
  getAudiencePresenceRule,
} from "../atlas/presence";

export interface AtlasGeneratedReply {
  text: string;
  provider: "openai";
  model: string;
  modelLane: AtlasModelLane;
  complexityScore: number;
  requestId: string | null;
  latencyMs: number;
  revisionCount: 0 | 1;
}

type ReasoningEffort = "none" | "low" | "medium" | "high";

interface AtlasModelCandidate {
  model: string;
  reasoningEffort: ReasoningEffort | null;
}

function extractOutputText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const root = payload as { output_text?: unknown; output?: unknown };
  if (typeof root.output_text === "string") return root.output_text;
  if (!Array.isArray(root.output)) return "";
  return root.output.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) return [];
    return content.flatMap((part) => {
      if (!part || typeof part !== "object") return [];
      const text = (part as { text?: unknown }).text;
      return typeof text === "string" ? [text] : [];
    });
  }).join("\n");
}

function parseText(raw: string, maxCharacters: number): string {
  try {
    const parsed = JSON.parse(raw) as { text?: unknown };
    if (typeof parsed.text !== "string") throw new Error("invalid");
    return parsed.text.trim().slice(0, maxCharacters);
  } catch {
    return raw.trim().slice(0, maxCharacters);
  }
}

function maxOutputTokens(plan: AtlasTurnPlan): number {
  if (plan.relational.responseLength === "developed") return 1100;
  if (plan.relational.responseLength === "balanced") return 760;
  if (plan.relational.responseLength === "short") return 480;
  return 300;
}

function cognitiveInstructions(plan: AtlasTurnPlan): string {
  return [
    ATLAS_PRESENCE_CONTRACT,
    getAudiencePresenceRule(plan.cognitive.audience),
    `Plan autonome : ${describeAtlasTurnPlan(plan)}.`,
    `État cognitif : ${describeAtlasCognitiveState(plan.cognitive)}.`,
    `État relationnel : ${describeAtlasRelationalState(plan.relational)}.`,
    `Politique : ${describeAtlasPolicy(plan.policy)}.`,
    "Mémoire de travail :",
    describeConversationMemory(plan.memory),
    `Mouvement conversationnel obligatoire : ${plan.cognitive.nextMove}.`,
    plan.cognitive.reasonNotToAskQuestion
      ? `Ne pose aucune question. Raison interne : ${plan.cognitive.reasonNotToAskQuestion}`
      : "Une seule question est autorisée uniquement si elle fait avancer le mouvement choisi.",
    "Raisonne avec plusieurs hypothèses lorsque la situation est ambiguë, mais ne présente jamais une hypothèse interne comme un fait.",
    "Ne montre pas de score psychologique, de diagnostic ou de pseudo-certitude émotionnelle.",
    "Respecte les corrections, préférences, refus et questions déjà posées.",
    "Ne crée ni exclusivité, ni dette émotionnelle, ni pression pour revenir.",
    "Privilégie la précision, la pertinence et la présence plutôt que la longueur.",
    "Retourne uniquement un objet JSON contenant la propriété text.",
  ].join(" ");
}

function powerMode(): AtlasOpenAIPowerMode {
  const value = process.env.ATLAS_OPENAI_POWER_MODE;
  if (value === "economy" || value === "maximum") return value;
  return "balanced";
}

function candidatesForLane(lane: AtlasModelLane): AtlasModelCandidate[] {
  const fast = process.env.ATLAS_OPENAI_FAST_MODEL || "gpt-5-mini";
  const balanced = process.env.ATLAS_OPENAI_BALANCED_MODEL || process.env.ATLAS_OPENAI_MODEL || "gpt-5.1";
  const deep = process.env.ATLAS_OPENAI_DEEP_MODEL || "gpt-5-pro";

  if (lane === "fast") {
    return [
      { model: fast, reasoningEffort: "low" },
      { model: balanced, reasoningEffort: "low" },
    ];
  }
  if (lane === "deep") {
    return [
      { model: deep, reasoningEffort: null },
      { model: balanced, reasoningEffort: "high" },
      { model: fast, reasoningEffort: "medium" },
    ];
  }
  return [
    { model: balanced, reasoningEffort: "medium" },
    { model: fast, reasoningEffort: "medium" },
  ];
}

async function requestCandidate(input: {
  candidate: AtlasModelCandidate;
  plan: AtlasTurnPlan;
  history: AtlasConversationTurn[];
  text: string;
  extraInstructions?: string[];
  signal?: AbortSignal;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("External AI is not configured");

  const requestBody: Record<string, unknown> = {
    model: input.candidate.model,
    store: false,
    instructions: [
      cognitiveInstructions(input.plan),
      ...(input.extraInstructions ?? []),
    ].join(" "),
    input: buildAtlasConversationContext({
      history: input.history.slice(-input.plan.autonomy.memoryTurns),
      text: input.text,
    }),
    max_output_tokens: maxOutputTokens(input.plan),
    text: {
      format: {
        type: "json_schema",
        name: "atlas_reply_v5",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["text"],
          properties: { text: { type: "string" } },
        },
      },
    },
  };

  if (input.candidate.reasoningEffort) {
    requestBody.reasoning = { effort: input.candidate.reasoningEffort };
  }

  const startedAt = Date.now();
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
    signal: input.signal,
    cache: "no-store",
  });

  const payload = await response.json() as { id?: string; error?: { message?: string; code?: string } };
  if (!response.ok) {
    const error = new Error(payload.error?.message || "External AI request failed") as Error & { status?: number; code?: string };
    error.status = response.status;
    error.code = payload.error?.code;
    throw error;
  }

  const output = extractOutputText(payload);
  if (!output) throw new Error("External AI returned no text");

  return {
    text: parseText(output, input.plan.policy.maxResponseCharacters),
    provider: "openai" as const,
    model: input.candidate.model,
    requestId: response.headers.get("x-request-id") || payload.id || null,
    latencyMs: Date.now() - startedAt,
  };
}

function isFallbackEligible(error: unknown): boolean {
  const candidate = error as { status?: number; code?: string };
  return candidate.status === 404 || candidate.status === 429 || candidate.status === 503 || candidate.code === "model_not_found";
}

async function requestReply(input: {
  plan: AtlasTurnPlan;
  history: AtlasConversationTurn[];
  text: string;
  purpose?: "generate" | "revise";
  extraInstructions?: string[];
  signal?: AbortSignal;
}): Promise<Omit<AtlasGeneratedReply, "revisionCount">> {
  if (!input.plan.policy.externalGenerationAllowed) {
    throw new Error("External generation is blocked by ATLAS policy");
  }

  const routing = chooseAtlasModelLane({
    plan: input.plan,
    history: input.history,
    text: input.text,
    powerMode: powerMode(),
    purpose: input.purpose,
  });
  const candidates = candidatesForLane(routing.lane);
  let lastError: unknown = null;
  let accumulatedLatency = 0;

  for (const candidate of candidates) {
    const startedAt = Date.now();
    try {
      const result = await requestCandidate({ ...input, candidate });
      return {
        ...result,
        latencyMs: accumulatedLatency + result.latencyMs,
        modelLane: routing.lane,
        complexityScore: routing.complexityScore,
      };
    } catch (error) {
      accumulatedLatency += Date.now() - startedAt;
      lastError = error;
      if (!isFallbackEligible(error)) throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("No OpenAI model candidate available");
}

export async function generateAtlasReply(input: {
  plan: AtlasTurnPlan;
  history: AtlasConversationTurn[];
  text: string;
  signal?: AbortSignal;
}): Promise<AtlasGeneratedReply> {
  return {
    ...(await requestReply({ ...input, purpose: "generate" })),
    revisionCount: 0,
  };
}

export async function reviseAtlasReply(input: {
  plan: AtlasTurnPlan;
  history: AtlasConversationTurn[];
  text: string;
  previousReply: string;
  revisionInstructions: string[];
  signal?: AbortSignal;
}): Promise<AtlasGeneratedReply> {
  if (input.plan.policy.maxRevisions < 1) throw new Error("Revision is not allowed by policy");
  const revised = await requestReply({
    plan: input.plan,
    history: input.history,
    text: input.text,
    signal: input.signal,
    purpose: "revise",
    extraInstructions: [
      `Réponse précédente à corriger : ${JSON.stringify(input.previousReply)}.`,
      `Corrections obligatoires : ${input.revisionInstructions.join(" ")}.`,
      "Réécris entièrement la réponse sans commenter la révision.",
    ],
  });
  return { ...revised, revisionCount: 1 };
}
