import { useEffect, useState } from "react";
import type { SimulationResult } from "../../domain/types";
import type { ReturnTypeOfExplorerPlayback } from "./playbackTypes";

interface Props {
  result: SimulationResult;
  cursorTimeS: number;
  onTimeChange: (time: number) => void;
  playback: ReturnTypeOfExplorerPlayback;
}

export function SimplePlaybackBar({
  result,
  cursorTimeS,
  onTimeChange,
  playback
}: Props) {
  const [draftTime, setDraftTime] = useState(cursorTimeS.toFixed(2));

  useEffect(() => {
    setDraftTime(cursorTimeS.toFixed(2));
  }, [cursorTimeS]);

  function commitTime() {
    const value = Number(draftTime);
    if (!draftTime.trim() || !Number.isFinite(value)) {
      setDraftTime(cursorTimeS.toFixed(2));
      return;
    }
    const nextTime = Math.max(0, Math.min(result.metrics.makespanS, value));
    setDraftTime(nextTime.toFixed(2));
    onTimeChange(nextTime);
  }

  return (
    <section className="surface simple-playback" aria-label="Simulation playback">
      <div className="simple-playback-controls">
        <button
          className="secondary-action"
          type="button"
          onClick={playback.stepBackward}
          disabled={playback.state.index <= 0}
        >
          Previous
        </button>
        <button
          className="primary-action"
          type="button"
          onClick={playback.togglePlay}
          disabled={!playback.animationEnabled || !playback.keyframes.length}
        >
          {playback.state.playing ? "Pause" : "Play"}
        </button>
        <button
          className="secondary-action"
          type="button"
          onClick={playback.stepForward}
          disabled={
            playback.state.index < 0 ||
            playback.state.index >= playback.keyframes.length - 1
          }
        >
          Next
        </button>
      </div>

      <div className="simple-time-rail">
        <strong>{cursorTimeS.toFixed(2)} s</strong>
        <input
          aria-label="Simulation time"
          type="range"
          min="0"
          max={result.metrics.makespanS}
          step={Math.max(result.metrics.makespanS / 200, 0.01)}
          value={cursorTimeS}
          onChange={(event) => onTimeChange(Number(event.target.value))}
        />
        <span>{result.metrics.makespanS.toFixed(2)} s</span>
        <label className="simple-time-entry">
          Go to (s)
          <input
            type="number"
            min="0"
            max={result.metrics.makespanS}
            step="0.01"
            inputMode="decimal"
            aria-label="Go to exact simulation time in seconds"
            value={draftTime}
            onChange={(event) => setDraftTime(event.target.value)}
            onBlur={commitTime}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
          />
        </label>
      </div>

      <p className="simple-playback-label">
        {playback.frame?.label ?? "No semantic playback frame"}
      </p>
    </section>
  );
}
