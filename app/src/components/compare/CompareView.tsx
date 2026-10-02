import { useState } from "react";
import { fixtures, getFixture, type FixturePair } from "../../contracts";
import { Assumptions } from "../explore/ResultEvidence";
import { buildMetricRows } from "../explore/metricRows";

function ConfigSummary({ fixture }: { fixture: FixturePair }) {
  return (
    <div className="config-summary">
      <strong>{fixture.spec.name}</strong>
      <span>{fixture.spec.policy.allocation}</span>
      <span>in-flight Q: {fixture.spec.policy.maxInFlightQuantum ?? "—"}</span>
      <span>batch: {fixture.spec.policy.batching ?? "—"}</span>
    </div>
  );
}

export function CompareView() {
  const [leftKey, setLeftKey] = useState(fixtures[0].key);
  const [rightKey, setRightKey] = useState(fixtures[1]?.key ?? fixtures[0].key);
  const left = getFixture(leftKey);
  const right = getFixture(rightKey);

  const leftRows = buildMetricRows(left.spec, left.result);
  const rightRows = buildMetricRows(right.spec, right.result);
  const leftByKey = new Map(leftRows.map((row) => [row.key, row]));
  const rightByKey = new Map(rightRows.map((row) => [row.key, row]));
  const keys = [...new Set([...leftRows.map((row) => row.key), ...rightRows.map((row) => row.key])];

  return (
    <div className="view-stack">
      <div className="view-heading">
        <div>
          <p className="section-kicker">Contrast</p>
          <h2>Compare configurations</h2>
          <p>Values come from each attached result. The delta is B minus A and is not an automatic ranking.</p>
        </div>
      </div>

      <section className="surface compare-controls" aria-label="Comparison configuration selectors">
        <label>
          <span>Configuration A</span>
          <select value={leftKey} onChange={(event) => setLeftKey(event.target.value)}>
            {fixtures.map((fixture) => <option value={fixture.key} key={fixture.key}>{fixture.label}</option>)}
          </select>
        </label>
        <label>
          <span>Configuration B</span>
          <select value={rightKey} onChange={(event) => setRightKey(event.target.value)}>
            {fixtures.map((fixture) => <option value={fixture.key} key={fixture.key}>{fixture.label}</option>)}
          </select>
        </label>
      </section>

      <div className="two-up">
        <section className="surface"><p className="section-kicker">A</p><ConfigSummary fixture={left} /><p>{left.description}</p></section>
        <section className="surface"><p className="section-kicker">B</p><ConfigSummary fixture={right} /><p>{right.description}</p></section>
      </div>

      <section className="surface compare-table-wrap" aria-labelledby="compare-metrics-heading">
        <div className="surface-heading">
          <div>
            <p className="section-kicker">Authoritative outputs</p>
            <h2 id="compare-metrics-heading">Metric comparison</h2>
          </div>
        </div>
        <div className="compare-table" role="table">
          <div className="compare-row compare-header" role="row">
            <strong role="columnheader">Metric</strong>
            <strong role="columnheader">A</strong>
            <strong role="columnheader">B</strong>
            <strong role="columnheader">B − A</strong>
          </div>
          {keys.map((key) => {
            const a = leftByKey.get(key);
            const b = rightByKey.get(key);
            const delta = a && b ? b.value - a.value : undefined;
            return (
              <div className="compare-row" role="row" key={key}>
                <span role="cell">{a?.label ?? b?.label ?? key}</span>
                <strong role="cell">{a?.formatted ?? "—"}</strong>
                <strong role="cell">{b?.formatted ?? "—"}</strong>
                <span role="cell">{delta === undefined ? "—" : (delta > 0 ? "+" : "") + delta.toFixed(3)}</span>
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
