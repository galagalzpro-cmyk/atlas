import { NextResponse } from "next/server";
import { getCommerceReadiness } from "../../../lib/atlas/commerce";

export const dynamic = "force-dynamic";

export function GET() {
  const commerce = getCommerceReadiness(process.env);

  return NextResponse.json({
    service: "atlas",
    status: "preview",
    timestamp: new Date().toISOString(),
    capabilities: {
      application: true,
      professionalWorkspace: true,
      administrationPreview: true,
      productionCheckout: commerce.productionCheckoutEnabled,
    },
  }, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
