import type { AtlasAudience, AtlasRuntimeState } from "./types";

const STORAGE_KEY = "atlas.preferences.v1";

export interface AtlasStoredPreferences {
  audience: AtlasAudience;
  calmMode: boolean;
  memoryConsent: boolean;
}

export function readPreferences(): AtlasStoredPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<AtlasStoredPreferences>;
    if (!value.audience || !["adolescent", "adult", "senior"].includes(value.audience)) {
      return null;
    }
    return {
      audience: value.audience,
      calmMode: Boolean(value.calmMode),
      memoryConsent: Boolean(value.memoryConsent),
    };
  } catch {
    return null;
  }
}

export function writePreferences(state: AtlasRuntimeState): void {
  if (typeof window === "undefined") return;
  const preferences: AtlasStoredPreferences = {
    audience: state.audience,
    calmMode: state.calmMode,
    memoryConsent: state.memoryConsent,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

export function clearPreferences(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
