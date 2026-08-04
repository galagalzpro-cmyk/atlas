import { NextResponse } from "next/server";
import {
  ATLAS_INSTRUCTIONS,
  deriveVisualProfile,
  fallbackResponse,
  hasUrgentSignal,
} from "../../../lib/atlas-core";

type RequestBody = {
  message?: unknown;
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

function extractText(payload: OpenAIResponse): string | null {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }
  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string" && content.text.trim()) {
        return content.text.trim();
      }
    }
  }
  return null;
}

export async function GET() {
  return NextResponse.json({
    service: "atlas-core",
    status: "ready",
    conversation: true,
    safety: true,
    neuralVisualState: true,
    externalAiConfigured: Boolean(process.env.OPENAI_API_KEY),
    modelConfigured: Boolean(process.env.OPENAI_MODEL),
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "Le message est obligatoire." }, { status: 400 });
  }
  if (message.length > 6000) {
    return NextResponse.json({ error: "Le message dépasse la limite autorisée." }, { status: 413 });
  }

  const visual = deriveVisualProfile(message);

  if (hasUrgentSignal(message)) {
    return NextResponse.json({
      text: "Votre sécurité passe avant toute analyse. Éloignez-vous de tout moyen de vous faire du mal, contactez immédiatement une personne réelle de confiance et appelez les services d’urgence de votre pays si le danger est imminent.",
      source: "local-safety",
      safety: "urgent",
      visual: { ...visual, hue: 8, intensity: 0.98, regions: ["sécurité", "urgence", "relais humain"] },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      text: fallbackResponse(message),
      source: "local-fallback",
      safety: "standard",
      visual,
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        instructions: ATLAS_INSTRUCTIONS,
        input: message,
        max_output_tokens: 700,
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error("ATLAS OpenAI error", response.status, details.slice(0, 500));
      return NextResponse.json({
        text: fallbackResponse(message),
        source: "local-fallback",
        safety: "standard",
        visual,
      });
    }

    const payload = (await response.json()) as OpenAIResponse;
    const text = extractText(payload) || fallbackResponse(message);
    return NextResponse.json({ text, source: "openai", safety: "standard", visual });
  } catch (error) {
    console.error("ATLAS orchestration failure", error);
    return NextResponse.json({
      text: fallbackResponse(message),
      source: "local-fallback",
      safety: "standard",
      visual,
    });
  }
}
