import "server-only";
import type { AtlasAudience } from "../atlas/types";
import type { SafetyAssessment } from "../atlas/safety";

export interface AtlasGeneratedReply {
  text: string;
  nextStep: string;
  labels: string[];
  provider: "openai" | "gemini" | "collaboration";
  model: string;
  requestId: string | null;
  latencyMs: number;
}

type ProviderReply = Omit<AtlasGeneratedReply, "provider"> & { provider: "openai" | "gemini" };

const AUDIENCE_RULES: Record<AtlasAudience, string> = {
  adolescent: "Langage direct, non infantilisant, détails facultatifs. Favoriser un adulte de confiance lorsque pertinent.",
  adult: "Langage structuré. Séparer faits, ressenti, besoin et prochaine décision réaliste.",
  senior: "Phrases courtes, rythme calme, une seule action principale, aucune infantilisation.",
};

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["text", "nextStep", "labels"],
  properties: {
    text: { type: "string" },
    nextStep: { type: "string" },
    labels: { type: "array", maxItems: 4, items: { type: "string" } },
  },
} as const;

function baseInstructions(audience: AtlasAudience): string {
  return [
    "Tu es le moteur de clarification ATLAS. Tu n'établis aucun diagnostic et tu ne remplaces aucun professionnel.",
    "Retourne uniquement un objet JSON avec text, nextStep et labels.",
    "text doit reconnaître la situation, distinguer ce qui est certain de ce qui ne l'est pas et rester concret.",
    "nextStep doit être une action simple, sûre, réaliste et réversible.",
    "labels doit contenir au maximum quatre libellés courts.",
    AUDIENCE_RULES[audience],
  ].join(" ");
}

function extractOpenAIOutputText(payload: unknown): string {
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

function extractGeminiOutputText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates)) return "";
  return candidates.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const content = (candidate as { content?: unknown }).content;
    if (!content || typeof content !== "object") return [];
    const parts = (content as { parts?: unknown }).parts;
    if (!Array.isArray(parts)) return [];
    return parts.flatMap((part) => {
      if (!part || typeof part !== "object") return [];
      const text = (part as { text?: unknown }).text;
      return typeof text === "string" ? [text] : [];
    });
  }).join("\n");
}

function parseStructuredReply(raw: string): Pick<AtlasGeneratedReply, "text" | "nextStep" | "labels"> {
  try {
    const parsed = JSON.parse(raw) as { text?: unknown; nextStep?: unknown; labels?: unknown };
    if (typeof parsed.text !== "string" || typeof parsed.nextStep !== "string") throw new Error("invalid");
    return {
      text: parsed.text.slice(0, 1600),
      nextStep: parsed.nextStep.slice(0, 320),
      labels: Array.isArray(parsed.labels)
        ? parsed.labels.filter((label): label is string => typeof label === "string").slice(0, 4)
        : [],
    };
  } catch {
    return {
      text: raw.slice(0, 1600),
      nextStep: "Choisir une action simple et réversible dans les prochaines heures.",
      labels: ["réponse assistée", "sans diagnostic"],
    };
  }
}

async function generateWithOpenAI(input: {
  text: string;
  audience: AtlasAudience;
  signal?: AbortSignal;
}): Promise<ProviderReply> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.ATLAS_OPENAI_MODEL || "gpt-5";
  if (!apiKey) throw new Error("OpenAI is not configured");

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
      instructions: baseInstructions(input.audience),
      input: input.text.slice(0, 6000),
      max_output_tokens: 500,
      text: {
        format: {
          type: "json_schema",
          name: "atlas_reply",
          strict: true,
          schema: OUTPUT_SCHEMA,
        },
      },
    }),
    signal: input.signal,
    cache: "no-store",
  });

  const payload = await response.json() as { id?: string; error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message || "OpenAI request failed");
  const output = extractOpenAIOutputText(payload);
  if (!output) throw new Error("OpenAI returned no text");
  return {
    ...parseStructuredReply(output),
    provider: "openai",
    model,
    requestId: response.headers.get("x-request-id") || payload.id || null,
    latencyMs: Date.now() - startedAt,
  };
}

async function generateWithGemini(input: {
  text: string;
  audience: AtlasAudience;
  signal?: AbortSignal;
  reviewOf?: ProviderReply;
}): Promise<ProviderReply> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.ATLAS_GEMINI_MODEL || "gemini-3.6-flash";
  if (!apiKey) throw new Error("Gemini is not configured");

  const startedAt = Date.now();
  const reviewContext = input.reviewOf
    ? `\n\nRéponse proposée par un autre moteur. Fais une relecture indépendante, corrige les faiblesses et retourne la meilleure réponse finale ATLAS au même format JSON.\n${JSON.stringify({ text: input.reviewOf.text, nextStep: input.reviewOf.nextStep, labels: input.reviewOf.labels })}`
    : "";

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: baseInstructions(input.audience) }],
      },
      contents: [{ role: "user", parts: [{ text: `${input.text.slice(0, 6000)}${reviewContext}` }] }],
      generationConfig: {
        maxOutputTokens: 500,
        responseMimeType: "application/json",
        responseJsonSchema: OUTPUT_SCHEMA,
      },
    }),
    signal: input.signal,
    cache: "no-store",
  });

  const payload = await response.json() as { responseId?: string; error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message || "Gemini request failed");
  const output = extractGeminiOutputText(payload);
  if (!output) throw new Error("Gemini returned no text");
  return {
    ...parseStructuredReply(output),
    provider: "gemini",
    model,
    requestId: response.headers.get("x-request-id") || payload.responseId || null,
    latencyMs: Date.now() - startedAt,
  };
}

export function externalAiConfigured(): boolean {
  const mode = (process.env.ATLAS_AI_MODE || "openai").toLowerCase();
  if (mode === "gemini") return Boolean(process.env.GEMINI_API_KEY);
  if (mode === "collaboration") return Boolean(process.env.OPENAI_API_KEY && process.env.GEMINI_API_KEY);
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function generateAtlasReply(input: {
  text: string;
  audience: AtlasAudience;
  safety: SafetyAssessment;
  signal?: AbortSignal;
}): Promise<AtlasGeneratedReply> {
  if (input.safety.level === "urgent" || input.safety.shouldPauseGeneration) {
    throw new Error("External generation is blocked by local safety policy");
  }

  const mode = (process.env.ATLAS_AI_MODE || "openai").toLowerCase();
  if (mode === "gemini") return generateWithGemini(input);
  if (mode === "collaboration") {
    if (!process.env.OPENAI_API_KEY || !process.env.GEMINI_API_KEY) {
      throw new Error("Collaboration mode requires both OpenAI and Gemini");
    }
    const startedAt = Date.now();
    const draft = await generateWithOpenAI(input);
    const reviewed = await generateWithGemini({ ...input, reviewOf: draft });
    return {
      ...reviewed,
      provider: "collaboration",
      model: `${draft.model} + ${reviewed.model}`,
      requestId: [draft.requestId, reviewed.requestId].filter(Boolean).join("|") || null,
      latencyMs: Date.now() - startedAt,
    };
  }
  return generateWithOpenAI(input);
}
