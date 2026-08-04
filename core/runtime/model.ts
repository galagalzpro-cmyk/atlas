export type AtlasMode = "presence" | "clarity" | "expansion" | "resolve";

export type AtlasSignalType =
  | "pointer"
  | "scroll"
  | "click"
  | "idle"
  | "intent"
  | "scenario"
  | "autonomous";

export interface AtlasSignal {
  type: AtlasSignalType;
  intensity: number;
  x?: number;
  y?: number;
  direction?: number;
  payload?: string;
  timestamp: number;
}

export interface AtlasRuntimeState {
  mode: AtlasMode;
  hue: number;
  accentHue: number;
  saturation: number;
  lightness: number;
  energy: number;
  focus: number;
  depth: number;
  turbulence: number;
  warmth: number;
  pace: number;
  pointerX: number;
  pointerY: number;
  scroll: number;
  eventCount: number;
  lastSignal: AtlasSignalType;
  scenarioLabel: string;
}

export interface AtlasScenario {
  id: AtlasMode;
  label: string;
  description: string;
  target: Pick<
    AtlasRuntimeState,
    | "hue"
    | "accentHue"
    | "saturation"
    | "lightness"
    | "energy"
    | "focus"
    | "depth"
    | "turbulence"
    | "warmth"
    | "pace"
  >;
}

export const SCENARIOS: Record<AtlasMode, AtlasScenario> = {
  presence: {
    id: "presence",
    label: "Présence",
    description: "Ralentit le système, augmente la profondeur et stabilise les contrastes.",
    target: {
      hue: 31,
      accentHue: 43,
      saturation: 58,
      lightness: 68,
      energy: 0.38,
      focus: 0.62,
      depth: 0.76,
      turbulence: 0.18,
      warmth: 0.78,
      pace: 0.42,
    },
  },
  clarity: {
    id: "clarity",
    label: "Clarté",
    description: "Resserre la composition, renforce les lignes et réduit le bruit visuel.",
    target: {
      hue: 205,
      accentHue: 184,
      saturation: 62,
      lightness: 72,
      energy: 0.54,
      focus: 0.92,
      depth: 0.58,
      turbulence: 0.08,
      warmth: 0.28,
      pace: 0.58,
    },
  },
  expansion: {
    id: "expansion",
    label: "Expansion",
    description: "Ouvre le champ, augmente l’amplitude et accélère les flux génératifs.",
    target: {
      hue: 274,
      accentHue: 323,
      saturation: 76,
      lightness: 70,
      energy: 0.86,
      focus: 0.52,
      depth: 0.9,
      turbulence: 0.66,
      warmth: 0.46,
      pace: 0.84,
    },
  },
  resolve: {
    id: "resolve",
    label: "Résolution",
    description: "Concentre l’énergie, augmente la stabilité et met l’action au premier plan.",
    target: {
      hue: 8,
      accentHue: 38,
      saturation: 82,
      lightness: 66,
      energy: 0.74,
      focus: 0.84,
      depth: 0.52,
      turbulence: 0.28,
      warmth: 0.88,
      pace: 0.7,
    },
  },
};

export const INITIAL_STATE: AtlasRuntimeState = {
  mode: "presence",
  ...SCENARIOS.presence.target,
  pointerX: 0.5,
  pointerY: 0.5,
  scroll: 0,
  eventCount: 0,
  lastSignal: "autonomous",
  scenarioLabel: SCENARIOS.presence.label,
};

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(current: number, target: number, amount: number): number {
  return current + (target - current) * amount;
}

export function deriveModeFromIntent(intent: string): AtlasMode {
  const normalized = intent.toLowerCase();
  if (/comprendre|clair|choisir|décider|organiser|priorité/.test(normalized)) return "clarity";
  if (/créer|imaginer|explorer|grandir|développer|possible/.test(normalized)) return "expansion";
  if (/agir|avancer|résoudre|terminer|objectif|résultat/.test(normalized)) return "resolve";
  return "presence";
}

export function applySignal(
  current: AtlasRuntimeState,
  signal: AtlasSignal,
  explicitMode?: AtlasMode,
): AtlasRuntimeState {
  const mode = explicitMode ?? current.mode;
  const scenario = SCENARIOS[mode];
  const intensity = clamp(signal.intensity);
  const next = { ...current, mode, scenarioLabel: scenario.label };

  for (const [key, target] of Object.entries(scenario.target) as Array<
    [keyof AtlasScenario["target"], number]
  >) {
    next[key] = lerp(current[key], target, 0.18 + intensity * 0.18) as never;
  }

  next.eventCount = current.eventCount + 1;
  next.lastSignal = signal.type;

  if (typeof signal.x === "number") next.pointerX = clamp(signal.x);
  if (typeof signal.y === "number") next.pointerY = clamp(signal.y);

  switch (signal.type) {
    case "pointer":
      next.energy = clamp(next.energy + intensity * 0.035);
      next.turbulence = clamp(next.turbulence + intensity * 0.028);
      next.depth = clamp(next.depth + Math.abs(next.pointerX - 0.5) * 0.025);
      break;
    case "scroll":
      next.scroll = clamp(signal.direction ?? current.scroll);
      next.pace = clamp(next.pace + intensity * 0.06);
      next.hue = (next.hue + intensity * 8) % 360;
      break;
    case "click":
      next.energy = clamp(next.energy + 0.14 * intensity);
      next.focus = clamp(next.focus + 0.08 * intensity);
      break;
    case "idle":
      next.energy = lerp(next.energy, scenario.target.energy, 0.08);
      next.turbulence = lerp(next.turbulence, scenario.target.turbulence, 0.12);
      break;
    case "intent":
      next.focus = clamp(next.focus + 0.12);
      next.depth = clamp(next.depth + 0.08);
      break;
    case "scenario":
      next.energy = scenario.target.energy;
      next.focus = scenario.target.focus;
      next.depth = scenario.target.depth;
      next.turbulence = scenario.target.turbulence;
      next.pace = scenario.target.pace;
      break;
    case "autonomous":
      next.hue = (next.hue + 0.45) % 360;
      next.energy = clamp(next.energy + Math.sin(signal.timestamp / 1800) * 0.006);
      break;
  }

  return next;
}
