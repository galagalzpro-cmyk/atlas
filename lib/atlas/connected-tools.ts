import { getAtlasTool } from "./tools.ts";

export const ATLAS_CONNECTION_PROVIDERS = ["google", "slack", "github", "linear"] as const;

export type AtlasConnectionProvider = (typeof ATLAS_CONNECTION_PROVIDERS)[number];
export type AtlasConnectionStatus = "pending" | "active" | "expired" | "revoked" | "error";

export interface AtlasConnectedToolState {
  provider: AtlasConnectionProvider;
  status: AtlasConnectionStatus;
  capabilities: string[];
}

export interface AtlasConnectionProviderDefinition {
  provider: AtlasConnectionProvider;
  label: string;
  description: string;
}

export const ATLAS_CONNECTION_PROVIDER_DEFINITIONS: readonly AtlasConnectionProviderDefinition[] = [
  { provider: "google", label: "Google Workspace", description: "Gmail, Calendar et Drive avec autorisations progressives." },
  { provider: "slack", label: "Slack", description: "Recherche, lecture et messagerie dans les espaces autorisés." },
  { provider: "github", label: "GitHub App", description: "Dépôts accessibles à l’application et à votre compte GitHub." },
  { provider: "linear", label: "Linear", description: "Projets et tickets accessibles à votre compte Linear." },
] as const;

type CapabilityRequirements = Record<string, readonly string[]>;

const GOOGLE_CAPABILITIES: CapabilityRequirements = {
  "gmail.search": ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.modify"],
  "gmail.read": ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.modify"],
  "gmail.draft": ["https://www.googleapis.com/auth/gmail.compose", "https://www.googleapis.com/auth/gmail.modify"],
  "gmail.send": ["https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/gmail.compose", "https://www.googleapis.com/auth/gmail.modify"],
  "gmail.archive": ["https://www.googleapis.com/auth/gmail.modify"],
  "gmail.trash": ["https://www.googleapis.com/auth/gmail.modify"],
  "calendar.search": [
    "https://www.googleapis.com/auth/calendar.events.readonly",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
  ],
  "calendar.create": ["https://www.googleapis.com/auth/calendar.events"],
  "calendar.update": ["https://www.googleapis.com/auth/calendar.events"],
  "calendar.delete": ["https://www.googleapis.com/auth/calendar.events"],
  "drive.search": [
    "https://www.googleapis.com/auth/drive.metadata.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/drive.file",
  ],
  "drive.read": ["https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/drive.file"],
  "drive.create": ["https://www.googleapis.com/auth/drive.file"],
  "drive.update": ["https://www.googleapis.com/auth/drive.file"],
  "drive.delete": ["https://www.googleapis.com/auth/drive.file"],
};

const SLACK_CAPABILITIES: CapabilityRequirements = {
  "slack.search": ["search:read"],
  "slack.read": ["channels:history", "groups:history", "im:history", "mpim:history"],
  "slack.send": ["chat:write"],
};

const GITHUB_CAPABILITIES: CapabilityRequirements = {
  "github.search": ["metadata:read", "contents:read", "contents:write"],
  "github.read": ["contents:read", "contents:write"],
  "github.issue.create": ["issues:write"],
  "github.pr.create": ["pull_requests:write"],
  "github.code.write": ["contents:write"],
  "github.merge": ["pull_requests:write"],
};

const LINEAR_CAPABILITIES: CapabilityRequirements = {
  "linear.search": ["read", "write"],
  "linear.read": ["read", "write"],
  "linear.create": ["issues:create", "write"],
  "linear.update": ["write"],
};

const REQUIREMENTS_BY_PROVIDER: Record<AtlasConnectionProvider, CapabilityRequirements> = {
  google: GOOGLE_CAPABILITIES,
  slack: SLACK_CAPABILITIES,
  github: GITHUB_CAPABILITIES,
  linear: LINEAR_CAPABILITIES,
};

export function isAtlasConnectionProvider(value: string): value is AtlasConnectionProvider {
  return (ATLAS_CONNECTION_PROVIDERS as readonly string[]).includes(value);
}

export function resolveConnectionCapabilities(
  provider: AtlasConnectionProvider,
  grantedPermissions: readonly string[],
): string[] {
  const grants = new Set(grantedPermissions);
  return Object.entries(REQUIREMENTS_BY_PROVIDER[provider])
    .filter(([toolId, alternatives]) => Boolean(getAtlasTool(toolId)) && alternatives.some((grant) => grants.has(grant)))
    .map(([toolId]) => toolId);
}

export function isConnectedToolAvailable(
  toolId: string,
  connections: readonly AtlasConnectedToolState[],
): boolean {
  return connections.some((connection) => connection.status === "active" && connection.capabilities.includes(toolId));
}
