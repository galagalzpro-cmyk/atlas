import { NextResponse } from "next/server";
import { databaseConfigured } from "../../../../lib/server/database";
import { markWebhookEvent, registerWebhookEvent, synchronizeSubscription, verifyPayPalWebhook, type ProviderEvent } from "../../../../lib/server/webhooks";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!databaseConfigured()) return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  const rawBody = await request.text();
  if (!(await verifyPayPalWebhook(rawBody, request.headers))) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }
  const event = JSON.parse(rawBody) as ProviderEvent;
  if (!event.id || !event.type) return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  const state = await registerWebhookEvent("paypal", event, rawBody);
  if (state === "duplicate") return NextResponse.json({ received: true, duplicate: true });
  try {
    await synchronizeSubscription("paypal", event);
    await markWebhookEvent("paypal", event.id, "processed");
    return NextResponse.json({ received: true });
  } catch {
    await markWebhookEvent("paypal", event.id, "failed", "processing_failure");
    return NextResponse.json({ error: "processing_failure" }, { status: 500 });
  }
}
