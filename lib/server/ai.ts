import "server-only";
import type { AtlasConversationTurn } from "../atlas/conversation";
import type { AtlasTurnPlan } from "../atlas/orchestrator";
import { describeAtlasTurnPlan } from "../atlas/orchestrator";
import { describeAtlasCognitiveState } from "../atlas/cognitive-state";
import { describeAtlasRelationalState } from "../atlas/relational-core";
import { describeAtlasPolicy } from "../atlas/policy-kernel";
import { describeConversationMemory } from "../atlas/memory";
import {
  ATLAS_PRESENCE_CONTRACT,
  buildAtlasConversationContext,
  getAudiencePresenceRule,
} from "../atlas/presence";

export interface AtlasGeneratedReply {
  text: string;
  provider: "openai";
  model: string;
  requestId: string | null;
  latencyMs: number;
  revisionCount: 0 | 1;
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
  if (plan.relational.responseLength === "developed") return 900;
  if (plan.relational.responseLength === "balanced") return 650;
  if (plan.relational.responseLength === "short") return 420;
  return 260;
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
    "Les hypothèses internes ne sont jamais des faits. Ne les expose pas comme des catégories ou des scores.",
    "Respecte les corrections, préférences, refus et questions déjà posées.",
    "Ne crée ni exclusivité, ni dette émotionnelle, ni pression pour revenir.",
    "Retourne uniquement un objet JSON contenant la propriété text.",
  ].join(" ");
}

async function requestReply(input: {
  plan: AtlasTurnPlan;
  history: AtlasConversationTurn[];
  text: string;
  extraInstructions?: string[];
  signal?: AbortSignal;
}): Promise<Omit<AtlasGeneratedReply, "revisionCount">> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.ATLAS_OPENAI_MODEL || "gpt-5";
  if (!apiKey) throw new Error("External AI is not configured");
  if (!input.plan.policy.externalGenerationAllowed) {
    throw new Error("External generation is blocked by ATLAS policy");
  }

  const startedAt = Date.now();
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
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
          name: "atlas_reply_v4",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["text"],
            properties: { text: { type: "string" } },
          },
        },
      },
    }),
    signal: input.signal,
    cache: "no-store",
  });

  const payload = await response.json() as { id?: string; error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message || "External AI request failed");
  const output = extractOutputText(payload);
  if (!output) throw new Error("External AI returned no text");

  return {
    text: parseText(output, input.plan.policy.maxResponseCharacters),
    provider: "openai",
    model,
    requestId: response.headers.get("x-request-id") || payload.id || null,
    latencyMs: Date.now() - startedAt,
  };
}

export async function generateAtlasReply(input: {
  plan: AtlasTurnPlan;
  history: AtlasConversationTurn[];
  text: string;
  signal?: AbortSignal;
}): Promise<AtlasGeneratedReply> {
  return {
    ...(await requestReply(input)),
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
    extraInstructions: [
      `Réponse précédente à corriger : ${JSON.stringify(input.previousReply)}.`,
      `Corrections obligatoires : ${input.revisionInstructions.join(" ")}.`,
      "Réécris entièrement la réponse sans commenter la révision.",
    ],
  });
  return { ...revised, revisionCount: 1 };
}
