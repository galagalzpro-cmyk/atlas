"use client";

import { useEffect, useRef } from "react";
import AtlasGeometricFragments from "../presence/AtlasGeometricFragments";
import AtlasPresence4D from "../presence/AtlasPresence4D";
import type { AtlasPresenceQuality, AtlasPresenceState } from "../presence/presence.types";

export type LoungeVisualState = AtlasPresenceState;
export type LoungeQuality = AtlasPresenceQuality;

const PALETTES: Record<LoungeVisualState, [number, number, number]> = {
  idle: [218, 190, 145], listening: [112, 198, 226], thinking: [112, 151, 245], speaking: [151, 137, 244], calm: [137, 189, 171],
};

export default function AtlasNeuralCanvas({ state, quality }: { state: LoungeVisualState; quality: LoungeQuality }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef(state);
  const qualityRef = useRef(quality);

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { qualityRef.current = quality; }, [quality]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;
    let raf = 0, width = 0, height = 0, dpr = 1;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const count = reducedMotion ? 24 : 132;
    const particles = Array.from({ length: count }, (_, index) => ({
      angle: (index / count) * Math.PI * 2 + Math.random() * 0.25,
      radius: 0.18 + Math.random() * 0.46,
      depth: 0.35 + Math.random() * 1.05,
      size: 0.55 + Math.random() * 1.65,
      drift: (Math.random() - 0.5) * 0.0023,
      phase: Math.random() * Math.PI * 2,
    }));
    const resize = () => {
      const rect = canvas.getBoundingClientRect(); width = Math.max(1, rect.width); height = Math.max(1, rect.height);
      const q = qualityRef.current;
      dpr = Math.min(window.devicePixelRatio || 1, q === "ultra" ? 1.7 : q === "balanced" ? 1.3 : 1);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = (now: number) => {
      context.clearRect(0, 0, width, height);
      const currentState = stateRef.current;
      const currentQuality = qualityRef.current;
      const [r, g, b] = PALETTES[currentState];
      const cx = width * .5, cy = height * .45, radiusBase = Math.min(width, height) * .58;
      const intensity = currentState === "thinking" ? 1.2 : currentState === "speaking" ? 1.16 : currentState === "listening" ? 1.04 : currentState === "calm" ? .68 : .86;
      const time = now * .001;
      context.save(); context.globalCompositeOperation = "lighter";
      for (let ring = 0; ring < 5; ring += 1) {
        const radius = radiusBase * (.46 + ring * .12); context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2);
        context.strokeStyle = `rgba(${r},${g},${b},${.028 + ring * .012})`; context.lineWidth = ring === 0 ? 1 : .55; context.stroke();
      }
      const activeCount = reducedMotion ? 24 : currentQuality === "ultra" ? 132 : currentQuality === "balanced" ? 82 : 38;
      particles.slice(0, activeCount).forEach((particle, index) => {
        const angle = particle.angle + time * particle.drift * 60 * intensity;
        const oscillation = Math.sin(time * .62 * intensity + particle.phase) * 10;
        const radius = radiusBase * particle.radius * particle.depth + oscillation;
        const x = cx + Math.cos(angle) * radius; const y = cy + Math.sin(angle) * radius * .72;
        context.beginPath(); context.arc(x, y, particle.size * (currentQuality === "light" ? .7 : 1), 0, Math.PI * 2);
        context.fillStyle = `rgba(${r},${g},${b},${Math.min((.08 + .24 * particle.depth) * intensity, .52)})`; context.fill();
        if (currentQuality !== "light" && index % 5 === 0) {
          const next = particles[(index + 9) % activeCount]; const nextAngle = next.angle + time * next.drift * 60 * intensity;
          const nr = radiusBase * next.radius * next.depth;
          const nx = cx + Math.cos(nextAngle) * nr, ny = cy + Math.sin(nextAngle) * nr * .72;
          if (Math.hypot(nx - x, ny - y) < radiusBase * .34) { context.beginPath(); context.moveTo(x, y); context.lineTo(nx, ny); context.strokeStyle = `rgba(${r},${g},${b},${.024 * intensity})`; context.lineWidth = .45; context.stroke(); }
        }
      });
      context.restore(); if (!reducedMotion) raf = requestAnimationFrame(draw);
    };
    resize(); window.addEventListener("resize", resize, { passive: true }); draw(performance.now());
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(raf); };
  }, []);

  return <><canvas ref={canvasRef} className="atlas-neural-canvas" aria-hidden="true" /><div className="atlas-presence-layer" aria-hidden="true"><AtlasPresence4D state={state} quality={quality} /><AtlasGeometricFragments state={state} quality={quality} /></div></>;
}
