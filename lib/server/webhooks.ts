import "server-only";
import { createHmac, timingSafeEqual, createHash } from "node:crypto";
import { getDatabase } from "./database";

export interface ProviderEvent {
  id: string;
  type: string;
  data?: unknown;
  resource?: unknown;
}

function safeEqualHex(left: string, right: string): boolean {
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string, toleranceSeconds = 300): boolean {
  const elements = Object.fromEntries(signatureHeader.split(",").map((part) => {
    const [key, value] = part.split("=", 2);
    return [key, value];
  }));
  const timestamp = Number(elements.t);
  const signature = elements.v1;
  if (!timestamp || !signature || Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  return safeEqualHex(expected, signature);
}

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("PayPal credentials missing");
  const base = process.env.ATLAS_PAYMENT_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const payload = await response.json() as { access_token?: string };
  if (!response.ok || !payload.access_token) throw new Error("PayPal authentication failed");
  return payload.access_token;
}

export async function verifyPayPalWebhook(rawBody: string, headers: Headers): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;
  const required = {
    transmission_id: headers.get("paypal-transmission-id"),
    transmission_time: headers.get("paypal-transmission-time"),
    cert_url: headers.get("paypal-cert-url"),
    auth_algo: headers.get("paypal-auth-algo"),
    transmission_sig: headers.get("paypal-transmission-sig"),
  };
  if (Object.values(required).some((value) => !value)) return false;
  const event = JSON.parse(rawBody) as unknown;
  const token = await getPayPalAccessToken();
  const base = process.env.ATLAS_PAYMENT_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
  const response = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ...required, webhook_id: webhookId, webhook_event: event }),
    cache: "no-store",
  });
  const payload = await response.json() as { verification_status?: string };
  return response.ok && payload.verification_status === "SUCCESS";
}

export async function registerWebhookEvent(provider: "stripe" | "paypal", event: ProviderEvent, rawBody: string): Promise<"new" | "duplicate"> {
  const payloadHash = createHash("sha256").update(rawBody).digest("hex");
  const result = await getDatabase().query(
    `INSERT INTO atlas_webhook_events (provider, provider_event_id, event_type, payload_hash)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (provider, provider_event_id) DO NOTHING`,
    [provider, event.id, event.type, payloadHash],
  );
  return result.rowCount === 1 ? "new" : "duplicate";
}

export async function markWebhookEvent(provider: "stripe" | "paypal", eventId: string, status: "processed" | "ignored" | "failed", errorCode?: string): Promise<void> {
  await getDatabase().query(
    `UPDATE atlas_webhook_events
     SET status = $3, processed_at = CASE WHEN $3 IN ('processed','ignored') THEN now() ELSE processed_at END,
         error_code = $4
     WHERE provider = $1 AND provider_event_id = $2`,
    [provider, eventId, status, errorCode ?? null],
  );
}

export async function synchronizeSubscription(provider: "stripe" | "paypal", event: ProviderEvent): Promise<void> {
  const object = provider === "stripe"
    ? (event.data as { object?: Record<string, unknown> } | undefined)?.object
    : event.resource as Record<string, unknown> | undefined;
  if (!object) return;
  const providerSubscriptionId = String(object.subscription || object.id || "");
  const providerCustomerId = String(object.customer || object.subscriber || "");
  const rawStatus = String(object.status || "").toLowerCase();
  const statusMap: Record<string, string> = {
    active: "active",
    trialing: "trialing",
    incomplete: "incomplete",
    past_due: "past_due",
    suspended: "past_due",
    cancelled: "canceled",
    canceled: "canceled",
    unpaid: "unpaid",
  };
  const status = statusMap[rawStatus];
  if (!providerSubscriptionId || !status) return;
  await getDatabase().query(
    `UPDATE atlas_subscriptions
     SET status = $3,
         provider_customer_id = COALESCE(NULLIF($4, ''), provider_customer_id),
         updated_at = now()
     WHERE provider = $1 AND provider_subscription_id = $2`,
    [provider, providerSubscriptionId, status, providerCustomerId],
  );
}
