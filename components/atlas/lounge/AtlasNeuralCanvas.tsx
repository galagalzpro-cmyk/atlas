"use client";

import { useEffect, useRef } from "react";

export type LoungeVisualState = "idle" | "listening" | "thinking" | "speaking" | "calm";
export type LoungeQuality = "ultra" | "balanced" | "light";

const PALETTES: Record<LoungeVisualState, [number, number, number]> = {
  idle: [218, 190, 145],
  listening: [112, 198, 226],
  thinking: [112, 151, 245],
  speaking: [151, 137, 244],
  calm: [137, 189, 171],
};

export default function AtlasNeuralCanvas({ state, quality }: { state: LoungeVisualState; quality: LoungeQuality }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    let frame = 0;
    let raf = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const count = reducedMotion ? 26 : quality === "ultra" ? 118 : quality === "balanced" ? 72 : 38;
    const particles = Array.from({ length: count }, (_, index) => ({
      angle: (index / count) * Math.PI * 2 + Math.random() * 0.25,
      radius: 0.22 + Math.random() * 0.38,
      depth: 0.45 + Math.random() * 0.8,
      size: 0.7 + Math.random() * 1.8,
      drift: (Math.random() - 0.5) * 0.0028,
      phase: Math.random() * Math.PI * 2,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, quality === "ultra" ? 1.8 : 1.35);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      frame += reducedMotion ? 0 : 1;
      context.clearRect(0, 0, width, height);
      const [r, g, b] = PALETTES[state];
      const centerX = width * 0.5;
      const centerY = height * 0.45;
      const baseRadius = Math.min(width, height) * 0.55;
      const intensity = state === "thinking" ? 1.28 : state === "speaking" ? 1.18 : state === "listening" ? 1.08 : state === "calm" ? 0.74 : 0.9;

      context.save();
      context.globalCompositeOperation = "lighter";

      for (let ring = 0; ring < 4; ring += 1) {
        const radius = baseRadius * (0.56 + ring * 0.12);
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, Math.PI * 2);
        context.strokeStyle = `rgba(${r},${g},${b},${0.055 + ring * 0.018})`;
        context.lineWidth = ring === 0 ? 1.2 : 0.65;
        context.stroke();
      }

      particles.forEach((particle, index) => {
        particle.angle += particle.drift * intensity;
        const oscillation = Math.sin(frame * 0.012 * intensity + particle.phase) * 9;
        const radius = baseRadius * particle.radius * particle.depth + oscillation;
        const x = centerX + Math.cos(particle.angle) * radius;
        const y = centerY + Math.sin(particle.angle) * radius * 0.78;
        const alpha = (0.14 + 0.33 * particle.depth) * intensity;
        context.beginPath();
        context.arc(x, y, particle.size * (quality === "light" ? 0.72 : 1), 0, Math.PI * 2);
        context.fillStyle = `rgba(${r},${g},${b},${Math.min(alpha, 0.72)})`;
        context.fill();

        if (quality !== "light" && index % 4 === 0) {
          const next = particles[(index + 7) % particles.length];
          const nextRadius = baseRadius * next.radius * next.depth;
          const nx = centerX + Math.cos(next.angle) * nextRadius;
          const ny = centerY + Math.sin(next.angle) * nextRadius * 0.78;
          const distance = Math.hypot(nx - x, ny - y);
          if (distance < baseRadius * 0.42) {
            context.beginPath();
            context.moveTo(x, y);
            context.lineTo(nx, ny);
            context.strokeStyle = `rgba(${r},${g},${b},${0.035 * intensity})`;
            context.lineWidth = 0.5;
            context.stroke();
          }
        }
      });

      context.restore();
      if (!reducedMotion) raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, [quality, state]);

  return <canvas ref={canvasRef} className="atlas-neural-canvas" aria-hidden="true" />;
}
