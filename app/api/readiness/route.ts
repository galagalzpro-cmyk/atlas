import { NextResponse } from "next/server";
import { getCommerceReadiness } from "../../../lib/atlas/commerce";
import { databaseConfigured, getDatabase } from "../../../lib/server/database";
import { isAtlasTestMode } from "../../../lib/server/test-mode";

export const dynamic = "force-dynamic";

export async function GET() {
  const commerce = getCommerceReadiness(process.env);
  const testMode = isAtlasTestMode();
  let database = false;
  if (databaseConfigured()) {
    try {
      await getDatabase().query("SELECT 1");
      database = true;
    } catch {
      database = false;
    }
  }

  const capabilities = {
    application: true,
    testMode,
    localConversation: true,
    testAuthentication: testMode,
    testProfessionalWorkspace: testMode,
    testAdministration: testMode,
    database,
    authentication: database,
    professionalWorkspace: database,
    administration: database,
    localSafety: true,
    externalAi: Boolean(process.env.OPENAI_API_KEY),
    transactionalEmail: Boolean(process.env.RESEND_API_KEY && process.env.ATLAS_EMAIL_FROM),
    stripeSandbox: Boolean(process.env.ATLAS_PAYMENT_ENV === "sandbox" && process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")),
    paypalSandbox: Boolean(process.env.ATLAS_PAYMENT_ENV === "sandbox" && process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
    verifiedWebhooks: Boolean(process.env.STRIPE_WEBHOOK_SECRET || process.env.PAYPAL_WEBHOOK_ID),
    scheduledMaintenance: Boolean(process.env.CRON_SECRET),
    productionCheckout: commerce.productionCheckoutEnabled,
  };

  const readyForFunctionalTesting = capabilities.localConversation
    && (capabilities.authentication || capabilities.testAuthentication)
    && (capabilities.professionalWorkspace || capabilities.testProfessionalWorkspace)
    && (capabilities.administration || capabilities.testAdministration);

  const readyForPreproduction = capabilities.database
    && capabilities.authentication
    && capabilities.scheduledMaintenance;

  return NextResponse.json({
    service: "atlas",
    status: readyForPreproduction
      ? "preproduction-ready"
      : readyForFunctionalTesting
        ? "functional-test-ready"
        : "configuration-required",
    readyForFunctionalTesting,
    readyForPreproduction,
    timestamp: new Date().toISOString(),
    capabilities,
    missingCommerceRequirements: commerce.missingRequirements,
  }, {
    status: readyForFunctionalTesting ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
