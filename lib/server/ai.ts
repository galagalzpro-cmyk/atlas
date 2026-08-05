import "server-only";
import type { AtlasAudience } from "../atlas/types";
import type { SafetyAssessment } from "../atlas/safety";
import type { AtlasConversationTurn } from "../atlas/conversation";
import type { AtlasAutonomyDecision } from "../atlas/autonomy";
import { describeAtlasAutonomyDecision } from "../atlas/autonomy";
import type { AtlasEmotionalState } from "../atlas/emotional-intelligence";
import { describeAtlasEmotionalState } from "../atlas/emotional-intelligence";
import {
  ATLAS_PRESENCE_CONTRACT,
  buildAtlasConversationContext,
  getAudiencePresenceRule,
} from "../atlas/presence";

export interface AtlasGeneratedReply {
  text: string;
  nextStep: string;
  labels: string[];
  provider: "openai";
  model: string;
  requestId: string | null;
  latencyMs: number;
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

function parseStructuredReply(raw: string): Pick<AtlasGeneratedReply, "text" | "nextStep" | "labels"> {
  try {
    const parsed = JSON.parse(raw) as { text?: unknown; nextStep?: unknown; labels?: unknown };
    if (typeof parsed.text !== "string") throw new Error("invalid");
    return {
      text: parsed.text.slice(0, 1800).trim(),
      nextStep: typeof parsed.nextStep === "string" ? parsed.nextStep.slice(0, 320).trim() : "",
      labels: Array.isArray(parsed.labels)
        ? parsed.labels.filter((label): label is string => typeof label === "string").slice(0, 2)
        : [],
    };
  } catch {
    return {
      text: raw.slice(0, 1800).trim(),
      nextStep: "",
      labels: [],
    };
  }
}

export async function generateAtlasReply(input: {
  text: string;
  audience: AtlasAudience;
  safety: SafetyAssessment;
  history: AtlasConversationTurn[];
  autonomy: AtlasAutonomyDecision;
  emotional: AtlasEmotionalState;
  signal?: AbortSignal;
}): Promise<AtlasGeneratedReply> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.ATLAS_OPENAI_MODEL || "gpt-5";
  if (!apiKey) throw new Error("External AI is not configured");
  if (input.safety.level === "urgent" || input.safety.shouldPauseGeneration) {
    throw new Error("External generation is blocked by local safety policy");
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
        ATLAS_PRESENCE_CONTRACT,
        getAudiencePresenceRule(input.audience),
        describeAtlasAutonomyDecision(input.autonomy),
        describeAtlasEmotionalState(input.emotional),
        "Respecte strictement la décision autonome et la lecture émotionnelle : besoin, mode, profondeur, rythme, nombre maximal de questions et niveau de préparation à l'action.",
        "N'affirme jamais qu'une émotion est certaine. Si la confiance est faible, réponds au besoin sans nommer l'émotion.",
        "Retourne uniquement un objet JSON avec text, nextStep et labels.",
        "text contient la réponse conversationnelle complète.",
        "nextStep reste vide sauf lorsqu'une action concrète est réellement utile, demandée et autorisée.",
        "labels reste vide ou contient au maximum deux libellés techniques invisibles pour la personne.",
      ].join(" "),
      input: buildAtlasConversationContext({
        history: input.history.slice(-input.autonomy.memoryTurns),
        text: input.text,
      }),
      max_output_tokens: input.autonomy.depth === "deep" ? 850 : input.autonomy.depth === "balanced" ? 650 : 420,
      text: {
        format: {
          type: "json_schema",
          name: "atlas_reply",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["text", "nextStep", "labels"],
            properties: {
              text: { type: "string" },
              nextStep: { type: "string" },
              labels: { type: "array", maxItems: 2, items: { type: "string" } },
            },
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
    ...parseStructuredReply(output),
    provider: "openai",
    model,
    requestId: response.headers.get("x-request-id") || payload.id || null,
    latencyMs: Date.now() - startedAt,
  };
}
