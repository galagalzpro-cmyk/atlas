"use client";

import type { CSSProperties, FormEvent, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applySignal,
  deriveModeFromIntent,
  INITIAL_STATE,
  SCENARIOS,
  type AtlasMode,
  type AtlasRuntimeState,
  type AtlasSignal,
} from "../../core/runtime/model";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  size: number;
};

const MODE_ORDER: AtlasMode[] = ["presence", "clarity", "expansion", "resolve"];

function signal(type: AtlasSignal["type"], intensity: number, extras: Partial<AtlasSignal> = {}): AtlasSignal {
  return { type, intensity, timestamp: performance.now(), ...extras };
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function AtlasRuntime() {
  const [runtime, setRuntime] = useState<AtlasRuntimeState>(INITIAL_STATE);
  const [intent, setIntent] = useState("");
  const [systemMessage, setSystemMessage] = useState("Le moteur observe les interactions autorisées et ajuste la scène en continu.");
  const runtimeRef = useRef(runtime);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const pointerFrameRef = useRef<number | null>(null);
  const pendingPointerRef = useRef({ x: 0.5, y: 0.5, intensity: 0 });
  const lastPointerRef = useRef({ x: 0.5, y: 0.5, time: 0 });

  useEffect(() => {
    runtimeRef.current = runtime;
  }, [runtime]);

  const dispatch = useCallback((nextSignal: AtlasSignal, mode?: AtlasMode) => {
    setRuntime((current) => applySignal(current, nextSignal, mode));
  }, []);

  const activateMode = useCallback((mode: AtlasMode) => {
    dispatch(signal("scenario", 1, { payload: mode }), mode);
    setSystemMessage(SCENARIOS[mode].description);
  }, [dispatch]);

  useEffect(() => {
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      dispatch(signal("scroll", 0.36, { direction: window.scrollY / max }));
    };
    let scrollFrame = 0;
    const scheduledScroll = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        onScroll();
      });
    };
    window.addEventListener("scroll", scheduledScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", scheduledScroll);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
    };
  }, [dispatch]);

  useEffect(() => {
    let frame = 0;
    let lastStatePulse = 0;
    const animate = (time: number) => {
      if (time - lastStatePulse > 110) {
        lastStatePulse = time;
        dispatch(signal("autonomous", 0.18));
      }
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [dispatch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const particles: Particle[] = Array.from({ length: reducedMotion ? 34 : 92 }, (_, index) => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0005,
      vy: (Math.random() - 0.5) * 0.0005,
      phase: (index / 92) * Math.PI * 2,
      size: 0.6 + Math.random() * 1.8,
    }));

    let width = 1;
    let height = 1;
    let dpr = 1;
    let animationFrame = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const render = (time: number) => {
      const state = runtimeRef.current;
      const pointerX = state.pointerX * width;
      const pointerY = state.pointerY * height;
      const speed = reducedMotion ? 0.08 : 0.28 + state.pace * 1.35;
      const connectionDistance = 84 + state.depth * 105;

      context.clearRect(0, 0, width, height);
      const background = context.createRadialGradient(
        pointerX,
        pointerY,
        0,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.8,
      );
      background.addColorStop(0, `hsla(${state.accentHue}, ${state.saturation}%, ${state.lightness}%, ${0.08 + state.energy * 0.12})`);
      background.addColorStop(0.42, `hsla(${state.hue}, ${state.saturation}%, 18%, ${0.14 + state.depth * 0.12})`);
      background.addColorStop(1, "rgba(4, 4, 6, 0)");
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      context.globalCompositeOperation = "lighter";
      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        const dxPointer = particle.x * width - pointerX;
        const dyPointer = particle.y * height - pointerY;
        const pointerDistance = Math.max(28, Math.hypot(dxPointer, dyPointer));
        const pointerForce = (state.energy * 0.00095) / pointerDistance;
        particle.vx += (dxPointer / pointerDistance) * pointerForce * state.turbulence;
        particle.vy += (dyPointer / pointerDistance) * pointerForce * state.turbulence;

        const wave = Math.sin(time * 0.00045 * speed + particle.phase);
        particle.vx += Math.cos(particle.phase + time * 0.00008) * 0.000002 * state.turbulence;
        particle.vy += Math.sin(particle.phase + time * 0.00007) * 0.000002 * state.turbulence;
        particle.vx *= 0.992;
        particle.vy *= 0.992;
        particle.x += (particle.vx + wave * 0.000025 * state.energy) * speed;
        particle.y += (particle.vy + Math.cos(wave) * 0.000018 * state.energy) * speed;

        if (particle.x < -0.03) particle.x = 1.03;
        if (particle.x > 1.03) particle.x = -0.03;
        if (particle.y < -0.03) particle.y = 1.03;
        if (particle.y > 1.03) particle.y = -0.03;

        const x = particle.x * width;
        const y = particle.y * height;
        const radius = particle.size + state.energy * 1.8;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = `hsla(${state.accentHue + wave * 18}, ${state.saturation}%, ${state.lightness}%, ${0.22 + state.focus * 0.52})`;
        context.fill();

        for (let neighborIndex = index + 1; neighborIndex < particles.length; neighborIndex += 1) {
          const neighbor = particles[neighborIndex];
          const nx = neighbor.x * width;
          const ny = neighbor.y * height;
          const distance = Math.hypot(x - nx, y - ny);
          if (distance > connectionDistance) continue;
          const alpha = (1 - distance / connectionDistance) * (0.025 + state.focus * 0.14);
          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(nx, ny);
          context.strokeStyle = `hsla(${state.hue}, ${state.saturation}%, ${state.lightness}%, ${alpha})`;
          context.lineWidth = 0.45 + state.energy * 0.55;
          context.stroke();
        }
      }

      const coreX = width * (0.5 + (state.pointerX - 0.5) * 0.08);
      const coreY = height * (0.49 + (state.pointerY - 0.5) * 0.06);
      const pulse = 1 + Math.sin(time * 0.0015 * (0.5 + state.pace)) * 0.055;
      const coreRadius = Math.min(width, height) * (0.095 + state.depth * 0.035) * pulse;
      const core = context.createRadialGradient(coreX, coreY, 0, coreX, coreY, coreRadius * 2.4);
      core.addColorStop(0, `hsla(${state.accentHue}, 92%, 84%, ${0.8 + state.energy * 0.15})`);
      core.addColorStop(0.16, `hsla(${state.accentHue}, ${state.saturation}%, ${state.lightness}%, 0.72)`);
      core.addColorStop(0.52, `hsla(${state.hue}, ${state.saturation}%, 22%, 0.2)`);
      core.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = core;
      context.beginPath();
      context.arc(coreX, coreY, coreRadius * 2.4, 0, Math.PI * 2);
      context.fill();
      context.globalCompositeOperation = "source-over";

      animationFrame = window.requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    animationFrame = window.requestAnimationFrame(render);
    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    const now = performance.now();
    const last = lastPointerRef.current;
    const delta = Math.hypot(x - last.x, y - last.y);
    const elapsed = Math.max(16, now - last.time);
    const velocity = Math.min(1, delta * (850 / elapsed));
    lastPointerRef.current = { x, y, time: now };
    pendingPointerRef.current = { x, y, intensity: 0.12 + velocity * 0.65 };

    if (pointerFrameRef.current) return;
    pointerFrameRef.current = window.requestAnimationFrame(() => {
      pointerFrameRef.current = null;
      const pending = pendingPointerRef.current;
      dispatch(signal("pointer", pending.intensity, { x: pending.x, y: pending.y }));
    });
  };

  const handleClick = () => {
    dispatch(signal("click", 0.82));
  };

  const handleIntent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanIntent = intent.trim();
    if (!cleanIntent) return;
    const mode = deriveModeFromIntent(cleanIntent);
    dispatch(signal("intent", 1, { payload: cleanIntent }), mode);
    setSystemMessage(`Intention interprétée comme « ${SCENARIOS[mode].label} ». La scène, le rythme et la hiérarchie se recomposent.`);
    setIntent("");
  };

  const style = useMemo(() => ({
    "--atlas-hue": runtime.hue,
    "--atlas-accent-hue": runtime.accentHue,
    "--atlas-saturation": `${runtime.saturation}%`,
    "--atlas-lightness": `${runtime.lightness}%`,
    "--atlas-energy": runtime.energy,
    "--atlas-focus": runtime.focus,
    "--atlas-depth": runtime.depth,
    "--atlas-turbulence": runtime.turbulence,
    "--atlas-pace": runtime.pace,
    "--atlas-pointer-x": runtime.pointerX,
    "--atlas-pointer-y": runtime.pointerY,
    "--atlas-scroll": runtime.scroll,
  }) as CSSProperties, [runtime]);

  return (
    <main
      ref={sectionRef}
      className="atlas-runtime"
      style={style}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
    >
      <canvas ref={canvasRef} className="atlas-scene" aria-hidden="true" />
      <div className="atlas-aurora" aria-hidden="true" />
      <div className="atlas-noise" aria-hidden="true" />

      <header className="atlas-nav">
        <a className="atlas-brand" href="#atlas-top" aria-label="ATLAS, accueil">
          <span className="atlas-brand-mark"><i /><i /><i /></span>
          <span><strong>ATLAS</strong><small>GENERATIVE EXPERIENCE SYSTEM</small></span>
        </a>
        <nav aria-label="Navigation principale">
          <a href="#atlas-top">Expérience</a>
          <a href="#atlas-engine">Moteur</a>
          <a href="#atlas-scenarios">Scénarios</a>
          <a href="#atlas-platform">Plateforme</a>
        </nav>
        <div className="atlas-live-status"><i /><span>SYSTÈME VIVANT</span><b>{runtime.scenarioLabel}</b></div>
      </header>

      <section className="atlas-hero" id="atlas-top">
        <div className="atlas-hero-copy">
          <p className="atlas-kicker">ATLAS / RUNTIME ADAPTATIF GÉNÉRATIF</p>
          <h1>Le site ne s’affiche pas.<br /><em>Il se transforme.</em></h1>
          <p className="atlas-lead">Pointeur, vitesse, clics, défilement, intention et scénario modifient en direct la lumière, la couleur, la densité, la profondeur, la vitesse et la géométrie de l’expérience.</p>
          <div className="atlas-actions">
            <button type="button" onClick={() => activateMode("expansion")}>Déclencher l’expansion <span>↗</span></button>
            <a href="#atlas-engine">Observer le moteur <span>↓</span></a>
          </div>
        </div>

        <div className="atlas-core-ui" aria-label="État du moteur ATLAS">
          <div className="atlas-orbit atlas-orbit-a" />
          <div className="atlas-orbit atlas-orbit-b" />
          <div className="atlas-orbit atlas-orbit-c" />
          <div className="atlas-core-label"><small>ÉTAT ACTIF</small><strong>{runtime.scenarioLabel}</strong><span>{runtime.lastSignal}</span></div>
          <div className="atlas-signal atlas-signal-one" />
          <div className="atlas-signal atlas-signal-two" />
          <div className="atlas-signal atlas-signal-three" />
        </div>

        <div className="atlas-telemetry" aria-label="Télémétrie de la scène">
          <article><span>ÉNERGIE</span><strong>{formatPercent(runtime.energy)}</strong><i style={{ width: formatPercent(runtime.energy) }} /></article>
          <article><span>FOCUS</span><strong>{formatPercent(runtime.focus)}</strong><i style={{ width: formatPercent(runtime.focus) }} /></article>
          <article><span>PROFONDEUR</span><strong>{formatPercent(runtime.depth)}</strong><i style={{ width: formatPercent(runtime.depth) }} /></article>
          <article><span>ÉVÉNEMENTS</span><strong>{runtime.eventCount}</strong><i style={{ width: `${Math.min(100, runtime.eventCount % 101)}%` }} /></article>
        </div>
      </section>

      <section className="atlas-engine-section" id="atlas-engine">
        <div className="atlas-section-heading">
          <p>01 / MOTEUR CENTRAL</p>
          <h2>Chaque interaction devient un signal exploitable.</h2>
          <span>Le moteur unifie les événements, maintient un état de session et distribue des paramètres continus à toutes les couches de l’interface.</span>
        </div>
        <div className="atlas-engine-grid">
          <article><small>INPUT STREAM</small><h3>Perception événementielle</h3><p>Pointeur, scroll, clic, rythme, intention et temps de présence alimentent un bus unique.</p><b>{runtime.lastSignal.toUpperCase()}</b></article>
          <article><small>STATE GRAPH</small><h3>État vivant</h3><p>Énergie, focus, profondeur, turbulence, chaleur et cadence évoluent sans rupture.</p><b>{runtime.scenarioLabel.toUpperCase()}</b></article>
          <article><small>RENDER CONTRACT</small><h3>Composition générative</h3><p>Canvas, CSS, typographie et composants lisent le même état et se synchronisent.</p><b>SYNC {formatPercent(runtime.focus)}</b></article>
          <article><small>SAFETY ENVELOPE</small><h3>Bornes gouvernées</h3><p>Chaque paramètre est limité, observable et réversible pour empêcher les dérives visuelles.</p><b>STABLE</b></article>
        </div>
      </section>

      <section className="atlas-scenario-section" id="atlas-scenarios">
        <div className="atlas-section-heading">
          <p>02 / SCÉNARIOS TEMPS RÉEL</p>
          <h2>Un changement d’intention recompose tout le système.</h2>
          <span>Les scénarios pilotent la palette, le rythme, la densité, les mouvements et la hiérarchie sans recharger la page.</span>
        </div>
        <div className="atlas-mode-switcher" role="tablist" aria-label="Scénarios ATLAS">
          {MODE_ORDER.map((mode, index) => {
            const scenario = SCENARIOS[mode];
            const active = runtime.mode === mode;
            return (
              <button key={mode} type="button" className={active ? "is-active" : ""} onClick={() => activateMode(mode)}>
                <small>{String(index + 1).padStart(2, "0")}</small>
                <strong>{scenario.label}</strong>
                <span>{scenario.description}</span>
                <i />
              </button>
            );
          })}
        </div>

        <form className="atlas-intent" onSubmit={handleIntent}>
          <label htmlFor="atlas-intent-input">Exprimez une intention. Le moteur choisira et activera un état.</label>
          <div><input id="atlas-intent-input" value={intent} onChange={(event) => setIntent(event.target.value)} placeholder="Ex. Je veux clarifier une décision importante…" /><button type="submit">Interpréter <span>→</span></button></div>
          <p>{systemMessage}</p>
        </form>
      </section>

      <section className="atlas-platform-section" id="atlas-platform">
        <div className="atlas-section-heading">
          <p>03 / PROPAGATION SYSTÈME</p>
          <h2>Un seul état. Toute la plateforme réagit.</h2>
          <span>La même logique alimentera ensuite les contenus, scénarios, interfaces professionnelles, représentations générées, sons, notifications et décisions d’orchestration.</span>
        </div>
        <div className="atlas-propagation">
          {["SCÈNE", "COULEUR", "TYPOGRAPHIE", "COMPOSANTS", "SCÉNARIOS", "SON", "CONTENU", "TEMPS RÉEL"].map((item, index) => <article key={item} style={{ "--index": index } as CSSProperties}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong><i /></article>)}
        </div>
      </section>

      <footer className="atlas-footer">
        <strong>ATLAS ZERO</strong>
        <span>Moteur adaptatif expérimental — branche isolée</span>
        <small>Mode {runtime.scenarioLabel} · {runtime.eventCount} événements</small>
      </footer>
    </main>
  );
}
