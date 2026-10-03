import type { PointerEvent } from "react";
import type { SimulationResult, WorkflowSpec } from "../../domain/types";
import { deriveSystemStateSnapshot } from "../../causal/systemState.mjs";

interface Props {
  spec: WorkflowSpec;
  result: SimulationResult;
  simTimeS: number;
  onTimeChange: (time: number) => void;
}

interface Segment {
  start: number;
  end: number;
  active: number;
  idle: number;
  released: number;
}

function boundariesForPool(result: SimulationResult, poolId: string): number[] {
  return [...new Set([
    0,
    result.metrics.makespanS,
    ...result.resourceIntervals
      .filter((interval) => interval.resourcePoolId === poolId)
      .flatMap((interval) => [interval.startS, interval.endS])
  ])].sort((a, b) => a - b);
}

function resourceSegments(
  result: SimulationResult,
  poolId: string
): Segment[] {
  const boundaries = boundariesForPool(result, poolId);
  const segments: Segment[] = [];
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const start = boundaries[index];
    const end = boundaries[index + 1];
    if (end <= start) continue;
    const probe = start + (end - start) / 2;
    const intervals = result.resourceIntervals.filter(
      (interval) =>
        interval.resourcePoolId === poolId &&
        interval.startS <= probe &&
        probe < interval.endS
    );
    const sum = (state: "active" | "allocated-idle" | "released") =>
      intervals
        .filter((interval) => interval.state === state)
        .reduce((total, interval) => total + interval.units, 0);
    segments.push({
      start,
      end,
      active: sum("active"),
      idle: sum("allocated-idle"),
      released: sum("released")
    });
  }
  return segments;
}

function queuePoints(
  result: SimulationResult,
  poolId: string,
  makespan: number
): Array<{ time: number; depth: number }> {
  const samples = result.queueSeries.filter((sample) => sample.resourcePoolId === poolId);
  const points: Array<{ time: number; depth: number }> = [];
  let depth = 0;
  for (const sample of samples) {
    points.push({ time: sample.simTimeS, depth });
    depth = sample.depth;
    points.push({ time: sample.simTimeS, depth });
  }
  points.push({ time: makespan, depth });
  return points;
}

function policyHeldPoints(
  spec: WorkflowSpec,
  result: SimulationResult,
  poolId: string
): Array<{ time: number; count: number }> {
  const times = [...new Set([
    0,
    result.metrics.makespanS,
    ...result.events.map((event) => event.simTimeS),
    ...result.taskIntervals.flatMap((interval) => [interval.startS, interval.endS])
  ])].sort((a, b) => a - b);

  return times.map((time) => ({
    time,
    count: deriveSystemStateSnapshot(spec, result, time)
      .causal.policyHeldQuantumTasks
      .filter((task) => task.resourcePoolId === poolId).length
  }));
}

export function AnalyticalStrips({ spec, result, simTimeS, onTimeChange }: Props) {
  const width = 1000;
  const left = 120;
  const right = 24;
  const plotWidth = width - left - right;
  const rowHeight = 44;
  const pools = spec.resources;
  const qpuPools = spec.resources.filter((pool) => pool.kind === "qpu");
  const resourceTop = 42;
  const qpuTop = resourceTop + pools.length * rowHeight + 38;
  const qpuRowsHeight = Math.max(1, qpuPools.length) * 62;
  const costTop = qpuTop + qpuRowsHeight + 34;
  const height = costTop + 58;
  const makespan = Math.max(result.metrics.makespanS, 0.000001);
  const x = (time: number) => left + (time / makespan) * plotWidth;
  const cursorX = x(Math.min(simTimeS, makespan));

  function moveCursor(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const viewX = ((event.clientX - rect.left) / rect.width) * width;
    const ratio = Math.max(0, Math.min(1, (viewX - left) / plotWidth));
    onTimeChange(ratio * result.metrics.makespanS);
  }

  return (
    <section className="surface" aria-labelledby="analytical-strips-heading">
      <div className="surface-heading">
        <div>
          <p className="section-kicker">Linked analytical strips</p>
          <h2 id="analytical-strips-heading">Whole-run evidence</h2>
        </div>
        <span className="muted-label">click strip to move the shared simulation cursor</span>
      </div>

      <div className="runtime-svg-wrap">
        <svg
          className="analytical-strips-svg"
          viewBox={"0 0 " + width + " " + height}
          role="img"
          aria-labelledby="strips-title strips-desc"
          onPointerDown={moveCursor}
        >
          <title id="strips-title">Linked workflow analysis strips with cursor at {simTimeS.toFixed(2)} seconds</title>
          <desc id="strips-desc">Exact resource composition by pool, QPU activity and resource queue, derived policy-held task counts, and a disabled cumulative-cost strip because frozen v1 does not provide a cost time series.</desc>

          <text x="12" y="22" className="strip-section-label">RESOURCE COMPOSITION</text>
          {pools.map((pool, poolIndex) => {
            const y = resourceTop + poolIndex * rowHeight;
            const segments = resourceSegments(result, pool.id);
            return (
              <g key={pool.id}>
                <text x="12" y={y + 18} className="strip-row-label">{pool.id}</text>
                <rect x={left} y={y} width={plotWidth} height="28" rx="4" className="strip-outline" />
                {segments.map((segment, index) => {
                  const sx = x(segment.start);
                  const sw = Math.max(0, x(segment.end) - sx);
                  const capacity = pool.capacity || 1;
                  const activeH = 28 * segment.active / capacity;
                  const idleH = 28 * segment.idle / capacity;
                  const releasedH = 28 * segment.released / capacity;
                  return (
                    <g key={index}>
                      {activeH > 0 ? <rect x={sx} y={y} width={sw} height={activeH} className="strip-active" /> : null}
                      {idleH > 0 ? <rect x={sx} y={y + activeH} width={sw} height={idleH} className="strip-idle" /> : null}
                      {releasedH > 0 ? <rect x={sx} y={y + activeH + idleH} width={sw} height={releasedH} className="strip-released" /> : null}
                    </g>
                  );
                })}
              </g>
            );
          })}

          <text x="12" y={qpuTop - 14} className="strip-section-label">QPU RUN / RESOURCE QUEUE / POLICY HOLD</text>
          {qpuPools.length ? qpuPools.map((pool, index) => {
            const y = qpuTop + index * 62;
            const activeIntervals = result.resourceIntervals.filter(
              (interval) => interval.resourcePoolId === pool.id && interval.state === "active"
            );
            const queues = queuePoints(result, pool.id, makespan);
            const held = policyHeldPoints(spec, result, pool.id);
            const maxQueue = Math.max(1, ...queues.map((point) => point.depth));
            const maxHeld = Math.max(1, ...held.map((point) => point.count));
            const queuePath = queues.map((point, pointIndex) =>
              (pointIndex ? "L" : "M") + x(point.time).toFixed(2) + " " + (y + 45 - 20 * point.depth / maxQueue).toFixed(2)
            ).join(" ");
            const heldPath = held.map((point, pointIndex) =>
              (pointIndex ? "L" : "M") + x(point.time).toFixed(2) + " " + (y + 45 - 20 * point.count / maxHeld).toFixed(2)
            ).join(" ");
            const actualMaxQueue = Math.max(...queues.map((point) => point.depth), 0);
            const actualMaxHeld = Math.max(...held.map((point) => point.count), 0);
            return (
              <g key={pool.id}>
                <text x="12" y={y + 18} className="strip-row-label">{pool.id}</text>
                <rect x={left} y={y} width={plotWidth} height="50" rx="4" className="strip-outline" />
                {activeIntervals.map((interval, intervalIndex) => (
                  <rect
                    key={intervalIndex}
                    x={x(interval.startS)}
                    y={y + 4}
                    width={Math.max(1, x(interval.endS) - x(interval.startS))}
                    height="10"
                    className="strip-qpu-active"
                  />
                ))}
                <path d={queuePath} className="strip-queue-line" />
                <path d={heldPath} className="strip-policy-line" />
                <text x={left + 6} y={y + 47} className="strip-inline-note">
                  queue max {actualMaxQueue} · policy-held max {actualMaxHeld}
                </text>
              </g>
            );
          }) : (
            <text x={left} y={qpuTop + 24} className="strip-inline-note">No QPU pool configured.</text>
          )}

          <text x="12" y={costTop - 12} className="strip-section-label">CUMULATIVE COST</text>
          <rect x={left} y={costTop} width={plotWidth} height="32" rx="4" className="strip-disabled" />
          <text x={left + 12} y={costTop + 21} className="strip-inline-note">
            {"disabled · frozen v1 exposes final total cost only: $" + result.metrics.totalCost.toFixed(4)}
          </text>

          <line x1={cursorX} y1="30" x2={cursorX} y2={costTop + 38} className="strip-cursor" />
          <text x={Math.min(cursorX + 5, width - 70)} y="19" className="strip-cursor-label">{simTimeS.toFixed(2)} s</text>

          <text x={left} y={height - 7} className="strip-axis-label">0 s</text>
          <text x={left + plotWidth} y={height - 7} textAnchor="end" className="strip-axis-label">{result.metrics.makespanS.toFixed(2)} s</text>
        </svg>
      </div>
    </section>
  );
}
