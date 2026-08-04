import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const requiredFiles = [
  "app/page.tsx",
  "app/api/conversation/route.ts",
  "app/api/readiness/route.ts",
  "lib/atlas/types.ts",
  "lib/atlas/reducer.ts",
  "lib/atlas/persistence.ts",
  "lib/atlas/cells.ts",
  "lib/server/auth.ts",
  "lib/server/organizations.ts",
  "lib/server/webhooks.ts",
  "database/001_foundation.sql",
  "database/002_operations.sql",
  "docs/ATLAS_CELL_CONTRACT.md",
  "docs/ATLAS_PRODUCTION_BLUEPRINT.md",
];

for (const file of requiredFiles) await readFile(file, "utf8");

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(path));
    else if (/\.(tsx?|css)$/.test(entry.name)) files.push(path);
  }
  return files;
}

const visualFiles = [...await collectFiles("app"), ...await collectFiles("components")];
const forbiddenVisualAssets = /<img\b|from\s+["']next\/image["']|url\(\s*["']?https?:|\.(png|jpe?g|webp|gif|mp4)(["'`)\s]|$)/i;
for (const file of visualFiles) {
  const content = await readFile(file, "utf8");
  if (forbiddenVisualAssets.test(content)) {
    throw new Error(`Forbidden preinstalled visual asset detected: ${file}`);
  }
}

const cells = await readFile("lib/atlas/cells.ts", "utf8");
for (const audience of ["adolescent", "adult", "senior"]) {
  if (!cells.includes(`\"${audience}\"`)) throw new Error(`Missing governed cell coverage for audience: ${audience}`);
}

const schema = `${await readFile("database/001_foundation.sql", "utf8")}\n${await readFile("database/002_operations.sql", "utf8")}`;
for (const forbiddenColumn of ["conversation_text", "message_text", "transcript_text", "prompt_text", "response_text"]) {
  if (schema.includes(forbiddenColumn)) throw new Error(`Forbidden emotional-content persistence column: ${forbiddenColumn}`);
}

console.log(`ATLAS architecture validation passed across ${visualFiles.length} visual source files.`);
