import type { SimulationResult, WorkflowSpec } from "../../contracts";

export function TaskTimeline({ spec, result }: { spec: WorkflowSpec; result: SimulationResult }) {
  const makespan = Math.max(result.metrics.makespanS, 0.000001);
  const taskLabels = new Map(spec.tasks.map((task) => [task.id, task.label]));
  const states = new Set<string>(result.taskIntervals.map((interval) => interval.state));

  return (
    <section className="surface" aria-labelledby="timeline-heading">
      <div className="surface-heading">
        <div>
          <p className="section-kicker">Trace view</p>
          <h2 id="timeline-heading">Task timeline</h2>
        </div>
        <span className="muted-label">half-open interval rendering once v1 is frozen</span>
      </div>

      <div className="resource-legend" aria-label="Task state legend">
        {states.has("ready") ? <span><i className="legend-swatch ready" />ready / policy wait</span> : null}
        {states.has("queued") ? <span><i className="legend-swatch queued" />resource queued</span> : null}
        {states.has("running") ? <span><i className="legend-swatch running" />running</span> : null}
        {states.has("waiting") ? <span><i className="legend-swatch waiting" />v0 waiting</span> : null}
      </div>

      <div className="timeline-scale" aria-hidden="true"><span>0 s</span><span>{makespan.toFixed(2)} s</span></div>
      <div className="timeline-list">
        {result.taskIntervals.map((interval, index) => {
          const left = (interval.startS / makespan) * 100;
          const width = Math.max(((interval.endS - interval.startS) / makespan) * 100, 1.5);
          return (
            <div className="timeline-row" key={interval.taskId + interval.state + index}>
              <div className="timeline-label">
                <strong>{taskLabels.get(interval.taskId) ?? interval.taskId}</strong>
                <span>{interval.state} · {interval.startS.toFixed(2)}–{interval.endS.toFixed(2)} s</span>
              </div>
              <div className="timeline-track">
                <div className={"timeline-bar " + interval.state} style={{ left: left + "%", width: width + "%" }}>
                  <span>{interval.state}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
