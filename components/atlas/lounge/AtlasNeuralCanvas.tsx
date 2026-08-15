"use client";

import { useEffect, useRef } from "react";
import AtlasGeometricFragments from "../presence/AtlasGeometricFragments";
import AtlasPresence4D from "../presence/AtlasPresence4D";
import { ATLAS_PRESENCE_MOTION, atlasMasterTime, createMotionFrame, seededUnit } from "../presence/presence.motion";
import type { AtlasPresenceQuality, AtlasPresenceState } from "../presence/presence.types";

export type LoungeVisualState = AtlasPresenceState;
export type LoungeQuality = AtlasPresenceQuality;

const PALETTES: Record<LoungeVisualState, [number, number, number]> = {
  idle: [218, 190, 145],
  listening: [112, 198, 226],
  thinking: [112, 151, 245],
  speaking: [151, 137, 244],
  calm: [137, 189, 171],
};

export default function AtlasNeuralCanvas({ state, quality }: { state: LoungeVisualState; quality: LoungeQuality }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef(state);
  const qualityRef = useRef(quality);
  const redrawRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    stateRef.current = state;
    qualityRef.current = quality;
    redrawRef.current?.();
  }, [quality, state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;
    const surface: HTMLCanvasElement = canvas;
    const drawingContext: CanvasRenderingContext2D = context;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motionPreference.matches;
    let raf = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let previousFrame = 0;
    const particles = Array.from({ length: 144 }, (_, index) => ({
      angle: (index / 144) * Math.PI * 2 + seededUnit(index, 1) * 0.24,
      radius: 0.18 + seededUnit(index, 2) * 0.46,
      depth: 0.35 + seededUnit(index, 3) * 1.05,
      size: 0.55 + seededUnit(index, 4) * 1.65,
      drift: (seededUnit(index, 5) - 0.5) * 0.0023,
      phase: seededUnit(index, 6) * Math.PI * 2,
    }));

    function effectiveQuality(): LoungeQuality {
      return reduced ? "light" : qualityRef.current;
    }

    function resize() {
      const rect = surface.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const currentQuality = effectiveQuality();
      dpr = Math.min(window.devicePixelRatio || 1, currentQuality === "ultra" ? 1.7 : currentQuality === "balanced" ? 1.3 : 1);
      const pixelWidth = Math.round(width * dpr);
      const pixelHeight = Math.round(height * dpr);
      if (surface.width !== pixelWidth) surface.width = pixelWidth;
      if (surface.height !== pixelHeight) surface.height = pixelHeight;
      drawingContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function render(now: number) {
      drawingContext.clearRect(0, 0, width, height);
      const currentQuality = effectiveQuality();
      const currentState = stateRef.current;
      const [r, g, b] = PALETTES[currentState];
      const time = atlasMasterTime(now);
      const motion = createMotionFrame(time, ATLAS_PRESENCE_MOTION[currentState]);
      const cx = width * 0.5;
      const cy = height * 0.45;
      const radiusBase = Math.min(width, height) * (0.57 + motion.depthPush * 0.025);
      const activeCount = reduced ? 22 : currentQuality === "ultra" ? 144 : currentQuality === "balanced" ? 88 : 38;

      drawingContext.save();
      drawingContext.globalCompositeOperation = "lighter";
      for (let ring = 0; ring < 5; ring += 1) {
        const breathe = (motion.breath - 0.5) * 4.5;
        const radius = radiusBase * (0.46 + ring * 0.12) + breathe * (ring + 1) * 0.35;
        drawingContext.beginPath();
        drawingContext.arc(cx, cy, radius, 0, Math.PI * 2);
        drawingContext.strokeStyle = `rgba(${r},${g},${b},${0.018 + ring * 0.009 + motion.energy * 0.008})`;
        drawingContext.lineWidth = ring === 0 ? 1 : 0.55;
        drawingContext.stroke();
      }

      for (let index = 0; index < activeCount; index += 1) {
        const particle = particles[index];
        const speed = 0.56 + motion.energy * 0.34;
        const angle = particle.angle + time * particle.drift * 60 * speed;
        const oscillation = Math.sin(time * (0.42 + motion.energy * 0.18) + particle.phase + motion.morph * 0.6) * 8 * (0.55 + motion.fragmentRelease * 0.65);
        const radius = radiusBase * particle.radius * particle.depth + oscillation;
        const parallax = 1 + (particle.depth - 0.8) * motion.depthPush * 0.05;
        const x = cx + Math.cos(angle) * radius * parallax;
        const y = cy + Math.sin(angle) * radius * 0.72 * parallax;
        drawingContext.beginPath();
        drawingContext.arc(x, y, particle.size * (currentQuality === "light" ? 0.7 : 1) * (1 + motion.energy * 0.08), 0, Math.PI * 2);
        drawingContext.fillStyle = `rgba(${r},${g},${b},${Math.min((0.045 + 0.15 * particle.depth) * (0.62 + motion.energy * 0.34), 0.34)})`;
        drawingContext.fill();

        if (currentQuality !== "light" && index % 6 === 0) {
          const next = particles[(index + 11) % activeCount];
          const nextAngle = next.angle + time * next.drift * 60 * speed;
          const nextRadius = radiusBase * next.radius * next.depth;
          const nextX = cx + Math.cos(nextAngle) * nextRadius;
          const nextY = cy + Math.sin(nextAngle) * nextRadius * 0.72;
          if (Math.hypot(nextX - x, nextY - y) < radiusBase * 0.31) {
            drawingContext.beginPath();
            drawingContext.moveTo(x, y);
            drawingContext.lineTo(nextX, nextY);
            drawingContext.strokeStyle = `rgba(${r},${g},${b},${0.012 + motion.energy * 0.014})`;
            drawingContext.lineWidth = 0.45;
            drawingContext.stroke();
          }
        }
      }
      drawingContext.restore();
    }

    function schedule() {
      if (!reduced && !document.hidden && !raf) raf = requestAnimationFrame(draw);
    }

    function draw(now: number) {
      raf = 0;
      const framesPerSecond = qualityRef.current === "ultra" ? 45 : qualityRef.current === "balanced" ? 30 : 20;
      if (now - previousFrame >= 1000 / framesPerSecond) {
        previousFrame = now;
        render(now);
      }
      schedule();
    }

    function redraw() {
      resize();
      render(performance.now());
      schedule();
    }

    function handleMotionPreference(event: MediaQueryListEvent) {
      reduced = event.matches;
      if (reduced && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      redraw();
    }

    function handleVisibility() {
      if (document.hidden && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!document.hidden) {
        render(performance.now());
        schedule();
      }
    }

    const resizeObserver = new ResizeObserver(redraw);
    redrawRef.current = redraw;
    resizeObserver.observe(surface);
    motionPreference.addEventListener("change", handleMotionPreference);
    document.addEventListener("visibilitychange", handleVisibility);
    redraw();

    return () => {
      redrawRef.current = null;
      resizeObserver.disconnect();
      motionPreference.removeEventListener("change", handleMotionPreference);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="atlas-neural-canvas" aria-hidden="true" />
      <div className="atlas-presence-layer" aria-hidden="true">
        <AtlasPresence4D state={state} quality={quality} />
        <AtlasGeometricFragments state={state} quality={quality} />
      </div>
    </>
  );
}
