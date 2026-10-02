import type { SimulationResult, WorkflowSpec } from "../../domain/types";

interface Props {
  spec: WorkflowSpec;
  result: SimulationResult;
  simTimeS: number;
}

function queueDepthAt(result: SimulationResult, poolId: string, time: number): number {
  let depth = 0;
  for (const sample of result.queueSeries) {
    if (sample.resourcePoolId === poolId && sample.simTimeS <= time) depth = sample.depth;
  }
  return depth;
}

export function ResourceStateDiagram({ spec, result, simTimeS }: Props) {
  const cardWidth = 210;
  const cardHeight = 126;
  const gap = 26;
  const padding = 24;
  const width = Math.max(520, padding * 2 + spec.resources.length * cardWidth + Math.max(0, spec.resources.length - 1) * gap);
  const height = 182;

  const rows = spec.resources.map((pool) => {
    const current = result.resourceIntervals.filter(
      (interval) => interval.resourcePoolId === pool.id && interval.startS <= simTimeS && simTimeS < interval.endS
    );
    const active = current.filter((interval) => interval.state === "active").reduce((sum, interval) => sum + interval.units, 0);
    const idle = current.filter((interval) => interval.state === "allocated-idle").reduce((sum, interval) => sum + interval.units, 0);
    const released = current.filter((interval) => interval.state === "released").reduce((sum, interval) => sum + interval.units, 0);
    return { pool, active, idle, released, queue: queueDepthAt(result, pool.id, simTimeS) };
  });

  return (
    <section className="surface" aria-labelledby="runtime-state-heading">
      <div className="surface-heading">
        <div>
          <p className="section-kicker">Runtime state</p>
          <h2 id="runtime-state-heading">Resource snapshot</h2>
        </div>
        <span className="muted-label">explicit intervals + queue samples at t={simTimeS.toFixed(2)} s</span>
      </div>

      <div className="runtime-svg-wrap">
        <svg
          className="runtime-state-svg"
          viewBox={"0 0 " + width + " " + height}
          role="img"
          aria-labelledby="runtime-svg-title runtime-svg-desc"
        >
          <title id="runtime-svg-title">Resource state at {simTimeS.toFixed(2)} seconds</title>
          <desc id="runtime-svg-desc">Stable resource cards showing active, allocated-idle, released units and explicit resource queue depth.</desc>
          {rows.map(({ pool, active, idle, released, queue }, index) => {
            const x = padding + index * (cardWidth + gap);
            const y = 28;
            const dominant = active > 0 ? "active" : idle > 0 ? "allocated-idle" : "released";
            return (
              <g key={pool.id} id={"resource-" + pool.id} transform={"translate(" + x + " " + y + ")"} className={"runtime-card " + dominant}>
                <rect width={cardWidth} height={cardHeight} rx="12" />
                <text x="16" y="26" className="runtime-card-title">{pool.id}</text>
                <text x={cardWidth - 16} y="26" textAnchor="end" className="runtime-card-kind">{pool.kind.toUpperCase()}</text>
                <line x1="16" y1="38" x2={cardWidth - 16} y2="38" />
                <text x="16" y="60">active {active} / {pool.capacity}</text>
                <text x="16" y="81">allocated-idle {idle}</text>
                <text x="16" y="102">released {released}</text>
                <text x={cardWidth - 16} y="102" textAnchor="end">queue {queue}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="resource-state-table" role="table" aria-label="Accessible resource state equivalent">
        {rows.map(({ pool, active, idle, released, queue }) => (
          <div className="resource-state-row" role="row" key={pool.id}>
            <strong role="cell">{pool.id}</strong>
            <span role="cell">{pool.kind}</span>
            <span role="cell">active {active}</span>
            <span role="cell">idle {idle}</span>
            <span role="cell">released {released}</span>
            <span role="cell">queue {queue}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
