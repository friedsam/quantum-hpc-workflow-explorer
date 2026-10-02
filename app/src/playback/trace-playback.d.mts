import type { SimulationResult } from "../domain/types";

export interface VisualSnapshot {
  simTimeS: number;
  eventTypes: readonly string[];
  resourceUnitsByPoolAndState: Readonly<Record<string, Readonly<Record<string, number>>>>;
  taskStateCounts: Readonly<Record<string, number>>;
  queueDepthByPool: Readonly<Record<string, number>>;
}

export interface VisualKeyframe {
  presentationTimeMs: number;
  dwellMs: number;
  sourceEventSeqRange: readonly [number, number];
  simTimeRangeS: readonly [number, number];
  label: string;
  kind: "detail" | "compressed";
  repeatCount: number;
  patternLength: number;
  snapshot: VisualSnapshot;
}

export interface PlaybackState {
  index: number;
  playing: boolean;
  speed: number;
  presentationTimeMs: number;
  keyframe: VisualKeyframe | null;
}

export interface PlaybackController {
  getState(): PlaybackState;
  play(wallTimeMs: number): PlaybackState;
  pause(wallTimeMs: number): PlaybackState;
  tick(wallTimeMs: number): PlaybackState;
  stepForward(): PlaybackState;
  stepBackward(): PlaybackState;
  seekIndex(index: number): PlaybackState;
  setSpeed(speed: number, wallTimeMs?: number): PlaybackState;
}

export interface AnimationFrameDriver {
  play(timestamp: number): PlaybackState;
  pause(timestamp: number): PlaybackState;
  stepForward(): PlaybackState;
  stepBackward(): PlaybackState;
  seekIndex(index: number): PlaybackState;
  destroy(): void;
}

export function buildVisualKeyframes(result: SimulationResult, options?: Record<string, unknown>): readonly VisualKeyframe[];
export function createPlaybackController(keyframes: readonly VisualKeyframe[], options?: { speed?: number }): PlaybackController;
export function createAnimationFrameDriver(
  controller: PlaybackController,
  render: (state: PlaybackState) => void,
  env?: Window
): AnimationFrameDriver;
export function totalPresentationDurationMs(keyframes: readonly VisualKeyframe[]): number;
