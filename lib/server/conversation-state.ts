import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { AtlasConversationTurn } from "../atlas/conversation";
import type { AtlasAudience } from "../atlas/types";

const STATE_VERSION = 1;
const MAX_TURNS = 20;
const MAX_TURN_CHARACTERS = 1800;
const MAX_AGE_MS = 1000 * 60 * 60 * 24;

interface AtlasSignedConversationPayload {
  version: typeof STATE_VERSION;
  audience: AtlasAudience;
  turns: AtlasConversationTurn[];
  issuedAt: number;
  updatedAt: number;
}

export interface AtlasConversationStateResult {
  valid: boolean;
  reason:
    | "valid"
    | "missing"
    | "not_configured"
    | "malformed"
    | "invalid_signature"
    | "expired"
    | "audience_mismatch"
    | "invalid_payload";
  history: AtlasConversationTurn[];
}

function secret(): string | null {
  const value = process.env.ATLAS_CONVERSATION_STATE_SECRET?.trim();
  return value && value.length >= 32 ? value : null;
}

export function conversationStateConfigured(): boolean {
  return secret() !== null;
}

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signature(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function sanitizeTurns(value: unknown): AtlasConversationTurn[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-MAX_TURNS).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const role = (item as { role?: unknown }).role;
    const text = (item as { text?: unknown }).text;
    if ((role !== "user" && role !== "assistant") || typeof text !== "string") return [];
    const clean = text.trim().slice(0, MAX_TURN_CHARACTERS);
    return clean ? [{ role, text: clean }] : [];
  });
}

function isAudience(value: unknown): value is AtlasAudience {
  return value === "adolescent" || value === "adult" || value === "senior";
}

export function verifyConversationState(
  token: unknown,
  expectedAudience: AtlasAudience,
): AtlasConversationStateResult {
  if (typeof token !== "string" || !token.trim()) {
    return { valid: false, reason: "missing", history: [] };
  }

  const key = secret();
  if (!key) return { valid: false, reason: "not_configured", history: [] };

  const [encodedPayload, suppliedSignature, extra] = token.split(".");
  if (!encodedPayload || !suppliedSignature || extra) {
    return { valid: false, reason: "malformed", history: [] };
  }

  const expectedSignature = signature(encodedPayload, key);
  if (!safeEqual(suppliedSignature, expectedSignature)) {
    return { valid: false, reason: "invalid_signature", history: [] };
  }

  try {
    const parsed = JSON.parse(decode(encodedPayload)) as Partial<AtlasSignedConversationPayload>;
    if (
      parsed.version !== STATE_VERSION ||
      !isAudience(parsed.audience) ||
      typeof parsed.issuedAt !== "number" ||
      typeof parsed.updatedAt !== "number"
    ) {
      return { valid: false, reason: "invalid_payload", history: [] };
    }
    if (parsed.audience !== expectedAudience) {
      return { valid: false, reason: "audience_mismatch", history: [] };
    }
    if (Date.now() - parsed.updatedAt > MAX_AGE_MS || parsed.updatedAt < parsed.issuedAt) {
      return { valid: false, reason: "expired", history: [] };
    }

    return {
      valid: true,
      reason: "valid",
      history: sanitizeTurns(parsed.turns),
    };
  } catch {
    return { valid: false, reason: "invalid_payload", history: [] };
  }
}

export function signConversationState(input: {
  audience: AtlasAudience;
  history: AtlasConversationTurn[];
  previousToken?: unknown;
}): string | null {
  const key = secret();
  if (!key) return null;

  const previous = verifyConversationState(input.previousToken, input.audience);
  const now = Date.now();
  const payload: AtlasSignedConversationPayload = {
    version: STATE_VERSION,
    audience: input.audience,
    turns: sanitizeTurns(input.history),
    issuedAt: previous.valid
      ? (() => {
          try {
            const encoded = String(input.previousToken).split(".")[0];
            const parsed = JSON.parse(decode(encoded)) as AtlasSignedConversationPayload;
            return parsed.issuedAt;
          } catch {
            return now;
          }
        })()
      : now,
    updatedAt: now,
  };

  const encodedPayload = encode(JSON.stringify(payload));
  return `${encodedPayload}.${signature(encodedPayload, key)}`;
}
