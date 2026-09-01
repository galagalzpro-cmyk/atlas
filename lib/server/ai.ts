import "server-only";
import type { AtlasAudience } from "../atlas/types";
import type { SafetyAssessment } from "../atlas/safety";

export type AtlasProvider =
  | "openai"
  | "gemini"
  | "anthropic"
  | "mistral"
  | "xai"
  | "deepseek"
  | "cohere"
  | "qwen";

export interface AtlasGeneratedReply {
  text: string;
  nextStep: string;
  labels: string[];
  provider: AtlasProvider | "collaboration" | "ensemble";
  model: string;
  requestId: string | null;
  latencyMs: number;
}

type ProviderReply = Omit<AtlasGeneratedReply, "provider"> & { provider: AtlasProvider };
type GenerationInput = { text: string; audience: AtlasAudience; signal?: AbortSignal; reviewOf?: ProviderReply[] };

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
    "Tu es un moteur de clarification ATLAS. Tu n'établis aucun diagnostic et tu ne remplaces aucun professionnel.",
    "Retourne uniquement un objet JSON avec text, nextStep et labels.",
    "text doit reconnaître la situation, distinguer ce qui est certain de ce qui ne l'est pas et rester concret.",
    "nextStep doit être une action simple, sûre, réaliste et réversible.",
    "labels doit contenir au maximum quatre libellés courts.",
    AUDIENCE_RULES[audience],
  ].join(" ");
}

function synthesisText(input: GenerationInput): string {
  if (!input.reviewOf?.length) return input.text.slice(0, 6000);
  const candidates = input.reviewOf.map((candidate) => ({
    provider: candidate.provider,
    model: candidate.model,
    text: candidate.text,
    nextStep: candidate.nextStep,
    labels: candidate.labels,
  }));
  return [
    input.text.slice(0, 6000),
    "",
    "Plusieurs moteurs indépendants ont proposé des réponses ci-dessous.",
    "Produis la meilleure réponse ATLAS finale: conserve les points robustes, écarte les affirmations non étayées, résous les contradictions prudemment et n'invente aucun consensus.",
    JSON.stringify(candidates),
  ].join("\n");
}

function parseStructuredReply(raw: string): Pick<AtlasGeneratedReply, "text" | "nextStep" | "labels"> {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(cleaned) as { text?: unknown; nextStep?: unknown; labels?: unknown };
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
      text: cleaned.slice(0, 1600),
      nextStep: "Choisir une action simple et réversible dans les prochaines heures.",
      labels: ["réponse assistée", "sans diagnostic"],
    };
  }
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

function extractChatCompletionText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices)) return "";
  const first = choices[0];
  if (!first || typeof first !== "object") return "";
  const message = (first as { message?: unknown }).message;
  if (!message || typeof message !== "object") return "";
  const content = (message as { content?: unknown }).content;
  return typeof content === "string" ? content : "";
}

async function generateWithOpenAI(input: GenerationInput): Promise<ProviderReply> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.ATLAS_OPENAI_MODEL || "gpt-5";
  if (!apiKey) throw new Error("OpenAI is not configured");
  const startedAt = Date.now();
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      store: false,
      instructions: baseInstructions(input.audience),
      input: synthesisText(input),
      max_output_tokens: 500,
      text: { format: { type: "json_schema", name: "atlas_reply", strict: true, schema: OUTPUT_SCHEMA } },
    }),
    signal: input.signal,
    cache: "no-store",
  });
  const payload = await response.json() as { id?: string; error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message || "OpenAI request failed");
  const output = extractOpenAIOutputText(payload);
  if (!output) throw new Error("OpenAI returned no text");
  return { ...parseStructuredReply(output), provider: "openai", model, requestId: response.headers.get("x-request-id") || payload.id || null, latencyMs: Date.now() - startedAt };
}

async function generateWithGemini(input: GenerationInput): Promise<ProviderReply> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.ATLAS_GEMINI_MODEL || "gemini-3.6-flash";
  if (!apiKey) throw new Error("Gemini is not configured");
  const startedAt = Date.now();
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: baseInstructions(input.audience) }] },
      contents: [{ role: "user", parts: [{ text: synthesisText(input) }] }],
      generationConfig: { maxOutputTokens: 500, responseMimeType: "application/json", responseJsonSchema: OUTPUT_SCHEMA },
    }),
    signal: input.signal,
    cache: "no-store",
  });
  const payload = await response.json() as { responseId?: string; error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message || "Gemini request failed");
  const output = extractGeminiOutputText(payload);
  if (!output) throw new Error("Gemini returned no text");
  return { ...parseStructuredReply(output), provider: "gemini", model, requestId: response.headers.get("x-request-id") || payload.responseId || null, latencyMs: Date.now() - startedAt };
}

async function generateWithAnthropic(input: GenerationInput): Promise<ProviderReply> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ATLAS_ANTHROPIC_MODEL;
  if (!apiKey || !model) throw new Error("Anthropic is not configured");
  const startedAt = Date.now();
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({ model, max_tokens: 500, system: baseInstructions(input.audience), messages: [{ role: "user", content: synthesisText(input) }] }),
    signal: input.signal,
    cache: "no-store",
  });
  const payload = await response.json() as { id?: string; content?: Array<{ type?: string; text?: string }>; error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message || "Anthropic request failed");
  const output = payload.content?.filter((part) => part.type === "text").map((part) => part.text || "").join("\n") || "";
  if (!output) throw new Error("Anthropic returned no text");
  return { ...parseStructuredReply(output), provider: "anthropic", model, requestId: response.headers.get("request-id") || payload.id || null, latencyMs: Date.now() - startedAt };
}

const COMPATIBLE_PROVIDER_CONFIG: Record<"mistral" | "xai" | "deepseek" | "qwen", { key: string; model: string; baseUrl: string }> = {
  mistral: { key: "MISTRAL_API_KEY", model: "ATLAS_MISTRAL_MODEL", baseUrl: "ATLAS_MISTRAL_BASE_URL" },
  xai: { key: "XAI_API_KEY", model: "ATLAS_XAI_MODEL", baseUrl: "ATLAS_XAI_BASE_URL" },
  deepseek: { key: "DEEPSEEK_API_KEY", model: "ATLAS_DEEPSEEK_MODEL", baseUrl: "ATLAS_DEEPSEEK_BASE_URL" },
  qwen: { key: "QWEN_API_KEY", model: "ATLAS_QWEN_MODEL", baseUrl: "ATLAS_QWEN_BASE_URL" },
};

async function generateOpenAICompatible(provider: keyof typeof COMPATIBLE_PROVIDER_CONFIG, input: GenerationInput): Promise<ProviderReply> {
  const config = COMPATIBLE_PROVIDER_CONFIG[provider];
  const apiKey = process.env[config.key];
  const model = process.env[config.model];
  const baseUrl = process.env[config.baseUrl]?.replace(/\/$/, "");
  if (!apiKey || !model || !baseUrl) throw new Error(`${provider} is not configured`);
  const startedAt = Date.now();
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: baseInstructions(input.audience) },
        { role: "user", content: synthesisText(input) },
      ],
      max_tokens: 500,
      response_format: { type: "json_object" },
    }),
    signal: input.signal,
    cache: "no-store",
  });
  const payload = await response.json() as { id?: string; error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message || `${provider} request failed`);
  const output = extractChatCompletionText(payload);
  if (!output) throw new Error(`${provider} returned no text`);
  return { ...parseStructuredReply(output), provider, model, requestId: response.headers.get("x-request-id") || payload.id || null, latencyMs: Date.now() - startedAt };
}

async function generateWithCohere(input: GenerationInput): Promise<ProviderReply> {
  const apiKey = process.env.COHERE_API_KEY;
  const model = process.env.ATLAS_COHERE_MODEL;
  if (!apiKey || !model) throw new Error("Cohere is not configured");
  const startedAt = Date.now();
  const response = await fetch("https://api.cohere.com/v2/chat", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: baseInstructions(input.audience) },
        { role: "user", content: synthesisText(input) },
      ],
      max_tokens: 500,
    }),
    signal: input.signal,
    cache: "no-store",
  });
  const payload = await response.json() as { id?: string; message?: { content?: Array<{ type?: string; text?: string }> }; message_text?: string };
  if (!response.ok) throw new Error("Cohere request failed");
  const output = payload.message?.content?.map((part) => part.text || "").join("\n") || payload.message_text || "";
  if (!output) throw new Error("Cohere returned no text");
  return { ...parseStructuredReply(output), provider: "cohere", model, requestId: response.headers.get("x-request-id") || payload.id || null, latencyMs: Date.now() - startedAt };
}

function providerConfigured(provider: AtlasProvider): boolean {
  if (provider === "openai") return Boolean(process.env.OPENAI_API_KEY);
  if (provider === "gemini") return Boolean(process.env.GEMINI_API_KEY);
  if (provider === "anthropic") return Boolean(process.env.ANTHROPIC_API_KEY && process.env.ATLAS_ANTHROPIC_MODEL);
  if (provider === "cohere") return Boolean(process.env.COHERE_API_KEY && process.env.ATLAS_COHERE_MODEL);
  const config = COMPATIBLE_PROVIDER_CONFIG[provider];
  return Boolean(process.env[config.key] && process.env[config.model] && process.env[config.baseUrl]);
}

function configuredProviders(): AtlasProvider[] {
  const allowed = (process.env.ATLAS_AI_PROVIDERS || "openai,gemini,anthropic,mistral,xai,deepseek,cohere,qwen")
    .split(",").map((value) => value.trim().toLowerCase()).filter(Boolean) as AtlasProvider[];
  return [...new Set(allowed)].filter((provider) => ["openai", "gemini", "anthropic", "mistral", "xai", "deepseek", "cohere", "qwen"].includes(provider) && providerConfigured(provider));
}

async function generateWithProvider(provider: AtlasProvider, input: GenerationInput): Promise<ProviderReply> {
  if (provider === "openai") return generateWithOpenAI(input);
  if (provider === "gemini") return generateWithGemini(input);
  if (provider === "anthropic") return generateWithAnthropic(input);
  if (provider === "cohere") return generateWithCohere(input);
  return generateOpenAICompatible(provider, input);
}

function chooseSynthesizer(candidates: ProviderReply[]): AtlasProvider {
  const requested = (process.env.ATLAS_SYNTHESIZER_PROVIDER || "openai").toLowerCase() as AtlasProvider;
  if (providerConfigured(requested)) return requested;
  return candidates[0].provider;
}

export function externalAiConfigured(): boolean {
  const mode = (process.env.ATLAS_AI_MODE || "openai").toLowerCase();
  if (mode === "ensemble") return configuredProviders().length > 0;
  if (mode === "collaboration") return Boolean(process.env.OPENAI_API_KEY && process.env.GEMINI_API_KEY);
  return providerConfigured(mode as AtlasProvider);
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
  if (mode === "collaboration") {
    const startedAt = Date.now();
    const draft = await generateWithOpenAI(input);
    const reviewed = await generateWithGemini({ ...input, reviewOf: [draft] });
    return { ...reviewed, provider: "collaboration", model: `${draft.model} + ${reviewed.model}`, requestId: [draft.requestId, reviewed.requestId].filter(Boolean).join("|") || null, latencyMs: Date.now() - startedAt };
  }

  if (mode === "ensemble") {
    const startedAt = Date.now();
    const providers = configuredProviders();
    if (!providers.length) throw new Error("No ensemble providers are configured");
    const settled = await Promise.allSettled(providers.map((provider) => generateWithProvider(provider, input)));
    const candidates = settled.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
    if (!candidates.length) throw new Error("All ensemble providers failed");
    if (candidates.length === 1) return candidates[0];
    const synthesizer = chooseSynthesizer(candidates);
    const final = await generateWithProvider(synthesizer, { ...input, reviewOf: candidates });
    return {
      ...final,
      provider: "ensemble",
      model: `${candidates.map((candidate) => `${candidate.provider}:${candidate.model}`).join(" + ")} -> ${synthesizer}:${final.model}`,
      requestId: [...candidates.map((candidate) => candidate.requestId), final.requestId].filter(Boolean).join("|") || null,
      latencyMs: Date.now() - startedAt,
    };
  }

  return generateWithProvider(mode as AtlasProvider, input);
}
