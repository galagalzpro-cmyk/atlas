import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/server/auth";
import { createSandboxCheckout } from "../../../lib/server/payments";
import { getDatabase } from "../../../lib/server/database";
import { writeAuditEvent } from "../../../lib/server/audit";
import type { AtlasPaymentProvider, AtlasPlan } from "../../../lib/atlas/commerce";

export const dynamic = "force-dynamic";

function isProvider(value: unknown): value is AtlasPaymentProvider {
  return value === "stripe" || value === "paypal";
}
function isPlan(value: unknown): value is AtlasPlan {
  return value === "individual" || value === "professional" || value === "organization";
}

export async function POST(request: Request) {
  const user = await requireUser();
  const body = await request.json().catch(() => null) as null | { provider?: unknown; plan?: unknown };
  if (!isProvider(body?.provider) || !isPlan(body?.plan)) {
    return NextResponse.json({ error: "invalid_checkout_request" }, { status: 400 });
  }
  if (body.plan === "organization" && user.role !== "organization_admin" && user.role !== "atlas_admin") {
    return NextResponse.json({ error: "organization_admin_required" }, { status: 403 });
  }
  const baseUrl = process.env.ATLAS_APP_URL;
  if (!baseUrl?.startsWith("https://")) {
    return NextResponse.json({ error: "application_url_not_configured" }, { status: 503 });
  }
  try {
    const checkout = await createSandboxCheckout({
      provider: body.provider,
      plan: body.plan,
      customerEmail: user.email,
      successUrl: `${baseUrl}/professionnels?checkout=success`,
      cancelUrl: `${baseUrl}/professionnels?checkout=cancelled`,
    });
    await getDatabase().query(
      `INSERT INTO atlas_subscriptions
        (user_id, provider, provider_checkout_id, plan_id, status)
       VALUES ($1, $2, $3, $4, 'incomplete')`,
      [user.id, body.provider, checkout.id, body.plan],
    );
    await writeAuditEvent({
      actorUserId: user.id,
      action: "checkout.created",
      targetType: "subscription_checkout",
      targetId: checkout.id,
      outcome: "success",
      metadata: { provider: body.provider, plan: body.plan },
    });
    return NextResponse.json(checkout, { headers: { "Cache-Control": "no-store" } });
  } catch {
    await writeAuditEvent({
      actorUserId: user.id,
      action: "checkout.create_failed",
      targetType: "subscription_checkout",
      outcome: "failure",
      metadata: { provider: body.provider, plan: body.plan },
    });
    return NextResponse.json({ error: "checkout_unavailable" }, { status: 503 });
  }
}
