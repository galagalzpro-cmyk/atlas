import { readFile } from "node:fs/promises";

const requiredFiles = [
  "app/page.tsx",
  "lib/atlas/types.ts",
  "lib/atlas/reducer.ts",
  "lib/atlas/persistence.ts",
  "lib/atlas/cells.ts",
  "docs/ATLAS_CELL_CONTRACT.md",
  "docs/ATLAS_PRODUCTION_BLUEPRINT.md",
];

for (const file of requiredFiles) {
  await readFile(file, "utf8");
}

const page = await readFile("app/page.tsx", "utf8");
const forbiddenVisualAssets = /<img|next\/image|url\(['"]?https?:|\.png|\.jpe?g|\.webp|\.gif|\.mp4/i;
if (forbiddenVisualAssets.test(page)) {
  throw new Error("Forbidden preinstalled visual asset detected in ATLAS application shell.");
}

const cells = await readFile("lib/atlas/cells.ts", "utf8");
for (const audience of ["adolescent", "adult", "senior"]) {
  if (!cells.includes(`\"${audience}\"`)) {
    throw new Error(`Missing governed cell coverage for audience: ${audience}`);
  }
}

console.log("ATLAS architecture validation passed.");
