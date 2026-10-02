import { useMemo, useState } from "react";
import type { RunRecord } from "../../uiTypes";
import { Assumptions } from "../explore/ResultEvidence";
import { buildMetricRows } from "../explore/metricRows";

function RunSummary({ run }: { run: RunRecord }) {
  return (
    <div className="config-summary">
      <strong>{run.label}</strong>
      <span>{run.spec.policy.allocation}</span>
      <span>{run.spec.tasks.length} tasks</span>
      <span>{run.spec.resources.length} pools</span>
    </div>
  );
}

export function CompareView({ runs }: { runs: RunRecord[] }) {
  const [leftId, setLeftId] = useState(runs.at(-2)?.id ?? runs[0]?.id ?? "");
  const [rightId, setRightId] = useState(runs.at(-1)?.id ?? runs[0]?.id ?? "");

  const left = runs.find((run) => run.id === leftId) ?? runs[0];
  const right = runs.find((run) => run.id === rightId) ?? runs.at(-1);

  const comparison = useMemo(() => {
    if (!left || !right) return null;
    const leftRows = buildMetricRows(left.spec, left.result);
    const rightRows = buildMetricRows(right.spec, right.result);
    const leftByKey = new Map(leftRows.map((row) => [row.key, row]));
    const rightByKey = new Map(rightRows.map((row) => [row.key, row]));
    const keys = [...new Set([...leftRows.map((row) => row.key), ...rightRows.map((row) => row.key)])];
    return { leftByKey, rightByKey, keys };
  }, [left, right]);

  if (!left || !right || !comparison) {
    return (
      <section className="empty-state">
        <p className="section-kicker">No run history</p>
        <h2>Simulate at least one workflow first.</h2>
        <p>Compare operates on saved config/result snapshots from real engine runs, not preset estimates.</p>
      </section>
    );
  }

  return (
    <div className="view-stack">
      <div className="view-heading">
        <div>
          <p className="section-kicker">Contrast</p>
          <h2>Compare runs</h2>
          <p>Each column is an explicit WorkflowSpec + SimulationResult snapshot. B − A is presentation-only.</p>
        </div>
      </div>

      <section className="surface compare-controls" aria-label="Comparison run selectors">
        <label>
          <span>Run A</span>
          <select value={left.id} onChange={(event) => setLeftId(event.target.value)}>
            {runs.map((run) => <option value={run.id} key={run.id}>{run.label}</option>)}
          </select>
        </label>
        <label>
          <span>Run B</span>
          <select value={right.id} onChange={(event) => setRightId(event.target.value)}>
            {runs.map((run) => <option value={run.id} key={run.id}>{run.label}</option>)}
          </select>
        </label>
      </section>

      <div className="two-up">
        <section className="surface"><p className="section-kicker">A</p><RunSummary run={left} /></section>
        <section className="surface"><p className="section-kicker">B</p><RunSummary run={right} /></section>
      </div>

      <section className="surface compare-table-wrap" aria-labelledby="compare-metrics-heading">
        <div className="surface-heading">
          <div><p className="section-kicker">Authoritative outputs</p><h2 id="compare-metrics-heading">Metric comparison</h2></div>
        </div>
        <div className="compare-table" role="table">
          <div className="compare-row compare-header" role="row">
            <strong role="columnheader">Metric</strong>
            <strong role="columnheader">A</strong>
            <strong role="columnheader">B</strong>
            <strong role="columnheader">B − A</strong>
          </div>
          {comparison.keys.map((key) => {
            const a = comparison.leftByKey.get(key);
            const b = comparison.rightByKey.get(key);
            const delta = a && b ? b.value - a.value : undefined;
            const formatter = a?.formatValue ?? b?.formatValue;
            return (
              <div className="compare-row" role="row" key={key}>
                <span role="cell">{a?.label ?? b?.label ?? key}</span>
                <strong role="cell">{a?.formatted ?? "—"}</strong>
                <strong role="cell">{b?.formatted ?? "—"}</strong>
                <span role="cell">{delta === undefined || !formatter ? "—" : (delta > 0 ? "+" : "") + formatter(delta)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="two-up">
        <Assumptions result={left.result} />
        <Assumptions result={right.result} />
      </div>
    </div>
  );
}
