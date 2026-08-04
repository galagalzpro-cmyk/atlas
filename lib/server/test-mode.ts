import "server-only";
import { createHash } from "node:crypto";
import type { AtlasRole } from "../atlas/access";
import { databaseConfigured } from "./database";

export const TEST_SESSION_COOKIE = "atlas_test_session";
export const TEST_PASSWORDS_COOKIE = "atlas_test_passwords";
export const TEST_ORGANIZATIONS_COOKIE = "atlas_test_organizations";
export const DEFAULT_TEST_PASSWORD = "atlas-test-2026";

export interface AtlasTestUser {
  id: string;
  email: string;
  displayName: string;
  role: AtlasRole;
}

const TEST_USERS: AtlasTestUser[] = [
  { id: "test-member", email: "membre@atlas.test", displayName: "Membre test", role: "member" },
  { id: "test-professional", email: "professionnel@atlas.test", displayName: "Professionnel test", role: "professional" },
  { id: "test-organization-admin", email: "organisation@atlas.test", displayName: "Responsable test", role: "organization_admin" },
  { id: "test-atlas-admin", email: "admin@atlas.test", displayName: "Administration ATLAS", role: "atlas_admin" },
];

export function isAtlasTestMode(): boolean {
  return process.env.ATLAS_TEST_MODE === "true" || !databaseConfigured();
}

export function listAtlasTestUsers(): AtlasTestUser[] {
  return TEST_USERS.map((user) => ({ ...user }));
}

export function getAtlasTestUserById(id: string): AtlasTestUser | null {
  return TEST_USERS.find((user) => user.id === id) ?? null;
}

export function getAtlasTestUserByEmail(email: string): AtlasTestUser | null {
  const normalized = email.trim().toLowerCase();
  return TEST_USERS.find((user) => user.email === normalized) ?? null;
}

export function hashTestPassword(password: string): string {
  return createHash("sha256").update(`atlas-test:${password}`).digest("hex");
}

export function parseTestPasswordMap(value: string | undefined): Record<string, string> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([email, hash]) => email.includes("@") && typeof hash === "string"),
    );
  } catch {
    return {};
  }
}

export function serializeTestPasswordMap(value: Record<string, string>): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

export function encodeTestPasswordReset(email: string): string {
  return `atlas-test-reset.${Buffer.from(email.trim().toLowerCase(), "utf8").toString("base64url")}`;
}

export function decodeTestPasswordReset(token: string): string | null {
  if (!token.startsWith("atlas-test-reset.")) return null;
  try {
    const email = Buffer.from(token.slice("atlas-test-reset.".length), "base64url").toString("utf8");
    return getAtlasTestUserByEmail(email)?.email ?? null;
  } catch {
    return null;
  }
}

export function encodeTestInvitation(input: {
  email: string;
  role: "professional" | "organization_admin";
}): string {
  const payload = Buffer.from(JSON.stringify({
    email: input.email.trim().toLowerCase(),
    role: input.role,
  }), "utf8").toString("base64url");
  return `atlas-test-invite.${payload}`;
}

export function decodeTestInvitation(token: string): {
  email: string;
  role: "professional" | "organization_admin";
} | null {
  if (!token.startsWith("atlas-test-invite.")) return null;
  try {
    const parsed = JSON.parse(Buffer.from(token.slice("atlas-test-invite.".length), "base64url").toString("utf8")) as {
      email?: unknown;
      role?: unknown;
    };
    if (typeof parsed.email !== "string") return null;
    if (parsed.role !== "professional" && parsed.role !== "organization_admin") return null;
    return { email: parsed.email.trim().toLowerCase(), role: parsed.role };
  } catch {
    return null;
  }
}
