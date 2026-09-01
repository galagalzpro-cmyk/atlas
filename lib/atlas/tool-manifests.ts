import { ATLAS_TOOL_REGISTRY, type AtlasToolDefinition } from "./tools";

export interface AtlasToolManifest {
  provider: string;
  version: string;
  tools: AtlasToolDefinition[];
}

export interface AtlasResolvedToolRegistry {
  tools: AtlasToolDefinition[];
  providers: string[];
}

function assertManifest(manifest: AtlasToolManifest): void {
  if (!manifest.provider.trim()) throw new Error("Tool manifest provider is required");
  if (!manifest.version.trim()) throw new Error(`Tool manifest ${manifest.provider} requires a version`);
  for (const tool of manifest.tools) {
    if (!tool.id.trim() || !tool.id.includes(".")) throw new Error(`Invalid tool id in ${manifest.provider}`);
  }
}

export function resolveAtlasToolRegistry(manifests: AtlasToolManifest[] = []): AtlasResolvedToolRegistry {
  const tools = [...ATLAS_TOOL_REGISTRY];
  const ids = new Set(tools.map((tool) => tool.id));
  const providers = ["atlas-core"];

  for (const manifest of manifests) {
    assertManifest(manifest);
    providers.push(`${manifest.provider}@${manifest.version}`);
    for (const tool of manifest.tools) {
      if (ids.has(tool.id)) throw new Error(`Duplicate ATLAS tool id: ${tool.id}`);
      ids.add(tool.id);
      tools.push(tool);
    }
  }

  return { tools, providers };
}
