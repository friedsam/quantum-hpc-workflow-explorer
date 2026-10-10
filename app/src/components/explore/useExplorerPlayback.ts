import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CompilationManifest } from "../../design/types";
import { deriveActorStateDetailAt } from "../../design/actor-state.mjs";
import type { SimulationResult } from "../../domain/types";
import {
  buildActorAwareVisualKeyframes,
  type ActorAwareVisualKeyframe
} from "../../playback/actor-aware-view.mjs";
import {
  createAnimationFrameDriver,
  createPlaybackController,
  totalPresentationDurationMs,
  type AnimationFrameDriver,
  type PlaybackState
} from "../../playback/trace-playback.mjs";

function nearestKeyframeIndex(
  keyframes: readonly ActorAwareVisualKeyframe[],
  simTimeS: number
): number {
  if (!keyframes.length) return -1;
  let best = 0;
  let distance = Infinity;
  keyframes.forEach((frame, index) => {
    const candidate = Math.abs(frame.snapshot.simTimeS - simTimeS);
    if (candidate < distance) {
      best = index;
      distance = candidate;
    }
  });
  return best;
}

export function useExplorerPlayback(
  result: SimulationResult,
  manifest: CompilationManifest | null | undefined,
  cursorTimeS: number,
  onTimeChange: (simTimeS: number) => void
) {
  const keyframes = useMemo(
    () =>
      buildActorAwareVisualKeyframes(result, {
        manifest: manifest ?? undefined,
        deriveActorStateDetailAt
      }),
    [result, manifest]
  );

  const controller = useMemo(
    () => createPlaybackController(keyframes),
    [keyframes]
  );

  const driverRef = useRef<AnimationFrameDriver | null>(null);
  const [state, setState] = useState<PlaybackState>(() =>
    controller.getState()
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [animationEnabled, setAnimationEnabled] = useState(
    () => !prefersReducedMotion
  );

  const renderState = useCallback(
    (next: PlaybackState) => {
      setState(next);
      if (next.keyframe) onTimeChange(next.keyframe.snapshot.simTimeS);
    },
    [onTimeChange]
  );

  useEffect(() => {
    const initial = controller.getState();
    renderState(initial);
    const driver = createAnimationFrameDriver(
      controller,
      renderState,
      window
    );
    driverRef.current = driver;
    return () => {
      driver.destroy();
      driverRef.current = null;
    };
  }, [controller, renderState]);

  useEffect(() => {
    if (state.playing || !keyframes.length) return;
    const index = nearestKeyframeIndex(keyframes, cursorTimeS);
    if (index < 0 || index === state.index) return;
    setState(controller.seekIndex(index));
  }, [cursorTimeS, keyframes, controller, state.index, state.playing]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const changed = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
      if (event.matches) setAnimationEnabled(false);
    };
    query.addEventListener("change", changed);
    return () => query.removeEventListener("change", changed);
  }, []);

  useEffect(() => {
    if (!animationEnabled && state.playing) {
      const next = driverRef.current?.pause(performance.now());
      if (next) renderState(next);
    }
  }, [animationEnabled, state.playing, renderState]);

  function togglePlay() {
    const driver = driverRef.current;
    if (!driver || !animationEnabled) return;
    const next = state.playing
      ? driver.pause(performance.now())
      : driver.play(performance.now());
    renderState(next);
  }

  function stepBackward() {
    const next = driverRef.current?.stepBackward();
    if (next) renderState(next);
  }

  function stepForward() {
    const next = driverRef.current?.stepForward();
    if (next) renderState(next);
  }

  function restart() {
    const next = driverRef.current?.seekIndex(0);
    if (next) renderState(next);
  }

  function setSpeed(speed: number) {
    setState(controller.setSpeed(speed, performance.now()));
  }

  return {
    keyframes,
    state,
    frame: state.keyframe as ActorAwareVisualKeyframe | null,
    totalPresentationMs: totalPresentationDurationMs(keyframes),
    animationEnabled,
    setAnimationEnabled,
    prefersReducedMotion,
    togglePlay,
    stepBackward,
    stepForward,
    restart,
    setSpeed
  };
}
