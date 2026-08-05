import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { assessSafety } from "../../../lib/atlas/safety";
import { buildReply, type AtlasConversationTurn } from "../../../lib/atlas/conversation";
import type { AtlasAudience } from "../../../lib/atlas/types";
import { decideAtlasAutonomy } from "../../../lib/atlas/autonomy";
import {
  adaptAtlasLocalReply,
  inferAtlasEmotionalState,
  refineAtlasAutonomy,
  validateAtlasEmotionalFit,
} from "../../../lib/atlas/emotional-intelligence";
import { validateAtlasPresenceReply } from "../../../lib/atlas/presence";
import { generateAtlasReply } from "../../../lib/server/ai";
import { consumeRateLimit } from "../../../lib/server/rate-limit";
import { databaseConfigured, getDatabase } from "../../../lib/server/database";
import { getCurrentUser } from "../../../lib/server/auth";

export const dynamic = "force-dynamic";

type ConversationSource = "local" | "external" | "local_guardrail" | "local_fallback";

function isAudience(value: unknown): value is AtlasAudience {
  return value === "adolescent" || value === "adult" || value === "senior";
}

function parseHistory(value: unknown): AtlasConversationTurn[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-24).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const role = (item as { role?: unknown }).role;
    const text = (item as { text?: unknown }).text;
    if ((role !== "user" && role !== "assistant") || typeof text !== "string") return [];
    const normalized = text.trim().slice(0, 2000);
    return normalized ? [{ role, text: normalized }] : [];
  });
}

function responseBody(input: {
  reply: { text: string; nextStep: string; labels: string[] };
  safetyLevel: string;
  source: ConversationSource;
  traceId: string;
  labMode: boolean;
  diagnostics?: {
    autonomy: ReturnType<typeof decideAtlasAutonomy>;
    emotional: ReturnType<typeof inferAtlasEmotionalState>;
    guardrails?: { presence: string[]; emotional: string[] };
  };
}) {
  return {
    reply: input.reply,
    safetyLevel: input.safetyLevel,
    traceId: input.traceId,
    ...(input.labMode
      ? {
          lab: {
            source: input.source,
            autonomy: input.diagnostics?.autonomy,
            emotional: input.diagnostics?.emotional,
            guardrails: input.diagnostics?.guardrails,
          },
        }
      : {}),
  };
}

export async function POST(request: Request) {
  const traceId = randomUUID();
  const body = await request.json().catch(() => null) as null | {
    text?: unknown;
    audience?: unknown;
    externalAiConsent?: unknown;
    history?: unknown;
    labMode?: unknown;
  };
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, 6000) : "";
  const audience = isAudience(body?.audience) ? body.audience : "adult";
  const externalAiConsent = body?.externalAiConsent === true;
  const labMode = process.env.NODE_ENV !== "production" && body?.labMode === true;
  const history = parseHistory(body?.history);
  if (!text) return NextResponse.json({ error: "Message requis.", traceId }, { status: 400 });

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const identifier = forwarded || request.headers.get("x-real-ip") || "unknown";
  const limit = await consumeRateLimit("conversation", identifier, 30, 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessayez dans quelques instants.", traceId },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const safety = assessSafety(text, audience);
  const emotional = inferAtlasEmotionalState({ text, audience, history });
  const baseAutonomy = decideAtlasAutonomy({ text, audience, safety, history });
  const autonomy = refineAtlasAutonomy(baseAutonomy, emotional);
  const rawLocalReply = buildReply(text, audience, safety, history);
  const localReply = adaptAtlasLocalReply(rawLocalReply, emotional, audience);

  if (
    safety.level === "urgent" ||
    safety.shouldPauseGeneration ||
    !autonomy.shouldUseExternalIntelligence ||
    !externalAiConsent ||
    !process.env.OPENAI_API_KEY
  ) {
    return NextResponse.json(
      responseBody({
        reply: localReply,
        safetyLevel: safety.level,
        source: "local",
        traceId,
        labMode,
        diagnostics: { autonomy, emotional },
      }),
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const generated = await generateAtlasReply({
      text,
      audience,
      safety,
      history,
      autonomy,
      emotional,
      signal: controller.signal,
    });
    const presence = validateAtlasPresenceReply({
      reply: generated.text,
      latestUserText: text,
      history,
    });
    const emotionalFit = validateAtlasEmotionalFit({ reply: generated.text, emotional });
    const generatedAccepted = presence.valid && emotionalFit.valid;
    const accepted = generatedAccepted ? generated : localReply;
    const source: ConversationSource = generatedAccepted ? "external" : "local_guardrail";
    const user = await getCurrentUser();

    if (databaseConfigured()) {
      await getDatabase().query(
        `INSERT INTO atlas_ai_runs
          (user_id, audience, local_safety_level, provider, model, status, provider_request_id,
           input_characters, output_characters, latency_ms)
         VALUES ($1, $2, $3, $4, $5, 'completed', $6, $7, $8, $9)`,
        [
          user?.id ?? null,
          audience,
          safety.level,
          generated.provider,
          generated.model,
          generated.requestId,
          text.length,
          accepted.text.length + accepted.nextStep.length,
          generated.latencyMs,
        ],
      );
    }

    return NextResponse.json(
      responseBody({
        reply: accepted,
        safetyLevel: safety.level,
        source,
        traceId,
        labMode,
        diagnostics: {
          autonomy,
          emotional,
          guardrails: { presence: presence.reasons, emotional: emotionalFit.reasons },
        },
      }),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      responseBody({
        reply: localReply,
        safetyLevel: safety.level,
        source: "local_fallback",
        traceId,
        labMode,
        diagnostics: { autonomy, emotional },
      }),
      { headers: { "Cache-Control": "no-store" } },
    );
  } finally {
    clearTimeout(timeout);
  }
}
