import type { WorkflowDesignBundle } from "../../design/bundle";
import type { CompilationManifest } from "../../design/types";
import type { WorkflowSpec } from "../../domain/types";
import type {
  ActorAwareSystemStateSnapshot
} from "../../playback/actor-aware-view.mjs";
import {
  deriveGenericProgress,
  deriveQpuSummary,
  globalSynchronizationIsActive,
  hasGlobalSynchronizationSemantics
} from "./simpleState.mjs";

function compactTaskIds(ids: readonly string[]): string {
  if (ids.length === 0) return "—";
  const visible = ids.slice(0, 3);
  return (
    visible.join(", ") +
    (ids.length > visible.length
      ? " · +" + (ids.length - visible.length) + " more"
      : "")
  );
}

interface Props {
  bundle: WorkflowDesignBundle | null;
  manifest: CompilationManifest | null;
  spec: WorkflowSpec;
  snapshot: ActorAwareSystemStateSnapshot;
}

function plainStateSentence(
  bundle: WorkflowDesignBundle | null,
  manifest: CompilationManifest | null,
  spec: WorkflowSpec,
  snapshot: ActorAwareSystemStateSnapshot
): string {
  const actorGroup = snapshot.actors.groups[0];

  if (actorGroup) {
    const sync = globalSynchronizationIsActive(snapshot.actors);
    if (sync) {
      return (
        "Synchronization wall — " +
        actorGroup.blocked +
        " / " +
        actorGroup.count +
        " " +
        actorGroup.label.toLowerCase() +
        " blocked while the required result set completes."
      );
    }
    if (actorGroup.working > 0) {
      return (
        actorGroup.working +
        " / " +
        actorGroup.count +
        " " +
        actorGroup.label.toLowerCase() +
        " working."
      );
    }
    if (actorGroup.blocked > 0) {
      return (
        actorGroup.blocked +
        " / " +
        actorGroup.count +
        " " +
        actorGroup.label.toLowerCase() +
        " blocked on authored waits."
      );
    }
    return "Authored actors are idle at this simulation time.";
  }

  if (snapshot.causal.activeCommunications.length > 0) {
    const count = snapshot.causal.activeCommunications.length;
    return (
      "Data movement / communication active — " +
      count +
      " dependency transfer" +
      (count === 1 ? "" : "s") +
      " in flight."
    );
  }

  if (bundle && manifest) {
    const progress = deriveGenericProgress(
      bundle.design,
      manifest,
      spec,
      snapshot
    );
    if (progress.policyHeld > 0 || progress.qpuQueued > 0) {
      return (
        "Asynchronous pipeline — QPU demand is ahead of service capacity; " +
        "resource queue and policy hold remain distinct."
      );
    }
    if (progress.runningContinuations > 0) {
      return "Completed quantum results are releasing local classical continuation.";
    }
    if (progress.qpuRunning > 0) {
      return "Quantum work is running while independent workflow paths continue.";
    }
  }

  const running = Object.values(snapshot.dag.taskStateById).filter(
    (state) => state === "running"
  ).length;
  return running > 0
    ? running +
        " workflow task instance" +
        (running === 1 ? "" : "s") +
        " running."
    : "No workflow task instance is running at this simulation time.";
}

function ActorCard({
  group
}: {
  group: ActorAwareSystemStateSnapshot["actors"]["groups"][number];
}) {
  const overlap =
    Object.values(group.blockedReasonCounts).reduce(
      (sum, count) => sum + count,
      0
    ) > group.blocked;

  return (
    <article className="actor-state-card">
      <div className="actor-state-heading">
        <div>
          <strong>{group.label}</strong>
          <span>{group.count} actors{group.kind ? " · " + group.kind : ""}</span>
        </div>
        <span className="evidence-chip derived">authored + derived</span>
      </div>

      <div className="actor-state-counts">
        <div className="actor-count working">
          <strong>{group.working}</strong>
          <span>Working</span>
        </div>
        <div className="actor-count blocked">
          <strong>{group.blocked}</strong>
          <span>Blocked</span>
        </div>
        <div className="actor-count idle">
          <strong>{group.idle}</strong>
          <span>Idle</span>
        </div>
      </div>

      <div
        className="actor-state-bar"
        aria-label={
          group.working +
          " working, " +
          group.blocked +
          " blocked, " +
          group.idle +
          " idle"
        }
      >
        <span
          className="working"
          style={{ width: (group.working / group.count) * 100 + "%" }}
        />
        <span
          className="blocked"
          style={{ width: (group.blocked / group.count) * 100 + "%" }}
        />
        <span
          className="idle"
          style={{ width: (group.idle / group.count) * 100 + "%" }}
        />
      </div>

      {Object.keys(group.blockedReasonCounts).length ? (
        <div className="actor-reasons">
          {Object.entries(group.blockedReasonCounts).map(([reason, count]) => (
            <span key={reason}>
              {reason.replace(/-/g, " ")} · {count}
            </span>
          ))}
        </div>
      ) : null}

      {overlap ? (
        <small className="actor-overlap-note">
          Blocked reason counts overlap; one actor may carry multiple reasons.
        </small>
      ) : null}
    </article>
  );
}

export function SimpleExplorerSummary({
  bundle,
  manifest,
  spec,
  snapshot
}: Props) {
  const qpu = deriveQpuSummary(spec, snapshot);
  const actorAware = snapshot.actors.mode === "actor-aware";
  const progress =
    !actorAware && bundle && manifest
      ? deriveGenericProgress(bundle.design, manifest, spec, snapshot)
      : null;
  const supportsSync =
    bundle ? hasGlobalSynchronizationSemantics(bundle.design) : false;
  const syncActive = globalSynchronizationIsActive(snapshot.actors);

  return (
    <>
      <section className="surface now-banner" aria-labelledby="now-heading">
        <p className="section-kicker">What is happening now?</p>
        <h2 id="now-heading">
          {plainStateSentence(bundle, manifest, spec, snapshot)}
        </h2>
        <span className="muted-label">
          simulation time {snapshot.simTimeS.toFixed(2)} s
        </span>
      </section>

      <div className="simple-state-grid">
        <section className="surface" aria-labelledby="actor-progress-heading">
          <div className="surface-heading compact">
            <div>
              <p className="section-kicker">
                {actorAware ? "Persistent actors" : "Workflow progress"}
              </p>
              <h2 id="actor-progress-heading">
                {actorAware ? "Working / Blocked / Idle" : "Path / system progress"}
              </h2>
            </div>
          </div>

          {actorAware ? (
            <div className="actor-card-list">
              {snapshot.actors.groups.map((group) => (
                <ActorCard key={group.actorGroupId} group={group} />
              ))}
            </div>
          ) : progress ? (
            <div className="generic-progress-grid">
              <div><strong>{progress.completeContinuations}</strong><span>continuations complete</span></div>
              <div><strong>{progress.runningContinuations}</strong><span>classical resumed</span></div>
              <div><strong>{progress.qpuRunning}</strong><span>QPU running</span></div>
              <div><strong>{progress.qpuQueued}</strong><span>resource queued</span></div>
              <div><strong>{progress.policyHeld}</strong><span>policy held</span></div>
            </div>
          ) : (
            <p className="field-note">
              No authored actor model. Default view does not invent actor/rank
              Working / Blocked / Idle counts.
            </p>
          )}
        </section>

        <section className="surface qpu-summary" aria-labelledby="qpu-summary-heading">
          <div className="surface-heading compact">
            <div>
              <p className="section-kicker">Quantum bottleneck</p>
              <h2 id="qpu-summary-heading">QPU state</h2>
            </div>
            <span className="status-chip">capacity {qpu.capacity}</span>
          </div>

          <div className="qpu-state-grid">
            <div>
              <strong>{qpu.running.length}</strong>
              <span>running</span>
              <small>{compactTaskIds(qpu.running)}</small>
            </div>
            <div>
              <strong>{qpu.queued.length}</strong>
              <span>resource queued</span>
              <small>{compactTaskIds(qpu.queued)}</small>
            </div>
            <div>
              <strong>{qpu.policyHeld.length}</strong>
              <span>policy held</span>
              <small>{compactTaskIds(qpu.policyHeld)}</small>
            </div>
          </div>

          <div
            className={
              syncActive
                ? "sync-callout active"
                : "sync-callout"
            }
          >
            {syncActive
              ? "GLOBAL SYNCHRONIZATION ACTIVE"
              : supportsSync
                ? "Global synchronization not active at this cursor"
                : bundle?.design.metadata?.synchronization === "none"
                  ? "NO GLOBAL SYNCHRONIZATION"
                  : "No authored global synchronization claim"}
          </div>
        </section>
      </div>
    </>
  );
}
