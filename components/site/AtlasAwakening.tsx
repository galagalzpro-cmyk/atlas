"use client";

import { useEffect, useRef, useState } from "react";

type AwakeningPhase = "boot" | "ready" | "leaving" | "hidden";
type AwakeningMode = "first" | "returning";

const VISIT_KEY = "atlas-awakening-v1-seen";

function readVisitState(): boolean {
  try {
    return window.localStorage.getItem(VISIT_KEY) === "true";
  } catch {
    return false;
  }
}

function storeVisitState(): void {
  try {
    window.localStorage.setItem(VISIT_KEY, "true");
  } catch {
    // The experience remains usable when browser storage is unavailable.
  }
}

export default function AtlasAwakening() {
  const [phase, setPhase] = useState<AwakeningPhase>("boot");
  const [mode, setMode] = useState<AwakeningMode>("first");
  const previousOverflowRef = useRef<string | null>(null);

  useEffect(() => {
    const directEntry = new URLSearchParams(window.location.search).get("direct") === "1";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const returning = readVisitState();
    setMode(returning ? "returning" : "first");

    if (directEntry || reducedMotion) {
      storeVisitState();
      setPhase("hidden");
      return;
    }

    previousOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let cancelled = false;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const wait = (duration: number) => new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        resolve();
      }, duration);
      timers.add(timer);
    });

    const fontsReady = "fonts" in document
      ? document.fonts.ready.then(() => undefined).catch(() => undefined)
      : Promise.resolve();
    const assetReadiness = Promise.race([fontsReady, wait(returning ? 180 : 900)]);
    const minimumSequence = wait(returning ? 180 : 640);

    Promise.all([assetReadiness, minimumSequence])
      .then(() => {
        if (cancelled) return;
        setPhase("ready");
        storeVisitState();
        return wait(returning ? 50 : 180);
      })
      .then(() => {
        if (cancelled) return;
        setPhase("leaving");
        return wait(returning ? 320 : 820);
      })
      .then(() => {
        if (cancelled) return;
        setPhase("hidden");
        document.body.style.overflow = previousOverflowRef.current ?? "";
        previousOverflowRef.current = null;
      });

    return () => {
      cancelled = true;
      timers.forEach((timer) => clearTimeout(timer));
      document.body.style.overflow = previousOverflowRef.current ?? "";
      previousOverflowRef.current = null;
    };
  }, []);

  function skip() {
    storeVisitState();
    document.body.style.overflow = previousOverflowRef.current ?? "";
    previousOverflowRef.current = null;
    setPhase("hidden");
  }

  if (phase === "hidden") return null;

  return (
    <section
      className="atlas-awakening"
      data-phase={phase}
      data-mode={mode}
      aria-label="Ouverture d’ATLAS"
    >
      <div className="awakening-fog awakening-fog-a" aria-hidden="true" />
      <div className="awakening-fog awakening-fog-b" aria-hidden="true" />
      <div className="awakening-grid" aria-hidden="true" />
      <div className="awakening-presence" aria-hidden="true">
        <span className="awakening-orbit awakening-orbit-a" />
        <span className="awakening-orbit awakening-orbit-b" />
        <span className="awakening-orbit awakening-orbit-c" />
        <span className="awakening-core"><i /><i /><i /></span>
        <span className="awakening-signal signal-a" />
        <span className="awakening-signal signal-b" />
        <span className="awakening-signal signal-c" />
      </div>
      <div className="awakening-copy" aria-live="polite">
        <p>ATLAS</p>
        <strong>{mode === "first" ? "La présence s’éveille." : "La présence revient."}</strong>
        <small>Environnement procédural · aucune image préinstallée</small>
      </div>
      <button type="button" onClick={skip}>Accéder directement</button>
    </section>
  );
}
