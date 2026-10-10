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
      </div>

      <p className="simple-playback-label">
        {playback.frame?.label ?? "No semantic playback frame"}
      </p>
    </section>
  );
}
