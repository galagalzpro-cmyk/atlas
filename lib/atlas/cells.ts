import type { AtlasAudience, AtlasPresenceState } from "./types";

export interface AtlasCellDefinition {
  id: string;
  title: string;
  audiences: AtlasAudience[];
  compatibleStates: AtlasPresenceState[];
  purpose: string;
  durationMinutes: number;
  accessibility: string[];
  safetyLevel: "standard" | "reinforced";
  storesSensitiveContent: false;
}

export const ATLAS_CELLS: AtlasCellDefinition[] = [
  {
    id: "clarity-now",
    title: "Clarifier maintenant",
    audiences: ["adolescent", "adult", "senior"],
    compatibleStates: ["ready", "listening", "thinking", "calm"],
    purpose: "Séparer les faits, les émotions, les besoins et la prochaine action.",
    durationMinutes: 4,
    accessibility: ["text", "voice", "large-type", "reduced-motion"],
    safetyLevel: "standard",
    storesSensitiveContent: false,
  },
  {
    id: "adult-load-map",
    title: "Cartographier la charge",
    audiences: ["adult"],
    compatibleStates: ["ready", "thinking", "calm"],
    purpose: "Classer ce qui doit être fait, dit, décidé, délégué ou abandonné.",
    durationMinutes: 7,
    accessibility: ["text", "voice", "keyboard"],
    safetyLevel: "standard",
    storesSensitiveContent: false,
  },
  {
    id: "teen-trusted-adult",
    title: "Choisir un adulte de confiance",
    audiences: ["adolescent"],
    compatibleStates: ["ready", "vigilance", "calm"],
    purpose: "Préparer une demande d’aide claire et identifier une personne sûre.",
    durationMinutes: 5,
    accessibility: ["discreet-mode", "text", "voice", "reduced-motion"],
    safetyLevel: "reinforced",
    storesSensitiveContent: false,
  },
  {
    id: "senior-voice-orientation",
    title: "Se repérer simplement",
    audiences: ["senior"],
    compatibleStates: ["ready", "listening", "calm"],
    purpose: "Donner une consigne à la fois, avec confirmation vocale et texte agrandi.",
    durationMinutes: 6,
    accessibility: ["voice-first", "large-type", "high-contrast", "slow-pace"],
    safetyLevel: "standard",
    storesSensitiveContent: false,
  },
];

export function selectCells(audience: AtlasAudience, state: AtlasPresenceState) {
  return ATLAS_CELLS.filter(
    (cell) => cell.audiences.includes(audience) && cell.compatibleStates.includes(state),
  );
}
