import type { AtlasAudience } from "./types";

export interface AtlasSpeechRecognitionAlternative {
  transcript: string;
}

export interface AtlasSpeechRecognitionEvent {
  results: ArrayLike<ArrayLike<AtlasSpeechRecognitionAlternative>>;
}

export interface AtlasSpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous?: boolean;
  onresult: ((event: AtlasSpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop?: () => void;
  abort?: () => void;
}

export type AtlasSpeechRecognitionConstructor = new () => AtlasSpeechRecognition;

type VoiceWindow = Window & {
  SpeechRecognition?: AtlasSpeechRecognitionConstructor;
  webkitSpeechRecognition?: AtlasSpeechRecognitionConstructor;
};

export function getSpeechRecognitionConstructor(): AtlasSpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const voiceWindow = window as VoiceWindow;
  return voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition ?? null;
}

export function extractTranscript(event: AtlasSpeechRecognitionEvent): string {
  return event.results[0]?.[0]?.transcript?.trim() ?? "";
}

export function speakAtlasText(text: string, audience: AtlasAudience): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = audience === "senior" ? 0.78 : audience === "adolescent" ? 0.98 : 0.9;
  utterance.pitch = 0.96;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopAtlasSpeech(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
