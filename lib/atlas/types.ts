export type AtlasPresenceState =
  | "awakening"
  | "ready"
  | "listening"
  | "thinking"
  | "speaking"
  | "calm"
  | "vigilance";

export type AtlasAudience = "adolescent" | "adult" | "senior";

export type AtlasEvent =
  | { type: "AWAKENING_PROGRESS"; progress: number }
  | { type: "AWAKENING_COMPLETE" }
  | { type: "USER_STARTED_INPUT" }
  | { type: "USER_SUBMITTED_INPUT"; text: string }
  | { type: "INTERPRETATION_STARTED" }
  | { type: "RESPONSE_STARTED" }
  | { type: "RESPONSE_COMPLETED" }
  | { type: "SAFETY_ALERT" }
  | { type: "CALM_MODE_SET"; enabled: boolean }
  | { type: "AUDIENCE_SET"; audience: AtlasAudience }
  | { type: "MEMORY_CONSENT_SET"; enabled: boolean }
  | { type: "RESET_SESSION" };

export interface AtlasRuntimeState {
  presence: AtlasPresenceState;
  awakeningProgress: number;
  audience: AtlasAudience;
  calmMode: boolean;
  memoryConsent: boolean;
  lastInput: string;
  interactionCount: number;
}

export const INITIAL_ATLAS_STATE: AtlasRuntimeState = {
  presence: "awakening",
  awakeningProgress: 8,
  audience: "adult",
  calmMode: false,
  memoryConsent: false,
  lastInput: "",
  interactionCount: 0,
};
