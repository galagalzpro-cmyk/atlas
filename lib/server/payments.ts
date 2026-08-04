import "server-only";
import type { AtlasPlan, AtlasPaymentProvider } from "../atlas/commerce";

export interface SandboxCheckoutRequest {
  provider: AtlasPaymentProvider;
  plan: AtlasPlan;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface SandboxCheckoutResult {
  provider: AtlasPaymentProvider;
  id: string;
  approvalUrl: string;
}

const PLAN_ENV_KEYS: Record<AtlasPlan, string> = {
  individual: "ATLAS_STRIPE_PRICE_INDIVIDUAL",
  professional: "ATLAS_STRIPE_PRICE_PROFESSIONAL",
  organization: "ATLAS_STRIPE_PRICE_ORGANIZATION",
};

function requireSandboxMode(): void {
  if (process.env.ATLAS_PAYMENT_ENV !== "sandbox") {
    throw new Error("Payment adapters are locked outside ATLAS_PAYMENT_ENV=sandbox");
  }
}

export async function createStripeSandboxCheckout(
  request: SandboxCheckoutRequest,
): Promise<SandboxCheckoutResult> {
  requireSandboxMode();
  const secret = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env[PLAN_ENV_KEYS[request.plan]];
  if (!secret?.startsWith("sk_test_") || !priceId) {
    throw new Error("Stripe sandbox credentials or test price are missing");
  }

  const body = new URLSearchParams();
  body.set("mode", "subscription");
  body.set("success_url", request.successUrl);
  body.set("cancel_url", request.cancelUrl);
  body.set("customer_email", request.customerEmail);
  body.set("line_items[0][price]", priceId);
  body.set("line_items[0][quantity]", "1");
  body.set("metadata[atlas_plan]", request.plan);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  const payload = (await response.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!response.ok || !payload.id || !payload.url) {
    throw new Error(payload.error?.message || "Stripe sandbox checkout creation failed");
  }
  return { provider: "stripe", id: payload.id, approvalUrl: payload.url };
}

async function getPayPalSandboxAccessToken(): Promise<string> {
  requireSandboxMode();
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("PayPal sandbox credentials are missing");

  const response = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const payload = (await response.json()) as { access_token?: string; error_description?: string };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || "PayPal sandbox authentication failed");
  }
  return payload.access_token;
}

export async function createPayPalSandboxOrder(
  request: SandboxCheckoutRequest,
): Promise<SandboxCheckoutResult> {
  requireSandboxMode();
  const amount = process.env[`ATLAS_PAYPAL_AMOUNT_${request.plan.toUpperCase()}`];
  if (!amount) throw new Error("PayPal sandbox amount is missing for this plan");
  const accessToken = await getPayPalSandboxAccessToken();

  const response = await fetch("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": crypto.randomUUID(),
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        custom_id: request.plan,
        amount: { currency_code: "EUR", value: amount },
      }],
      payment_source: {
        paypal: {
          experience_context: {
            return_url: request.successUrl,
            cancel_url: request.cancelUrl,
            user_action: "PAY_NOW",
          },
        },
      },
    }),
    cache: "no-store",
  });
  const payload = (await response.json()) as {
    id?: string;
    links?: Array<{ rel: string; href: string }>;
    message?: string;
  };
  const approvalUrl = payload.links?.find((link) => link.rel === "payer-action" || link.rel === "approve")?.href;
  if (!response.ok || !payload.id || !approvalUrl) {
    throw new Error(payload.message || "PayPal sandbox order creation failed");
  }
  return { provider: "paypal", id: payload.id, approvalUrl };
}

export async function createSandboxCheckout(
  request: SandboxCheckoutRequest,
): Promise<SandboxCheckoutResult> {
  return request.provider === "stripe"
    ? createStripeSandboxCheckout(request)
    : createPayPalSandboxOrder(request);
}
