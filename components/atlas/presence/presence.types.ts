export type AtlasPresenceState = "idle" | "listening" | "thinking" | "speaking" | "calm";
export type AtlasPresenceQuality = "ultra" | "balanced" | "light";

export interface AtlasPresencePreset {
  density: number;
  cohesion: number;
  turbulence: number;
  glow: number;
  warmth: number;
  attention: number;
  temporalSpeed: number;
}

export interface AtlasPresenceQualityProfile {
  renderScale: number;
  maxDpr: number;
  raySteps: number;
}
