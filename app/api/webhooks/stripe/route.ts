import { NextResponse } from "next/server";
import { databaseConfigured } from "../../../../lib/server/database";
import { markWebhookEvent, registerWebhookEvent, synchronizeSubscription, verifyStripeSignature, type ProviderEvent } from "../../../../lib/server/webhooks";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!databaseConfigured()) return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();
  if (!secret || !signature || !verifyStripeSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }
  const event = JSON.parse(rawBody) as ProviderEvent;
  if (!event.id || !event.type) return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  const state = await registerWebhookEvent("stripe", event, rawBody);
  if (state === "duplicate") return NextResponse.json({ received: true, duplicate: true });
  try {
    await synchronizeSubscription("stripe", event);
    await markWebhookEvent("stripe", event.id, "processed");
    return NextResponse.json({ received: true });
  } catch {
    await markWebhookEvent("stripe", event.id, "failed", "processing_failure");
    return NextResponse.json({ error: "processing_failure" }, { status: 500 });
  }
}
