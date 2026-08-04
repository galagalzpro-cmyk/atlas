import {
  INITIAL_ATLAS_STATE,
  type AtlasEvent,
  type AtlasRuntimeState,
} from "./types.ts";

export function atlasReducer(
  state: AtlasRuntimeState,
  event: AtlasEvent,
): AtlasRuntimeState {
  switch (event.type) {
    case "AWAKENING_PROGRESS":
      return { ...state, presence: "awakening", awakeningProgress: Math.max(0, Math.min(100, event.progress)) };
    case "AWAKENING_COMPLETE":
      return { ...state, presence: "ready", awakeningProgress: 100 };
    case "USER_STARTED_INPUT":
      return { ...state, presence: "listening" };
    case "USER_SUBMITTED_INPUT":
      return { ...state, presence: "listening", lastInput: event.text, interactionCount: state.interactionCount + 1 };
    case "INTERPRETATION_STARTED":
      return { ...state, presence: "thinking" };
    case "RESPONSE_STARTED":
      return { ...state, presence: "speaking" };
    case "RESPONSE_COMPLETED":
      return { ...state, presence: state.calmMode ? "calm" : "ready" };
    case "SAFETY_ALERT":
      return { ...state, presence: "vigilance" };
    case "CALM_MODE_SET":
      return { ...state, calmMode: event.enabled, presence: event.enabled ? "calm" : "ready" };
    case "AUDIENCE_SET":
      return { ...state, audience: event.audience };
    case "MEMORY_CONSENT_SET":
      return { ...state, memoryConsent: event.enabled };
    case "RESET_SESSION":
      return { ...INITIAL_ATLAS_STATE, audience: state.audience, calmMode: state.calmMode, presence: state.calmMode ? "calm" : "ready" };
    default:
      return state;
  }
}
