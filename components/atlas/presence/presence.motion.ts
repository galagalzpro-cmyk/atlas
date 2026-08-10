import type { AtlasPresenceState } from "./presence.types";

export interface AtlasPresenceMotionTarget {
  formation: number;
  energy: number;
  depthPush: number;
  stability: number;
  fragmentRelease: number;
  breathRate: number;
  morphRate: number;
  microRate: number;
}

export interface AtlasPresenceMotionFrame extends AtlasPresenceMotionTarget {
  time: number;
  breath: number;
  morph: number;
  micro: number;
}

export const ATLAS_PRESENCE_MOTION: Record<AtlasPresenceState, AtlasPresenceMotionTarget> = {
  idle: {
    formation: 0.86,
    energy: 0.58,
    depthPush: 0.34,
    stability: 0.82,
    fragmentRelease: 0.24,
    breathRate: 0.48,
    morphRate: 0.22,
    microRate: 0.82,
  },
  listening: {
    formation: 0.96,
    energy: 0.68,
    depthPush: 0.54,
    stability: 0.95,
    fragmentRelease: 0.12,
    breathRate: 0.40,
    morphRate: 0.16,
    microRate: 0.66,
  },
  thinking: {
    formation: 0.80,
    energy: 0.92,
    depthPush: 0.42,
    stability: 0.66,
    fragmentRelease: 0.48,
    breathRate: 0.62,
    morphRate: 0.74,
    microRate: 1.18,
  },
  speaking: {
    formation: 0.94,
    energy: 1.0,
    depthPush: 0.62,
    stability: 0.88,
    fragmentRelease: 0.28,
    breathRate: 0.56,
    morphRate: 0.48,
    microRate: 1.34,
  },
  calm: {
    formation: 0.92,
    energy: 0.42,
    depthPush: 0.24,
    stability: 0.98,
    fragmentRelease: 0.08,
    breathRate: 0.26,
    morphRate: 0.10,
    microRate: 0.42,
  },
};

export function atlasMasterTime(nowMs: number): number {
  return nowMs * 0.001;
}

export function approach(current: number, target: number, response = 0.035): number {
  return current + (target - current) * response;
}

export function createMotionFrame(time: number, target: AtlasPresenceMotionTarget): AtlasPresenceMotionFrame {
  const breath = 0.5 + 0.5 * Math.sin(time * target.breathRate * Math.PI * 2);
  const morph = 0.5 + 0.5 * Math.sin(time * target.morphRate * Math.PI * 2 + 1.17);
  const micro = 0.5 + 0.5 * Math.sin(time * target.microRate * Math.PI * 2 + 2.41);
  return { ...target, time, breath, morph, micro };
}

export function seededUnit(index: number, salt = 0): number {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453123;
  return value - Math.floor(value);
}
