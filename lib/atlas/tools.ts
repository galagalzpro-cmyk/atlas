import type { AtlasCapability, AtlasRole } from "./access";
import type { AtlasDataClass } from "./governance";

export type AtlasToolRisk = "read" | "write" | "sensitive";
export type AtlasApprovalPolicy = "automatic" | "confirm" | "strong_auth";
export type AtlasToolConnection = "internal" | "api" | "oauth" | "mcp";

export type AtlasToolDomain =
  | "ai"
  | "web"
  | "files"
  | "mail"
  | "calendar"
  | "contacts"
  | "drive"
  | "messaging"
  | "code"
  | "projects"
  | "deployment"
  | "payments"
  | "automation";

export interface AtlasToolDefinition {
  id: string;
  domain: AtlasToolDomain;
  description: string;
  connection: AtlasToolConnection;
  risk: AtlasToolRisk;
  approval: AtlasApprovalPolicy;
  requiredCapability: AtlasCapability;
  dataClasses: AtlasDataClass[];
  reversible: boolean;
}

const tool = (
  id: string,
  domain: AtlasToolDomain,
  description: string,
  connection: AtlasToolConnection,
  risk: AtlasToolRisk,
  approval: AtlasApprovalPolicy,
  reversible: boolean,
  dataClasses: AtlasDataClass[] = ["essential"],
): AtlasToolDefinition => ({
  id,
  domain,
  description,
  connection,
  risk,
  approval,
  requiredCapability: "use_connected_tools",
  dataClasses,
  reversible,
});

export const ATLAS_TOOL_REGISTRY: readonly AtlasToolDefinition[] = [
  tool("ai.generate", "ai", "Interroger le moteur IA sélectionné ou l'ensemble multi-modèles.", "api", "read", "automatic", true, ["sensitive"]),
  tool("web.search", "web", "Rechercher des informations publiques sur le web.", "api", "read", "automatic", true),

  tool("files.search", "files", "Rechercher dans les fichiers autorisés.", "mcp", "read", "automatic", true, ["sensitive"]),
  tool("files.read", "files", "Lire un fichier autorisé.", "mcp", "read", "automatic", true, ["sensitive"]),
  tool("files.create", "files", "Créer un nouveau fichier.", "mcp", "write", "confirm", true, ["sensitive"]),
  tool("files.update", "files", "Modifier un fichier existant.", "mcp", "write", "confirm", true, ["sensitive"]),
  tool("files.delete", "files", "Supprimer un fichier.", "mcp", "sensitive", "strong_auth", false, ["sensitive"]),

  tool("gmail.search", "mail", "Rechercher dans la messagerie connectée.", "oauth", "read", "automatic", true, ["sensitive"]),
  tool("gmail.read", "mail", "Lire les messages autorisés.", "oauth", "read", "automatic", true, ["sensitive"]),
  tool("gmail.draft", "mail", "Préparer un brouillon sans l'envoyer.", "oauth", "write", "confirm", true, ["sensitive"]),
  tool("gmail.send", "mail", "Envoyer un message.", "oauth", "sensitive", "confirm", false, ["sensitive"]),
  tool("gmail.archive", "mail", "Archiver un message.", "oauth", "write", "confirm", true, ["sensitive"]),
  tool("gmail.trash", "mail", "Placer un message dans la corbeille.", "oauth", "sensitive", "strong_auth", true, ["sensitive"]),

  tool("calendar.search", "calendar", "Consulter les événements et disponibilités.", "oauth", "read", "automatic", true, ["sensitive"]),
  tool("calendar.create", "calendar", "Créer un événement.", "oauth", "write", "confirm", true, ["sensitive"]),
  tool("calendar.update", "calendar", "Modifier un événement.", "oauth", "write", "confirm", true, ["sensitive"]),
  tool("calendar.delete", "calendar", "Supprimer un événement.", "oauth", "sensitive", "strong_auth", false, ["sensitive"]),

  tool("contacts.search", "contacts", "Rechercher un contact autorisé.", "oauth", "read", "automatic", true, ["sensitive"]),
  tool("contacts.read", "contacts", "Lire les coordonnées d'un contact autorisé.", "oauth", "read", "automatic", true, ["sensitive"]),

  tool("drive.search", "drive", "Rechercher dans Drive.", "oauth", "read", "automatic", true, ["sensitive"]),
  tool("drive.read", "drive", "Lire un document Drive autorisé.", "oauth", "read", "automatic", true, ["sensitive"]),
  tool("drive.create", "drive", "Créer un document ou fichier Drive.", "oauth", "write", "confirm", true, ["sensitive"]),
  tool("drive.update", "drive", "Modifier un document ou fichier Drive.", "oauth", "write", "confirm", true, ["sensitive"]),
  tool("drive.delete", "drive", "Supprimer un élément Drive.", "oauth", "sensitive", "strong_auth", false, ["sensitive"]),

  tool("slack.search", "messaging", "Rechercher des messages Slack autorisés.", "oauth", "read", "automatic", true, ["sensitive"]),
  tool("slack.read", "messaging", "Lire des conversations Slack autorisées.", "oauth", "read", "automatic", true, ["sensitive"]),
  tool("slack.send", "messaging", "Envoyer un message Slack.", "oauth", "sensitive", "confirm", false, ["sensitive"]),

  tool("github.search", "code", "Rechercher dans les dépôts autorisés.", "oauth", "read", "automatic", true, ["sensitive"]),
  tool("github.read", "code", "Lire code, issues, PR et métadonnées.", "oauth", "read", "automatic", true, ["sensitive"]),
  tool("github.issue.create", "code", "Créer une issue.", "oauth", "write", "confirm", true, ["sensitive"]),
  tool("github.pr.create", "code", "Créer une pull request.", "oauth", "write", "confirm", true, ["sensitive"]),
  tool("github.code.write", "code", "Modifier du code dans une branche autorisée.", "oauth", "sensitive", "confirm", true, ["sensitive"]),
  tool("github.merge", "code", "Fusionner une pull request.", "oauth", "sensitive", "strong_auth", false, ["sensitive"]),

  tool("linear.search", "projects", "Rechercher projets et issues Linear.", "oauth", "read", "automatic", true, ["sensitive"]),
  tool("linear.read", "projects", "Lire projets et issues Linear.", "oauth", "read", "automatic", true, ["sensitive"]),
  tool("linear.create", "projects", "Créer une issue ou un projet Linear.", "oauth", "write", "confirm", true, ["sensitive"]),
  tool("linear.update", "projects", "Mettre à jour Linear.", "oauth", "write", "confirm", true, ["sensitive"]),

  tool("vercel.read", "deployment", "Lire projets, déploiements et journaux Vercel.", "oauth", "read", "automatic", true, ["sensitive"]),
  tool("vercel.deploy.preview", "deployment", "Créer un déploiement de prévisualisation.", "oauth", "write", "confirm", true, ["sensitive"]),
  tool("vercel.deploy.production", "deployment", "Déployer en production.", "oauth", "sensitive", "strong_auth", false, ["sensitive"]),

  tool("payments.checkout", "payments", "Initier une opération de paiement explicitement demandée.", "api", "sensitive", "strong_auth", false, ["sensitive"]),
  tool("automation.create", "automation", "Créer une mission planifiée ou conditionnelle.", "internal", "write", "confirm", true, ["preferences"]),
] as const;

const TOOL_BY_ID = new Map(ATLAS_TOOL_REGISTRY.map((definition) => [definition.id, definition]));

export function getAtlasTool(toolId: string): AtlasToolDefinition | null {
  return TOOL_BY_ID.get(toolId) ?? null;
}

export interface AtlasToolAccessInput {
  role: AtlasRole;
  hasCapability: (role: AtlasRole, capability: AtlasCapability) => boolean;
  toolId: string;
  connectionAvailable: boolean;
  userConfirmed?: boolean;
  strongAuthSatisfied?: boolean;
}

export interface AtlasToolAccessDecision {
  allowed: boolean;
  requiresConfirmation: boolean;
  requiresStrongAuth: boolean;
  reason: "allowed" | "unknown_tool" | "missing_capability" | "connection_unavailable" | "confirmation_required" | "strong_auth_required";
}

export function evaluateToolAccess(input: AtlasToolAccessInput): AtlasToolAccessDecision {
  const definition = getAtlasTool(input.toolId);
  if (!definition) return { allowed: false, requiresConfirmation: false, requiresStrongAuth: false, reason: "unknown_tool" };
  if (!input.hasCapability(input.role, definition.requiredCapability)) {
    return { allowed: false, requiresConfirmation: false, requiresStrongAuth: false, reason: "missing_capability" };
  }
  if (!input.connectionAvailable) {
    return { allowed: false, requiresConfirmation: false, requiresStrongAuth: false, reason: "connection_unavailable" };
  }
  if (definition.approval === "strong_auth" && !input.strongAuthSatisfied) {
    return { allowed: false, requiresConfirmation: true, requiresStrongAuth: true, reason: "strong_auth_required" };
  }
  if (definition.approval === "confirm" && !input.userConfirmed) {
    return { allowed: false, requiresConfirmation: true, requiresStrongAuth: false, reason: "confirmation_required" };
  }
  return { allowed: true, requiresConfirmation: false, requiresStrongAuth: false, reason: "allowed" };
}
