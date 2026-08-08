import type { AtlasPresencePreset, AtlasPresenceQuality, AtlasPresenceQualityProfile, AtlasPresenceState } from "./presence.types";

export const ATLAS_PRESENCE_PRESETS: Record<AtlasPresenceState, AtlasPresencePreset> = {
  idle: { density: 0.46, cohesion: 0.58, turbulence: 0.18, glow: 0.5, warmth: 0.46, attention: 0.42, temporalSpeed: 0.34 },
  listening: { density: 0.55, cohesion: 0.78, turbulence: 0.09, glow: 0.63, warmth: 0.43, attention: 0.9, temporalSpeed: 0.26 },
  thinking: { density: 0.61, cohesion: 0.67, turbulence: 0.47, glow: 0.72, warmth: 0.34, attention: 0.68, temporalSpeed: 0.72 },
  speaking: { density: 0.68, cohesion: 0.84, turbulence: 0.28, glow: 0.82, warmth: 0.5, attention: 0.94, temporalSpeed: 0.58 },
  calm: { density: 0.49, cohesion: 0.74, turbulence: 0.06, glow: 0.46, warmth: 0.62, attention: 0.72, temporalSpeed: 0.18 },
};

export const ATLAS_PRESENCE_QUALITY: Record<AtlasPresenceQuality, AtlasPresenceQualityProfile> = {
  ultra: { renderScale: 0.82, maxDpr: 1.65, raySteps: 72 },
  balanced: { renderScale: 0.7, maxDpr: 1.35, raySteps: 56 },
  light: { renderScale: 0.56, maxDpr: 1, raySteps: 40 },
};
