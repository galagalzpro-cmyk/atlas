"use client";

import { useEffect, useRef } from "react";
import AtlasPresence4D from "../presence/AtlasPresence4D";
import type { AtlasPresenceQuality, AtlasPresenceState } from "../presence/presence.types";

export type LoungeVisualState = AtlasPresenceState;
export type LoungeQuality = AtlasPresenceQuality;

const PALETTES: Record<LoungeVisualState, [number, number, number]> = {
  idle: [218, 190, 145], listening: [112, 198, 226], thinking: [112, 151, 245], speaking: [151, 137, 244], calm: [137, 189, 171],
};

export default function AtlasNeuralCanvas({ state, quality }: { state: LoungeVisualState; quality: LoungeQuality }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;
    let frame = 0, raf = 0, width = 0, height = 0, dpr = 1;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const count = reducedMotion ? 24 : quality === "ultra" ? 128 : quality === "balanced" ? 78 : 36;
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
      dpr = Math.min(window.devicePixelRatio || 1, quality === "ultra" ? 1.7 : 1.25);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = () => {
      frame += reducedMotion ? 0 : 1; context.clearRect(0, 0, width, height);
      const [r, g, b] = PALETTES[state]; const cx = width * .5, cy = height * .45, radiusBase = Math.min(width, height) * .58;
      const intensity = state === "thinking" ? 1.2 : state === "speaking" ? 1.16 : state === "listening" ? 1.04 : state === "calm" ? .68 : .86;
      context.save(); context.globalCompositeOperation = "lighter";
      for (let ring = 0; ring < 5; ring += 1) {
        const radius = radiusBase * (.46 + ring * .12); context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2);
        context.strokeStyle = `rgba(${r},${g},${b},${.028 + ring * .012})`; context.lineWidth = ring === 0 ? 1 : .55; context.stroke();
      }
      particles.forEach((particle, index) => {
        particle.angle += particle.drift * intensity;
        const oscillation = Math.sin(frame * .01 * intensity + particle.phase) * 10;
        const radius = radiusBase * particle.radius * particle.depth + oscillation;
        const x = cx + Math.cos(particle.angle) * radius; const y = cy + Math.sin(particle.angle) * radius * .72;
        context.beginPath(); context.arc(x, y, particle.size * (quality === "light" ? .7 : 1), 0, Math.PI * 2);
        context.fillStyle = `rgba(${r},${g},${b},${Math.min((.08 + .24 * particle.depth) * intensity, .52)})`; context.fill();
        if (quality !== "light" && index % 5 === 0) {
          const next = particles[(index + 9) % particles.length]; const nr = radiusBase * next.radius * next.depth;
          const nx = cx + Math.cos(next.angle) * nr, ny = cy + Math.sin(next.angle) * nr * .72;
          if (Math.hypot(nx - x, ny - y) < radiusBase * .34) { context.beginPath(); context.moveTo(x, y); context.lineTo(nx, ny); context.strokeStyle = `rgba(${r},${g},${b},${.024 * intensity})`; context.lineWidth = .45; context.stroke(); }
        }
      });
      context.restore(); if (!reducedMotion) raf = requestAnimationFrame(draw);
    };
    resize(); window.addEventListener("resize", resize, { passive: true }); draw();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(raf); };
  }, [quality, state]);

  return <><canvas ref={canvasRef} className="atlas-neural-canvas" aria-hidden="true" /><div className="atlas-presence-layer" aria-hidden="true"><AtlasPresence4D state={state} quality={quality} /></div></>;
}
