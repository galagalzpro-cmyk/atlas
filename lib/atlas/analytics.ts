import type { AtlasAudience } from "./types";

const ANALYTICS_KEY = "atlas.analytics.v1";

export type AtlasAnalyticsEventName =
  | "journey_started"
  | "journey_step_completed"
  | "journey_completed"
  | "conversation_submitted"
  | "voice_started"
  | "safety_attention"
  | "safety_urgent";

export interface AtlasAnalyticsEvent {
  name: AtlasAnalyticsEventName;
  audience: AtlasAudience;
  timestamp: number;
  metadata?: Record<string, string | number | boolean>;
}

export function trackAtlasEvent(event: AtlasAnalyticsEvent, consent: boolean): void {
  if (!consent || typeof window === "undefined") return;
  const existing = readAtlasEvents();
  const sanitized: AtlasAnalyticsEvent = {
    name: event.name,
    audience: event.audience,
    timestamp: event.timestamp,
    metadata: event.metadata,
  };
  window.localStorage.setItem(ANALYTICS_KEY, JSON.stringify([...existing, sanitized].slice(-100)));
}

export function readAtlasEvents(): AtlasAnalyticsEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ANALYTICS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearAtlasEvents(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(ANALYTICS_KEY);
}
