import { NextResponse } from "next/server";
import { hasCapability } from "../../../../../lib/atlas/access";
import { isAtlasConnectionProvider } from "../../../../../lib/atlas/connected-tools";
import { getCurrentUser, hasRecentStrongAuth } from "../../../../../lib/server/auth";
import { disconnectOAuthConnection } from "../../../../../lib/server/connections";
import { getAtlasApplicationOrigin, requestHasTrustedOrigin } from "../../../../../lib/server/oauth-security";

export const dynamic = "force-dynamic";

function accountRedirect(provider: string, status: string): NextResponse {
  const target = new URL("/compte", getAtlasApplicationOrigin());
  target.searchParams.set("connection", status);
  target.searchParams.set("provider", provider);
  const response = NextResponse.redirect(target, 303);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

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
  if (!user) return NextResponse.redirect(new URL("/connexion", getAtlasApplicationOrigin()), 303);
  if (!hasCapability(user.role, "use_connected_tools")) {
    return NextResponse.json({ error: "connected_tools_forbidden" }, { status: 403 });
  }
  const formData = await request.formData().catch(() => null);
  if (formData?.get("confirmation") !== `disconnect:${providerValue}`) {
    return NextResponse.json({ error: "explicit_confirmation_required" }, { status: 400 });
  }
  if (!(await hasRecentStrongAuth(user.id))) return accountRedirect(providerValue, "strong-auth-required");

  try {
    const result = await disconnectOAuthConnection(user.id, providerValue);
    return accountRedirect(providerValue, result);
  } catch {
    return accountRedirect(providerValue, "revocation-failed");
  }
}
