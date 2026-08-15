"use client";

import { useEffect, useState } from "react";

type AwakeningPhase = "boot" | "ready" | "leaving" | "hidden";
type AwakeningMode = "first" | "returning";

const VISIT_KEY = "atlas-awakening-v1-seen";

export default function AtlasAwakening() {
  const [phase, setPhase] = useState<AwakeningPhase>("boot");
  const [mode, setMode] = useState<AwakeningMode>("first");

  useEffect(() => {
    if (window.location.pathname !== "/") {
      setPhase("hidden");
      return;
    }

    const directEntry = new URLSearchParams(window.location.search).get("direct") === "1";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const returning = window.localStorage.getItem(VISIT_KEY) === "true";
    setMode(returning ? "returning" : "first");

    if (directEntry || reducedMotion) {
      window.localStorage.setItem(VISIT_KEY, "true");
      setPhase("hidden");
      return;
    }

    let cancelled = false;
    let leaveTimer: ReturnType<typeof setTimeout> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const fontsReady = "fonts" in document ? document.fonts.ready : Promise.resolve();
    const readinessTimeout = new Promise<void>((resolve) => {
      leaveTimer = setTimeout(resolve, returning ? 180 : 1200);
    });

    Promise.race([fontsReady.then(() => undefined), readinessTimeout]).then(() => {
      if (cancelled) return;
      setPhase("ready");
      window.localStorage.setItem(VISIT_KEY, "true");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled) return;
          setPhase("leaving");
          hideTimer = setTimeout(() => setPhase("hidden"), returning ? 360 : 920);
        });
      });
    });

    return () => {
      cancelled = true;
      if (leaveTimer) clearTimeout(leaveTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  function skip() {
    window.localStorage.setItem(VISIT_KEY, "true");
    setPhase("hidden");
  }

  if (phase === "hidden") return null;

  return (
    <div className="atlas-awakening" data-phase={phase} data-mode={mode} role="status" aria-live="polite" aria-label="Ouverture d’ATLAS">
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
      <div className="awakening-copy">
        <p>ATLAS</p>
        <strong>{mode === "first" ? "La présence s’éveille." : "La présence revient."}</strong>
        <small>Environnement procédural · aucune image préinstallée</small>
      </div>
      <button type="button" onClick={skip}>Accéder directement</button>
    </div>
  );
}
