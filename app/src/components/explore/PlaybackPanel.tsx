import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SimulationResult } from "../../domain/types";
import {
  buildVisualKeyframes,
  createAnimationFrameDriver,
  createPlaybackController,
  totalPresentationDurationMs,
  type AnimationFrameDriver,
  type PlaybackState,
  type VisualKeyframe
} from "../../playback/trace-playback.mjs";

interface Props {
  result: SimulationResult;
  onTimeChange: (simTimeS: number) => void;
}

function productionLabel(frame: VisualKeyframe | null): string {
  if (!frame) return "No keyframe";
  if (frame.kind === "compressed" && frame.patternLength > 1) {
    return "Repeated " + frame.patternLength + "-step activity ×" + frame.repeatCount;
  }
  return frame.label;
}

export function PlaybackPanel({ result, onTimeChange }: Props) {
  const keyframes = useMemo(() => buildVisualKeyframes(result), [result]);
  const controller = useMemo(() => createPlaybackController(keyframes), [keyframes]);
  const driverRef = useRef<AnimationFrameDriver | null>(null);
  const [state, setState] = useState<PlaybackState>(() => controller.getState());
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [animationEnabled, setAnimationEnabled] = useState(() => !prefersReducedMotion);

  const renderState = useCallback((next: PlaybackState) => {
    setState(next);
    if (next.keyframe) onTimeChange(next.keyframe.snapshot.simTimeS);
  }, [onTimeChange]);

  useEffect(() => {
    const initial = controller.getState();
    renderState(initial);
    const driver = createAnimationFrameDriver(controller, renderState, window);
    driverRef.current = driver;
    return () => {
      driver.destroy();
      driverRef.current = null;
    };
  }, [controller, renderState]);

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
  }, [animationEnabled, state.playing]);

  const frame = state.keyframe;
  const totalDuration = totalPresentationDurationMs(keyframes);

  function togglePlay() {
    const driver = driverRef.current;
    if (!driver || !animationEnabled) return;
    const next = state.playing
      ? driver.pause(performance.now())
      : driver.play(performance.now());
    renderState(next);
  }

  function restart() {
    const next = driverRef.current?.seekIndex(0);
    if (next) renderState(next);
  }

  function stepBackward() {
    const next = driverRef.current?.stepBackward();
    if (next) renderState(next);
  }

  function stepForward() {
    const next = driverRef.current?.stepForward();
    if (next) renderState(next);
  }

  function setSpeed(speed: number) {
    const next = controller.setSpeed(speed, performance.now());
    setState(next);
  }

  return (
    <section className="surface playback-panel" aria-labelledby="playback-heading">
      <div className="surface-heading">
        <div>
          <p className="section-kicker">Semantic playback</p>
          <h2 id="playback-heading">{productionLabel(frame)}</h2>
        </div>
        <span className={frame?.kind === "compressed" ? "status-chip stale" : "status-chip ok"}>
          {frame?.kind ?? "empty"}
        </span>
      </div>

      <div className="playback-controls">
        <button className="secondary-action" type="button" onClick={restart} disabled={!keyframes.length}>Restart</button>
        <button className="secondary-action" type="button" onClick={stepBackward} disabled={state.index <= 0}>Previous</button>
        <button className="primary-action" type="button" onClick={togglePlay} disabled={!animationEnabled || !keyframes.length}>
          {state.playing ? "Pause" : "Play"}
        </button>
        <button className="secondary-action" type="button" onClick={stepForward} disabled={state.index < 0 || state.index >= keyframes.length - 1}>Next</button>

        <label className="speed-control">
          <span>Speed</span>
          <select value={state.speed} onChange={(event) => setSpeed(Number(event.target.value))}>
            <option value="0.5">0.5×</option>
            <option value="1">1×</option>
            <option value="2">2×</option>
          </select>
        </label>

        <label className="animation-toggle">
          <input
            type="checkbox"
            checked={animationEnabled}
            onChange={(event) => setAnimationEnabled(event.target.checked)}
          />
          <span>Animate transitions</span>
        </label>
      </div>

      <div className="playback-progress" aria-label="Playback keyframe progress">
        <div>
          <strong>{state.index >= 0 ? state.index + 1 : 0}</strong>
          <span> / {keyframes.length} keyframes</span>
        </div>
        <progress max={Math.max(totalDuration, 1)} value={state.presentationTimeMs} />
        <span>{(state.presentationTimeMs / 1000).toFixed(1)} / {(totalDuration / 1000).toFixed(1)} s presentation</span>
      </div>

      {frame ? (
        <div className="playback-provenance">
          <span>simulation {frame.simTimeRangeS[0].toFixed(2)}–{frame.simTimeRangeS[1].toFixed(2)} s</span>
          <span>events seq {frame.sourceEventSeqRange[0]}–{frame.sourceEventSeqRange[1]}</span>
          {frame.kind === "compressed" ? <span>repeat ×{frame.repeatCount}</span> : null}
        </div>
      ) : null}

      <p className="field-note">
        No raw-event autoplay. {prefersReducedMotion ? "Reduced-motion preference detected; animation defaults off and step controls remain available." : "Animation is opt-in per run."}
      </p>
    </section>
  );
}
