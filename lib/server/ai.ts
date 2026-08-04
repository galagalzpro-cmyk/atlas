import "server-only";
import type { AtlasAudience } from "../atlas/types";
import type { SafetyAssessment } from "../atlas/safety";

export interface AtlasGeneratedReply {
  text: string;
  nextStep: string;
  labels: string[];
  provider: "openai";
  model: string;
  requestId: string | null;
  latencyMs: number;
}

const AUDIENCE_RULES: Record<AtlasAudience, string> = {
  adolescent: "Langage direct, non infantilisant, détails facultatifs. Favoriser un adulte de confiance lorsque pertinent.",
  adult: "Langage structuré. Séparer faits, ressenti, besoin et prochaine décision réaliste.",
  senior: "Phrases courtes, rythme calme, une seule action principale, aucune infantilisation.",
};

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

export async function generateAtlasReply(input: {
  text: string;
  audience: AtlasAudience;
  safety: SafetyAssessment;
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
        "Tu es le moteur de clarification ATLAS. Tu n'établis aucun diagnostic et tu ne remplaces aucun professionnel.",
        "Retourne uniquement un objet JSON avec text, nextStep et labels.",
        "text doit reconnaître la situation, distinguer ce qui est certain de ce qui ne l'est pas et rester concret.",
        "nextStep doit être une action simple, sûre, réaliste et réversible.",
        "labels doit contenir au maximum quatre libellés courts.",
        AUDIENCE_RULES[input.audience],
      ].join(" "),
      input: input.text.slice(0, 6000),
      max_output_tokens: 500,
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
              labels: { type: "array", maxItems: 4, items: { type: "string" } },
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
