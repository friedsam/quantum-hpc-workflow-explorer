import type { SimulationResult } from "../../contracts";

export function ResourceTimeline({ result }: { result: SimulationResult }) {
  const makespan = Math.max(result.metrics.makespanS, 0.000001);

  return (
    <section className="surface" aria-labelledby="resource-timeline-heading">
      <div className="surface-heading">
        <div>
          <p className="section-kicker">Resource state</p>
          <h2 id="resource-timeline-heading">Allocation timeline</h2>
        </div>
        <span className="muted-label">direct ResourceInterval states</span>
      </div>
      <div className="resource-legend" aria-label="Resource state legend">
        <span><i className="legend-swatch active" />active</span>
        <span><i className="legend-swatch allocated-idle" />allocated-idle</span>
        <span><i className="legend-swatch released" />released</span>
      </div>
      <div className="timeline-list">
        {result.resourceIntervals.map((interval, index) => {
          const left = (interval.startS / makespan) * 100;
          const width = Math.max(((interval.endS - interval.startS) / makespan) * 100, 1.5);
          return (
            <div className="timeline-row" key={interval.resourcePoolId + interval.state + index}>
              <div className="timeline-label">
                <strong>{interval.resourcePoolId} · {interval.units} unit{interval.units === 1 ? "" : "s"}</strong>
                <span>{interval.state} · {interval.startS.toFixed(2)}–{interval.endS.toFixed(2)} s</span>
              </div>
              <div className="timeline-track">
                <div className={"timeline-bar resource " + interval.state} style={{ left: left + "%", width: width + "%" }}>
                  <span>{interval.state}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="field-note">Policy-held wait is never inferred from resource intervals.</p>
    </section>
  );
}
