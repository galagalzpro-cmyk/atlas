import type { AtlasPresencePreset, AtlasPresenceQuality, AtlasPresenceQualityProfile, AtlasPresenceState } from "./presence.types";

export const ATLAS_PRESENCE_PRESETS: Record<AtlasPresenceState, AtlasPresencePreset> = {
  idle: { density: 0.52, cohesion: 0.72, turbulence: 0.12, glow: 0.58, warmth: 0.42, attention: 0.5, temporalSpeed: 0.3 },
  listening: { density: 0.59, cohesion: 0.88, turbulence: 0.06, glow: 0.68, warmth: 0.4, attention: 0.96, temporalSpeed: 0.23 },
  thinking: { density: 0.64, cohesion: 0.77, turbulence: 0.34, glow: 0.76, warmth: 0.3, attention: 0.76, temporalSpeed: 0.64 },
  speaking: { density: 0.7, cohesion: 0.9, turbulence: 0.2, glow: 0.86, warmth: 0.46, attention: 0.98, temporalSpeed: 0.52 },
  calm: { density: 0.53, cohesion: 0.82, turbulence: 0.035, glow: 0.5, warmth: 0.58, attention: 0.78, temporalSpeed: 0.15 },
};

export const ATLAS_PRESENCE_QUALITY: Record<AtlasPresenceQuality, AtlasPresenceQualityProfile> = {
  ultra: { renderScale: 0.9, maxDpr: 1.7, raySteps: 96 },
  balanced: { renderScale: 0.76, maxDpr: 1.4, raySteps: 76 },
  light: { renderScale: 0.6, maxDpr: 1, raySteps: 48 },
};
