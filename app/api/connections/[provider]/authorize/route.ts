import { NextResponse } from "next/server";
import { hasCapability } from "../../../../../lib/atlas/access";
import { isAtlasConnectionProvider } from "../../../../../lib/atlas/connected-tools";
import { getCurrentUser } from "../../../../../lib/server/auth";
import { createOAuthTransaction } from "../../../../../lib/server/connections";
import {
  getAtlasApplicationOrigin,
  getOAuthBindingCookieName,
  OAUTH_TRANSACTION_TTL_SECONDS,
  requestHasTrustedOrigin,
} from "../../../../../lib/server/oauth-security";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerValue } = await params;
  if (!isAtlasConnectionProvider(providerValue)) {
    return NextResponse.json({ error: "unknown_connection_provider" }, { status: 404 });
  }
  if (!requestHasTrustedOrigin(request)) {
    return NextResponse.json({ error: "invalid_request_origin" }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/connexion", getAtlasApplicationOrigin()), 303);
  }
  if (!hasCapability(user.role, "use_connected_tools")) {
    return NextResponse.json({ error: "connected_tools_forbidden" }, { status: 403 });
  }

  try {
    const transaction = await createOAuthTransaction(user.id, providerValue);
    const response = NextResponse.redirect(transaction.authorizationUrl, 303);
    response.cookies.set(getOAuthBindingCookieName(providerValue), transaction.browserBinding, {
      httpOnly: true,
      secure: getAtlasApplicationOrigin().protocol === "https:",
      sameSite: "lax",
      path: `/api/connections/${providerValue}/callback`,
      maxAge: OAUTH_TRANSACTION_TTL_SECONDS,
      priority: "high",
    });
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch {
    return NextResponse.json({ error: "connection_provider_unavailable" }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
