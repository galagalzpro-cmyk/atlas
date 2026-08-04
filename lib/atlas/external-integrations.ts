import { canActivateExternalProvider, sanitizeAnalyticsMetadata, type AtlasConsentState } from "./governance";

export interface AtlasIntegrationStatus {
  provider: "google-analytics" | "google-ads" | "meta-pixel";
  configured: boolean;
  consented: boolean;
  active: boolean;
  identifierPresent: boolean;
}

export function getIntegrationStatuses(
  env: Record<string, string | undefined>,
  consent: AtlasConsentState,
): AtlasIntegrationStatus[] {
  const definitions = [
    { provider: "google-analytics" as const, id: env.NEXT_PUBLIC_GA_MEASUREMENT_ID, class: "analytics" as const },
    { provider: "google-ads" as const, id: env.NEXT_PUBLIC_GOOGLE_ADS_ID, class: "marketing" as const },
    { provider: "meta-pixel" as const, id: env.NEXT_PUBLIC_META_PIXEL_ID, class: "marketing" as const },
  ];

  return definitions.map((definition) => {
    const configured = Boolean(definition.id);
    const consented = canActivateExternalProvider(definition.class, consent);
    return {
      provider: definition.provider,
      configured,
      consented,
      active: configured && consented,
      identifierPresent: configured,
    };
  });
}

export function buildExternalEvent(
  name: string,
  metadata: Record<string, string | number | boolean>,
): { name: string; metadata: Record<string, string | number | boolean> } {
  return { name, metadata: sanitizeAnalyticsMetadata(metadata) };
}
