export type AtlasRole = "visitor" | "member" | "professional" | "organization_admin" | "atlas_admin";

export type AtlasCapability =
  | "use_public_session"
  | "manage_own_preferences"
  | "view_professional_workspace"
  | "manage_organization_members"
  | "view_aggregated_metrics"
  | "manage_billing"
  | "review_safety_events"
  | "manage_platform_configuration";

const ROLE_CAPABILITIES: Record<AtlasRole, AtlasCapability[]> = {
  visitor: ["use_public_session"],
  member: ["use_public_session", "manage_own_preferences"],
  professional: ["use_public_session", "manage_own_preferences", "view_professional_workspace", "view_aggregated_metrics"],
  organization_admin: [
    "use_public_session",
    "manage_own_preferences",
    "view_professional_workspace",
    "manage_organization_members",
    "view_aggregated_metrics",
    "manage_billing",
  ],
  atlas_admin: [
    "use_public_session",
    "manage_own_preferences",
    "view_professional_workspace",
    "manage_organization_members",
    "view_aggregated_metrics",
    "manage_billing",
    "review_safety_events",
    "manage_platform_configuration",
  ],
};

export function hasCapability(role: AtlasRole, capability: AtlasCapability): boolean {
  return ROLE_CAPABILITIES[role].includes(capability);
}

export interface AtlasSessionIdentity {
  subject: string;
  role: AtlasRole;
  organizationId?: string;
  issuedAt: string;
  expiresAt: string;
}

export function assertSessionIdentity(value: Partial<AtlasSessionIdentity>): AtlasSessionIdentity {
  if (!value.subject || !value.role || !value.issuedAt || !value.expiresAt) {
    throw new Error("Invalid ATLAS session identity");
  }
  if (!(value.role in ROLE_CAPABILITIES)) throw new Error("Unknown ATLAS role");
  return value as AtlasSessionIdentity;
}
