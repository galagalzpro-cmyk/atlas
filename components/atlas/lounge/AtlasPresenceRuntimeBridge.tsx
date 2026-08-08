"use client";

import { useEffect, useRef } from "react";
import { useAtlasPresenceRuntime } from "./useAtlasPresenceRuntime";

export default function AtlasPresenceRuntimeBridge() {
  const stageRef = useRef<HTMLElement | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  const { quality, notePointerActivity, startMicrophoneMeter, stopMicrophoneMeter } = useAtlasPresenceRuntime(stageRef);

  useEffect(() => {
    const stage = document.querySelector<HTMLElement>(".atlas-sanctuary");
    const root = document.querySelector<HTMLElement>(".atlas-lounge-v6");
    if (!stage || !root) return;
    stageRef.current = stage;
    rootRef.current = root;

    const pointerHandler = () => notePointerActivity();
    stage.addEventListener("pointermove", pointerHandler, { passive: true });

    const syncListeningState = () => {
      const state = root.dataset.state;
      if (state === "listening") void startMicrophoneMeter();
      else stopMicrophoneMeter();
    };

    const observer = new MutationObserver(syncListeningState);
    observer.observe(root, { attributes: true, attributeFilter: ["data-state"] });
    syncListeningState();

    return () => {
      observer.disconnect();
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
