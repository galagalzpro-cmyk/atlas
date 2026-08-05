import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { AtlasAudience } from "../../../lib/atlas/types";
import type { AtlasConversationTurn } from "../../../lib/atlas/conversation";
import { planAtlasTurn, describeAtlasTurnPlan } from "../../../lib/atlas/orchestrator";
import { critiqueAtlasResponse } from "../../../lib/atlas/response-critic";
import { buildAtlasSafetyReply } from "../../../lib/atlas/safety-response";
import { validateAtlasPresenceReply } from "../../../lib/atlas/presence";
import { validateAtlasEmotionalFit } from "../../../lib/atlas/emotional-intelligence";
import { generateAtlasReply, reviseAtlasReply } from "../../../lib/server/ai";
import { consumeRateLimit } from "../../../lib/server/rate-limit";
import { databaseConfigured, getDatabase } from "../../../lib/server/database";
import { getCurrentUser } from "../../../lib/server/auth";
import {
  conversationStateConfigured,
  signConversationState,
  verifyConversationState,
} from "../../../lib/server/conversation-state";

export const dynamic = "force-dynamic";

type ConversationSource =
  | "local_safety"
  | "local_policy"
  | "external"
  | "external_revised"
  | "local_guardrail"
  | "local_fallback";

function isAudience(value: unknown): value is AtlasAudience {
  return value === "adolescent" || value === "adult" || value === "senior";
}

function publicResponse(input: {
  reply: string;
  safetyLevel: string;
  source: ConversationSource;
  traceId: string;
  conversationState: string | null;
  labMode: boolean;
  diagnostics?: Record<string, unknown>;
}) {
  return {
    reply: input.reply,
    safetyLevel: input.safetyLevel,
    traceId: input.traceId,
    conversationState: input.conversationState,
    ...(input.labMode
      ? { lab: { source: input.source, ...input.diagnostics } }
      : {}),
  };
}

function localFallbackText(plan: ReturnType<typeof planAtlasTurn>): string {
  return [plan.localFallback.text, plan.localFallback.nextStep]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" ")
    .slice(0, plan.policy.maxResponseCharacters);
}

function appendConversation(
  history: AtlasConversationTurn[],
  userText: string,
  assistantText: string,
): AtlasConversationTurn[] {
  return [
    ...history,
    { role: "user" as const, text: userText },
    { role: "assistant" as const, text: assistantText },
  ].slice(-20);
}

async function recordAiRun(input: {
  userId: string | null;
  audience: AtlasAudience;
  safetyLevel: string;
  provider: string;
  model: string;
  requestId: string | null;
  inputCharacters: number;
  outputCharacters: number;
  latencyMs: number;
}) {
  if (!databaseConfigured()) return;
  try {
    await getDatabase().query(
      `INSERT INTO atlas_ai_runs
        (user_id, audience, local_safety_level, provider, model, status, provider_request_id,
         input_characters, output_characters, latency_ms)
       VALUES ($1, $2, $3, $4, $5, 'completed', $6, $7, $8, $9)`,
      [
        input.userId,
        input.audience,
        input.safetyLevel,
        input.provider,
        input.model,
        input.requestId,
        input.inputCharacters,
        input.outputCharacters,
        input.latencyMs,
      ],
    );
  } catch {
    // Telemetry must never break the conversation.
  }
}

export async function POST(request: Request) {
  const traceId = randomUUID();
  const body = await request.json().catch(() => null) as null | {
    text?: unknown;
    audience?: unknown;
    externalAiConsent?: unknown;
    memoryConsent?: unknown;
    conversationState?: unknown;
    labMode?: unknown;
  };

  const text = typeof body?.text === "string" ? body.text.trim().slice(0, 6000) : "";
  const audience = isAudience(body?.audience) ? body.audience : "adult";
  if (!text) return NextResponse.json({ error: "Message requis.", traceId }, { status: 400 });

  const user = await getCurrentUser();
  const labMode = body?.labMode === true && user?.role === "atlas_admin" && process.env.ATLAS_LAB_ENABLED === "true";
  const stateResult = verifyConversationState(body?.conversationState, audience);
  if (
    !stateResult.valid &&
    stateResult.reason !== "missing" &&
    stateResult.reason !== "not_configured"
  ) {
    return NextResponse.json(
      { error: "L’état de cette conversation n’est plus valide. Ouvrez une nouvelle conversation.", traceId },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const history = stateResult.valid ? stateResult.history : [];

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const identifier = user?.id || forwarded || request.headers.get("x-real-ip") || "unknown";
  const limit = await consumeRateLimit("conversation", identifier, 30, 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessayez dans quelques instants.", traceId },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const plan = planAtlasTurn({
    text,
    audience,
    history,
    externalAiConsent: body?.externalAiConsent === true,
    memoryConsent: body?.memoryConsent === true,
    externalProviderConfigured: Boolean(process.env.OPENAI_API_KEY),
  });

  const respond = (reply: string, source: ConversationSource, diagnostics?: Record<string, unknown>) => {
    const conversationState = signConversationState({
      audience,
      previousToken: body?.conversationState,
      history: appendConversation(history, text, reply),
    });
    return NextResponse.json(
      publicResponse({
        reply,
        safetyLevel: plan.safety.level,
        source,
        traceId,
        conversationState,
        labMode,
        diagnostics,
      }),
      { headers: { "Cache-Control": "no-store" } },
    );
  };

  if (plan.safety.level !== "standard" || plan.safety.shouldPauseGeneration) {
    const safetyReply = buildAtlasSafetyReply({ text, audience, safety: plan.safety });
    return respond(safetyReply.text, "local_safety", {
      plan: describeAtlasTurnPlan(plan),
      stateAuthority: stateResult.reason,
    });
  }

  if (!plan.policy.externalGenerationAllowed || !plan.autonomy.shouldUseExternalIntelligence) {
    return respond(localFallbackText(plan), "local_policy", {
      plan: describeAtlasTurnPlan(plan),
      stateAuthority: stateResult.reason,
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18_000);
  try {
    const generated = await generateAtlasReply({ plan, history, text, signal: controller.signal });
    const initialCritique = critiqueAtlasResponse({
      reply: generated.text,
      cognitive: plan.cognitive,
      policy: plan.policy,
      history,
    });
    const initialPresence = validateAtlasPresenceReply({
      reply: generated.text,
      latestUserText: text,
      history,
    });
    const initialEmotional = validateAtlasEmotionalFit({
      reply: generated.text,
      emotional: plan.emotional,
    });

    const initialReasons = [
      ...initialCritique.reasons,
      ...initialPresence.reasons,
      ...initialEmotional.reasons,
    ];
    const initialAccepted =
      initialCritique.verdict === "accept" &&
      initialPresence.valid &&
      initialEmotional.valid;

    if (initialAccepted) {
      await recordAiRun({
        userId: user?.id ?? null,
        audience,
        safetyLevel: plan.safety.level,
        provider: generated.provider,
        model: generated.model,
        requestId: generated.requestId,
        inputCharacters: text.length,
        outputCharacters: generated.text.length,
        latencyMs: generated.latencyMs,
      });
      return respond(generated.text, "external", {
        plan: describeAtlasTurnPlan(plan),
        critique: initialCritique,
        stateAuthority: stateResult.reason,
      });
    }

    if (initialCritique.verdict !== "fallback" && plan.policy.maxRevisions > 0) {
      const revisionInstructions = [
        ...initialCritique.revisionInstructions,
        ...initialPresence.reasons.map((reason) => `Corriger la règle de présence : ${reason}.`),
        ...initialEmotional.reasons.map((reason) => `Corriger l’adéquation émotionnelle : ${reason}.`),
      ];
      const revised = await reviseAtlasReply({
        plan,
        history,
        text,
        previousReply: generated.text,
        revisionInstructions,
        signal: controller.signal,
      });
      const revisedCritique = critiqueAtlasResponse({
        reply: revised.text,
        cognitive: plan.cognitive,
        policy: plan.policy,
        history,
      });
      const revisedPresence = validateAtlasPresenceReply({
        reply: revised.text,
        latestUserText: text,
        history,
      });
      const revisedEmotional = validateAtlasEmotionalFit({
        reply: revised.text,
        emotional: plan.emotional,
      });

      if (revisedCritique.verdict === "accept" && revisedPresence.valid && revisedEmotional.valid) {
        await recordAiRun({
          userId: user?.id ?? null,
          audience,
          safetyLevel: plan.safety.level,
          provider: revised.provider,
          model: revised.model,
          requestId: revised.requestId,
          inputCharacters: text.length,
          outputCharacters: revised.text.length,
          latencyMs: generated.latencyMs + revised.latencyMs,
        });
        return respond(revised.text, "external_revised", {
          plan: describeAtlasTurnPlan(plan),
          initialReasons,
          critique: revisedCritique,
          stateAuthority: stateResult.reason,
        });
      }
    }

    return respond(localFallbackText(plan), "local_guardrail", {
      plan: describeAtlasTurnPlan(plan),
      initialReasons,
      stateAuthority: stateResult.reason,
    });
  } catch {
    return respond(localFallbackText(plan), "local_fallback", {
      plan: describeAtlasTurnPlan(plan),
      stateAuthority: stateResult.reason,
    });
  } finally {
    clearTimeout(timeout);
  }
}
