import type { AtlasCellDefinition } from "../../lib/atlas/cells";

export function CellRegistryView({ cells }: { cells: AtlasCellDefinition[] }) {
  return <div className="cards">{cells.map((cell) => (
    <article key={cell.id}>
      <span>{cell.durationMinutes} MIN</span><h3>{cell.title}</h3><p>{cell.purpose}</p>
      <small>{cell.safetyLevel === "reinforced" ? "Protection renforcée" : "Protection standard"}</small>
    </article>
  ))}</div>;
}
