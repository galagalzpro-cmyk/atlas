import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { AtlasConnectionProvider } from "../atlas/connected-tools";

export const OAUTH_TRANSACTION_TTL_SECONDS = 10 * 60;

export interface OAuthProof {
  state: string;
  stateHash: string;
  browserBinding: string;
  browserBindingHash: string;
  codeVerifier: string;
  codeChallenge: string;
}

function sha256Base64Url(value: string): string {
  return createHash("sha256").update(value, "ascii").digest("base64url");
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function createOAuthProof(): OAuthProof {
  const state = randomBytes(32).toString("base64url");
  const browserBinding = randomBytes(32).toString("base64url");
  const codeVerifier = randomBytes(64).toString("base64url");
  return {
    state,
    stateHash: sha256Hex(state),
    browserBinding,
    browserBindingHash: sha256Hex(browserBinding),
    codeVerifier,
    codeChallenge: sha256Base64Url(codeVerifier),
  };
}

export function secureStringEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function getOAuthBindingCookieName(provider: AtlasConnectionProvider): string {
  return `atlas_oauth_${provider}`;
}

export function getAtlasApplicationOrigin(): URL {
  const configured = process.env.ATLAS_APP_URL?.trim();
  if (!configured) throw new Error("ATLAS application URL is not configured");
  const parsed = new URL(configured);
  const localDevelopment = process.env.NODE_ENV !== "production"
    && parsed.protocol === "http:"
    && (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");
  if (parsed.protocol !== "https:" && !localDevelopment) {
    throw new Error("ATLAS application URL must use HTTPS");
  }
  return new URL(parsed.origin);
}

export function requestHasTrustedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === getAtlasApplicationOrigin().origin;
  } catch {
    return false;
  }
}
