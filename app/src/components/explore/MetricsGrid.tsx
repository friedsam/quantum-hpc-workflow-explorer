import type { SimulationResult, WorkflowSpec } from "../../domain/types";
import { buildMetricRows } from "./metricRows";

export function MetricsGrid({ spec, result }: { spec: WorkflowSpec; result: SimulationResult }) {
  const rows = buildMetricRows(spec, result);

  return (
    <section className="surface" aria-labelledby="metrics-heading">
      <div className="surface-heading">
        <div>
          <p className="section-kicker">Authoritative output</p>
          <h2 id="metrics-heading">Metrics</h2>
        </div>
        <span className="muted-label">direct frozen-v1 SimulationResult values</span>
      </div>
      <div className="metric-grid">
        {rows.map((row) => (
          <div className="metric-card" key={row.key}>
            <span>{row.label}</span>
            <strong>{row.formatted}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
