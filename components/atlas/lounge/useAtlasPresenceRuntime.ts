"use client";

import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LoungeQuality } from "./AtlasNeuralCanvas";

function initialQuality(): LoungeQuality {
  if (typeof window === "undefined") return "balanced";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "light";
  const device = navigator as Navigator & { deviceMemory?: number };
  const memory = device.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  if (memory >= 8 && cores >= 8 && window.innerWidth >= 1100) return "ultra";
  if (memory >= 4 && cores >= 4) return "balanced";
  return "light";
}

function downgrade(value: LoungeQuality): LoungeQuality {
  if (value === "ultra") return "balanced";
  if (value === "balanced") return "light";
  return "light";
}

function upgrade(value: LoungeQuality, ceiling: LoungeQuality): LoungeQuality {
  if (value === "light" && ceiling !== "light") return "balanced";
  if (value === "balanced" && ceiling === "ultra") return "ultra";
  return value;
}

export function useAtlasPresenceRuntime(stageRef: RefObject<HTMLElement | null>) {
  const [quality, setQuality] = useState<LoungeQuality>("balanced");
  const ceilingRef = useRef<LoungeQuality>("balanced");
  const lastPointerAtRef = useRef(0);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const meterFrameRef = useRef(0);

  useEffect(() => {
    const ceiling = initialQuality();
    ceilingRef.current = ceiling;
    setQuality(ceiling);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let windowStart = performance.now();
    let frames = 0;
    let healthyWindows = 0;

    const sample = (now: number) => {
      frames += 1;
      const elapsed = now - windowStart;
      if (elapsed >= 2200) {
        const fps = (frames * 1000) / elapsed;
        if (fps < 43) {
          healthyWindows = 0;
          setQuality((current) => downgrade(current));
        } else if (fps > 56) {
          healthyWindows += 1;
          if (healthyWindows >= 4) {
            healthyWindows = 0;
            setQuality((current) => upgrade(current, ceilingRef.current));
          }
        } else {
          healthyWindows = 0;
        }
        frames = 0;
        windowStart = now;
      }
      raf = requestAnimationFrame(sample);
    };

    raf = requestAnimationFrame(sample);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (Date.now() - lastPointerAtRef.current < 2400) return;
      const stage = stageRef.current;
      if (!stage) return;
      const microX = (Math.random() - 0.5) * 0.22;
      const microY = (Math.random() - 0.5) * 0.14;
      stage.style.setProperty("--micro-x", microX.toFixed(3));
      stage.style.setProperty("--micro-y", microY.toFixed(3));
    }, 2700);
    return () => window.clearInterval(timer);
  }, [stageRef]);

  const notePointerActivity = useCallback(() => {
    lastPointerAtRef.current = Date.now();
  }, []);

  const stopMicrophoneMeter = useCallback(() => {
    cancelAnimationFrame(meterFrameRef.current);
    meterFrameRef.current = 0;
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
    const context = audioContextRef.current;
    audioContextRef.current = null;
    if (context && context.state !== "closed") void context.close();
    const stage = stageRef.current;
    stage?.style.setProperty("--voice-level", "0");
    stage?.style.setProperty("--voice-scale", "1");
    stage?.style.setProperty("--voice-wave", "0.55");
  }, [stageRef]);

  const startMicrophoneMeter = useCallback(async () => {
    stopMicrophoneMeter();
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const AudioContextClass = window.AudioContext;
      const context = new AudioContextClass();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      micStreamRef.current = stream;
      audioContextRef.current = context;

      const meter = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let index = 0; index < data.length; index += 1) {
          const normalized = (data[index] - 128) / 128;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / data.length);
        const level = Math.min(1, Math.max(0, rms * 6.4));
        const stage = stageRef.current;
        if (stage) {
          stage.style.setProperty("--voice-level", level.toFixed(3));
          stage.style.setProperty("--voice-scale", (1 + level * 0.055).toFixed(3));
          stage.style.setProperty("--voice-wave", (0.55 + level * 1.65).toFixed(3));
        }
        meterFrameRef.current = requestAnimationFrame(meter);
      };
      meter();
    } catch {
      stopMicrophoneMeter();
    }
  }, [stageRef, stopMicrophoneMeter]);

  useEffect(() => stopMicrophoneMeter, [stopMicrophoneMeter]);

  return {
    quality,
    notePointerActivity,
    startMicrophoneMeter,
    stopMicrophoneMeter,
  };
}
