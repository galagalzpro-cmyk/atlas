import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { databaseConfigured, getDatabase, queryOne } from "./database";
import { createSessionToken, hashOptionalFingerprint, hashToken, verifyPassword } from "./security";
import type { AtlasRole } from "../atlas/access";

const COOKIE_NAME = "atlas_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14;

export interface AtlasSessionUser {
  id: string;
  email: string;
  displayName: string;
  role: AtlasRole;
}

interface UserRow {
  id: string;
  email: string;
  display_name: string;
  platform_role: AtlasRole;
  password_hash: string;
}

export async function authenticateWithPassword(email: string, password: string): Promise<AtlasSessionUser | null> {
  if (!databaseConfigured()) return null;
  const normalizedEmail = email.trim().toLowerCase();
  const user = await queryOne<UserRow>(
    `SELECT id, email, display_name, platform_role, password_hash
     FROM atlas_users
     WHERE email = $1 AND disabled_at IS NULL`,
    [normalizedEmail],
  );
  if (!user || !(await verifyPassword(password, user.password_hash))) return null;
  return { id: user.id, email: user.email, displayName: user.display_name, role: user.platform_role };
}

export async function createSession(userId: string): Promise<void> {
  const token = createSessionToken();
  const tokenHash = hashToken(token);
  const requestHeaders = await headers();
  const userAgentHash = hashOptionalFingerprint(requestHeaders.get("user-agent"));
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await getDatabase().query(
    `INSERT INTO atlas_sessions (user_id, token_hash, expires_at, user_agent_hash)
     VALUES ($1, $2, $3, $4)`,
    [userId, tokenHash, expiresAt, userAgentHash],
  );
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token && databaseConfigured()) {
    await getDatabase().query(
      `UPDATE atlas_sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`,
      [hashToken(token)],
    );
  }
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<AtlasSessionUser | null> {
  if (!databaseConfigured()) return null;
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  return queryOne<AtlasSessionUser>(
    `SELECT u.id, u.email, u.display_name AS "displayName", u.platform_role AS role
     FROM atlas_sessions s
     JOIN atlas_users u ON u.id = s.user_id
     WHERE s.token_hash = $1
       AND s.revoked_at IS NULL
       AND s.expires_at > now()
       AND u.disabled_at IS NULL`,
    [hashToken(token)],
  );
}

export async function requireUser(): Promise<AtlasSessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  return user;
}

export async function requireRole(roles: AtlasRole[]): Promise<AtlasSessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}
