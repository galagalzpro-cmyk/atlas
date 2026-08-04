"use client";

import { useState } from "react";
import type { AtlasPaymentProvider, AtlasPlan } from "../../lib/atlas/commerce";

export function CheckoutButtons({ plan }: { plan: AtlasPlan }) {
  const [pending, setPending] = useState<AtlasPaymentProvider | null>(null);
  const [error, setError] = useState("");

  async function start(provider: AtlasPaymentProvider) {
    setPending(provider);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, plan }),
      });
      const payload = await response.json() as { approvalUrl?: string };
      if (!response.ok || !payload.approvalUrl) throw new Error("checkout_unavailable");
      window.location.assign(payload.approvalUrl);
    } catch {
      setError("Le paiement test n’est pas disponible avec la configuration actuelle.");
      setPending(null);
    }
  }

  return (
    <div className="checkout-controls">
      <button className="primary" onClick={() => start("stripe")} disabled={pending !== null}>{pending === "stripe" ? "Ouverture…" : "Tester avec Stripe"}</button>
      <button onClick={() => start("paypal")} disabled={pending !== null}>{pending === "paypal" ? "Ouverture…" : "Tester avec PayPal"}</button>
      {error && <p className="notice" role="alert">{error}</p>}
    </div>
  );
}
