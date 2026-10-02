import type { SimulationResult } from "../../domain/types";

export function QueueEvidence({ result }: { result: SimulationResult }) {
  return (
    <section className="surface" aria-labelledby="queue-heading">
      <div className="surface-heading compact">
        <div>
          <p className="section-kicker">Resource queue</p>
          <h2 id="queue-heading">Queue samples</h2>
        </div>
      </div>
      <div className="queue-table" role="table" aria-label="Queue samples">
        {result.queueSeries.map((sample, index) => (
          <div className="queue-row" role="row" key={sample.resourcePoolId + sample.simTimeS + index}>
            <span role="cell">{sample.simTimeS.toFixed(2)} s</span>
            <span role="cell">{sample.resourcePoolId}</span>
            <strong role="cell">depth {sample.depth}</strong>
          </div>
        ))}
      </div>
      <p className="field-note">Queue depth includes resource-queued tasks only; policy-held ready tasks are not inferred into this series.</p>
    </section>
  );
}

export function Assumptions({ result }: { result: SimulationResult }) {
  return (
    <section className="surface assumptions" aria-labelledby="assumptions-heading">
      <div className="surface-heading compact">
        <div>
          <p className="section-kicker">Provenance</p>
          <h2 id="assumptions-heading">Assumptions</h2>
        </div>
      </div>
      {result.assumptions.length ? (
        <ul>{result.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul>
      ) : (
        <p className="field-note">No assumptions were attached to this run.</p>
      )}
    </section>
  );
}
