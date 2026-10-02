import type { SimulationResult } from "../../contracts";

export function QueueEvidence({ result }: { result: SimulationResult }) {
  return (
    <section className="surface" aria-labelledby="queue-heading">
      <div className="surface-heading compact">
        <div>
          <p className="section-kicker">Queue evidence</p>
          <h2 id="queue-heading">Returned samples</h2>
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
      <ul>{result.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul>
    </section>
  );
}
