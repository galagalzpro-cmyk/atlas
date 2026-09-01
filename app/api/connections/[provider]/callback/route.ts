import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasCapability } from "../../../../../lib/atlas/access";
import { isAtlasConnectionProvider, type AtlasConnectionProvider } from "../../../../../lib/atlas/connected-tools";
import { writeAuditEvent } from "../../../../../lib/server/audit";
import { getCurrentUser } from "../../../../../lib/server/auth";
import { completeOAuthConnection, recordOAuthDenial } from "../../../../../lib/server/connections";
import { getAtlasApplicationOrigin, getOAuthBindingCookieName } from "../../../../../lib/server/oauth-security";

export const dynamic = "force-dynamic";

function accountRedirect(provider: AtlasConnectionProvider, status: string): NextResponse {
  const target = new URL("/compte", getAtlasApplicationOrigin());
  target.searchParams.set("connection", status);
  target.searchParams.set("provider", provider);
  const response = NextResponse.redirect(target, 303);
  response.cookies.set(getOAuthBindingCookieName(provider), "", {
    httpOnly: true,
    secure: getAtlasApplicationOrigin().protocol === "https:",
    sameSite: "lax",
    path: `/api/connections/${provider}/callback`,
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerValue } = await params;
  if (!isAtlasConnectionProvider(providerValue)) {
    return NextResponse.json({ error: "unknown_connection_provider" }, { status: 404 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/connexion", getAtlasApplicationOrigin()), 303);
  if (!hasCapability(user.role, "use_connected_tools")) return accountRedirect(providerValue, "forbidden");

  const searchParams = new URL(request.url).searchParams;
  const state = searchParams.get("state") || "";
  const code = searchParams.get("code") || "";
  const providerError = searchParams.get("error");
  const browserBinding = (await cookies()).get(getOAuthBindingCookieName(providerValue))?.value || "";
  if (!state || !browserBinding) return accountRedirect(providerValue, "invalid");

  try {
    if (providerError || !code) {
      await recordOAuthDenial(user.id, providerValue, state, browserBinding);
      return accountRedirect(providerValue, providerError ? "denied" : "invalid");
    }
    await completeOAuthConnection(user.id, providerValue, { state, browserBinding, code });
    return accountRedirect(providerValue, "connected");
  } catch {
    await writeAuditEvent({
      actorUserId: user.id,
      action: "connection.oauth_failed",
      targetType: "tool_connection",
      targetId: providerValue,
      outcome: "failure",
      metadata: { provider: providerValue },
    }).catch(() => undefined);
    return accountRedirect(providerValue, "failed");
  }
}
