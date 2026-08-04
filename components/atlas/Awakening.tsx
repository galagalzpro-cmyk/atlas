"use client";

import type { CSSProperties } from "react";

interface AwakeningProps {
  progress: number;
  returning: boolean;
  detail: string;
  onSkip: () => void;
}

export function Awakening({ progress, returning, detail, onSkip }: AwakeningProps) {
  return (
    <section className={returning ? "awakening returning" : "awakening"} aria-live="polite">
      <div className="awakening-core" style={{ "--progress": `${progress}%` } as CSSProperties}>
        <div className="pulse" /><div className="pulse pulse-two" /><div className="seed" />
      </div>
      <p className="kicker">ATLAS AWAKENING</p>
      <h1>{returning ? "La présence vous reconnaît." : "La présence se construit."}</h1>
      <p>{detail}</p>
      <div className="progress" aria-label={`Chargement ${progress} %`}><span style={{ width: `${progress}%` }} /></div>
      <button onClick={onSkip}>{returning ? "Reprendre maintenant" : "Entrer directement"}</button>
    </section>
  );
}
