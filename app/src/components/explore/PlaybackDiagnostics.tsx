import type { ReturnTypeOfExplorerPlayback } from "./playbackTypes";

export function PlaybackDiagnostics({
  playback
}: {
  playback: ReturnTypeOfExplorerPlayback;
}) {
  const frame = playback.frame;

  return (
    <section className="surface playback-panel" aria-labelledby="playback-diagnostics-heading">
      <div className="surface-heading">
        <div>
          <p className="section-kicker">Playback diagnostics</p>
          <h2 id="playback-diagnostics-heading">
            {frame?.label ?? "No keyframe"}
          </h2>
        </div>
        <span className={frame?.kind === "compressed" ? "status-chip stale" : "status-chip ok"}>
          {frame?.kind ?? "empty"}
        </span>
      </div>

      <div className="playback-controls">
        <button className="secondary-action" type="button" onClick={playback.restart}>
          Restart
        </button>
        <label className="speed-control">
          <span>Speed</span>
          <select
            value={playback.state.speed}
            onChange={(event) => playback.setSpeed(Number(event.target.value))}
          >
            <option value="0.5">0.5×</option>
            <option value="1">1×</option>
            <option value="2">2×</option>
          </select>
        </label>
        <label className="animation-toggle">
          <input
            type="checkbox"
            checked={playback.animationEnabled}
            onChange={(event) =>
              playback.setAnimationEnabled(event.target.checked)
            }
          />
          <span>Animate transitions</span>
        </label>
      </div>

      <div className="playback-progress">
        <div>
          <strong>{playback.state.index >= 0 ? playback.state.index + 1 : 0}</strong>
          <span> / {playback.keyframes.length} keyframes</span>
        </div>
        <progress
          max={Math.max(playback.totalPresentationMs, 1)}
          value={playback.state.presentationTimeMs}
        />
        <span>
          {(playback.state.presentationTimeMs / 1000).toFixed(1)} /{" "}
          {(playback.totalPresentationMs / 1000).toFixed(1)} s presentation
        </span>
      </div>

      {frame ? (
        <div className="playback-provenance">
          <span>
            simulation {frame.simTimeRangeS[0].toFixed(2)}–
            {frame.simTimeRangeS[1].toFixed(2)} s
          </span>
          <span>
            events seq {frame.sourceEventSeqRange[0]}–
            {frame.sourceEventSeqRange[1]}
          </span>
          {frame.kind === "compressed" ? (
            <span>repeat ×{frame.repeatCount}</span>
          ) : null}
          <span>{frame.actors.mode}</span>
        </div>
      ) : null}

      <p className="field-note">
        Source-event/keyframe provenance is diagnostic detail.{" "}
        {playback.prefersReducedMotion
          ? "Reduced-motion preference detected; animation defaults off."
          : "No autoplay on page load."}
      </p>
    </section>
  );
}
