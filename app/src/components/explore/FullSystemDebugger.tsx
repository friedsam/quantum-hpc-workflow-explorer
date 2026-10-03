import type { WorkflowSpec } from "../../domain/types";
import type { SystemStateSnapshot } from "../../causal/systemState.mjs";

interface Props {
  spec: WorkflowSpec;
  snapshot: SystemStateSnapshot;
}

function allPools(snapshot: SystemStateSnapshot) {
  return [
    ...Object.values(snapshot.resources.classicalByPool),
    ...Object.values(snapshot.resources.qpuByPool)
  ];
}

export function FullSystemDebugger({ spec, snapshot }: Props) {
  const pools = allPools(snapshot);
  const rowHeight = 58;
  const width = 920;
  const labelWidth = 150;
  const barWidth = 700;
  const height = 34 + pools.length * rowHeight;

  return (
    <section className="surface debugger-board" aria-labelledby="system-debugger-heading">
      <div className="surface-heading">
        <div>
          <p className="section-kicker">Full-system debugger</p>
          <h2 id="system-debugger-heading">Exact capacity + causal explanation</h2>
        </div>
        <span className="muted-label">t={snapshot.simTimeS.toFixed(2)} s · no blocked-rank inference</span>
      </div>

      <div className="debugger-grid">
        <div>
          <h3 className="debugger-subheading">Capacity plane · exact resource units</h3>
          <div className="runtime-svg-wrap">
            <svg
              className="debugger-capacity-svg"
              viewBox={"0 0 " + width + " " + height}
              role="img"
              aria-labelledby="capacity-title capacity-desc"
            >
              <title id="capacity-title">Exact resource capacity at {snapshot.simTimeS.toFixed(2)} seconds</title>
              <desc id="capacity-desc">Each pool is partitioned into active, allocated-idle and released resource units. Causal task waits are not included in these bars.</desc>
              <defs>
                <pattern id="idle-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="8" height="8" className="capacity-idle-bg" />
                  <line x1="0" y1="0" x2="0" y2="8" className="capacity-idle-line" />
                </pattern>
                <pattern id="released-dots" width="8" height="8" patternUnits="userSpaceOnUse">
                  <rect width="8" height="8" className="capacity-released-bg" />
                  <circle cx="2" cy="2" r="1" className="capacity-released-dot" />
                </pattern>
              </defs>

              {pools.map((pool, index) => {
                const y = 18 + index * rowHeight;
                const scale = pool.capacity > 0 ? barWidth / pool.capacity : 0;
                const activeW = pool.activeUnits * scale;
                const idleW = pool.allocatedIdleUnits * scale;
                const releasedW = pool.releasedUnits * scale;
                return (
                  <g key={pool.resourcePoolId} id={"capacity-" + pool.resourcePoolId}>
                    <text x="10" y={y + 17} className="capacity-pool-label">
                      {pool.resourcePoolId} · {pool.kind.toUpperCase()}
                    </text>
                    <rect x={labelWidth} y={y} width={barWidth} height="24" rx="5" className="capacity-outline" />
                    {activeW > 0 ? <rect x={labelWidth} y={y} width={activeW} height="24" rx="4" className="capacity-active" /> : null}
                    {idleW > 0 ? <rect x={labelWidth + activeW} y={y} width={idleW} height="24" fill="url(#idle-hatch)" /> : null}
                    {releasedW > 0 ? <rect x={labelWidth + activeW + idleW} y={y} width={releasedW} height="24" fill="url(#released-dots)" /> : null}
                    <text x={labelWidth} y={y + 43} className="capacity-detail">
                      active {pool.activeUnits} · allocated-idle {pool.allocatedIdleUnits} · released {pool.releasedUnits} · capacity {pool.capacity}
                    </text>
                    <text x={labelWidth + barWidth} y={y + 43} textAnchor="end" className="capacity-detail">
                      queue {pool.queueDepth}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="capacity-legend" aria-label="Resource capacity legend">
            <span><i className="capacity-key active" />active</span>
            <span><i className="capacity-key idle" />allocated-idle</span>
            <span><i className="capacity-key released" />released</span>
          </div>
        </div>

        <div>
          <h3 className="debugger-subheading">Causality plane · tasks/dependencies</h3>
          <div className="causal-card-list">
            {snapshot.causal.activeCommunications.map((communication) => (
              <article className="causal-card communication" key={communication.dependencyId}>
                <div><strong>Active communication</strong><span className="evidence-chip">engine</span></div>
                <p>{communication.sourceTaskId} → {communication.targetTaskId}</p>
                <small>{communication.dependencyId} · transfer dependency</small>
              </article>
            ))}

            {snapshot.causal.policyHeldQuantumTasks.map((task) => (
              <article className="causal-card policy" key={task.taskId}>
                <div><strong>Policy held</strong><span className="evidence-chip derived">derived</span></div>
                <p>{task.taskId} · {task.qpuDemandUnits} QPU-demand unit{task.qpuDemandUnits === 1 ? "" : "s"}</p>
                <small>maxInFlightQuantumByPool · task count is not CPU/rank count</small>
              </article>
            ))}

            {snapshot.causal.dependencyGatedClassical.map((gate) => (
              <article className={gate.explanation === "collective-synchronization" ? "causal-card join" : "causal-card gate"} key={gate.taskId}>
                <div>
                  <strong>{gate.explanation === "collective-synchronization" ? "Collective synchronization wait" : "Dependency gate"}</strong>
                  <span className={gate.evidence === "conditional" ? "evidence-chip conditional" : "evidence-chip derived"}>{gate.evidence}</span>
                </div>
                <p>{gate.taskId} · task demand {gate.classicalDemandUnits} classical unit{gate.classicalDemandUnits === 1 ? "" : "s"}</p>
                <small>
                  {gate.unresolved.map((entry) => entry.sourceTaskId + ": " + entry.directState).join(" · ")}
                  {gate.structuralJoin ? " · multi-input join" : ""}
                </small>
              </article>
            ))}

            {!snapshot.causal.activeCommunications.length &&
             !snapshot.causal.policyHeldQuantumTasks.length &&
             !snapshot.causal.dependencyGatedClassical.length ? (
              <div className="causal-empty">No active communication, policy hold, or immediate classical dependency gate at this cursor.</div>
            ) : null}
          </div>
        </div>
      </div>

      <p className="field-note">
        Resource units remain an exact partition. Causal cards describe task/dependency facts and are never added to capacity totals.
        {spec.tasks.some((task) => Array.isArray(task.metadata?.actorGroupIds))
          ? " Actor-group IDs are retained as provenance hooks but are not interpreted as persistent rank ownership."
          : ""}
      </p>
    </section>
  );
}
