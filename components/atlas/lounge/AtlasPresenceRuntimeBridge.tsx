"use client";

import { useEffect, useRef } from "react";
import { useAtlasPresenceRuntime } from "./useAtlasPresenceRuntime";

export default function AtlasPresenceRuntimeBridge() {
  const stageRef = useRef<HTMLElement | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  const speechFrameRef = useRef(0);
  const { quality, notePointerActivity, startMicrophoneMeter, stopMicrophoneMeter } = useAtlasPresenceRuntime(stageRef);

  useEffect(() => {
    const stage = document.querySelector<HTMLElement>(".atlas-sanctuary");
    const root = document.querySelector<HTMLElement>(".atlas-lounge-v6");
    if (!stage || !root) return;
    stageRef.current = stage;
    rootRef.current = root;

    const pointerHandler = () => notePointerActivity();
    stage.addEventListener("pointermove", pointerHandler, { passive: true });

    const stopSpeechPulse = () => {
      cancelAnimationFrame(speechFrameRef.current);
      speechFrameRef.current = 0;
    };

    const startSpeechPulse = () => {
      stopSpeechPulse();
      const started = performance.now();
      const pulse = (now: number) => {
        const t = (now - started) / 1000;
        const envelope = 0.34 + Math.abs(Math.sin(t * 8.7)) * 0.24 + Math.abs(Math.sin(t * 13.1 + 0.8)) * 0.18;
        stage.style.setProperty("--voice-level", Math.min(0.88, envelope).toFixed(3));
        stage.style.setProperty("--voice-wave", (0.82 + envelope * 1.35).toFixed(3));
        speechFrameRef.current = requestAnimationFrame(pulse);
      };
      speechFrameRef.current = requestAnimationFrame(pulse);
    };

    const syncState = () => {
      const state = root.dataset.state;
      stopSpeechPulse();
      if (state === "listening") {
        void startMicrophoneMeter();
        return;
      }
      stopMicrophoneMeter();
      if (state === "speaking") startSpeechPulse();
    };

    const observer = new MutationObserver(syncState);
    observer.observe(root, { attributes: true, attributeFilter: ["data-state"] });
    syncState();

    return () => {
      observer.disconnect();
      stopSpeechPulse();
      stage.removeEventListener("pointermove", pointerHandler);
      stopMicrophoneMeter();
      stageRef.current = null;
      rootRef.current = null;
    };
  }, [notePointerActivity, startMicrophoneMeter, stopMicrophoneMeter]);

  useEffect(() => {
    const root = rootRef.current ?? document.querySelector<HTMLElement>(".atlas-lounge-v6");
    if (!root) return;
    root.dataset.runtimeQuality = quality;
  }, [quality]);

  return null;
}
