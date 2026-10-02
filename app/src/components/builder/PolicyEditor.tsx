import type { WorkflowSpec } from "../../contracts";

interface Props {
  spec: WorkflowSpec;
  onUpdate: (patch: Partial<WorkflowSpec["policy"]>) => void;
}

export function PolicyEditor({ spec, onUpdate }: Props) {
  return (
    <section className="surface inspector-surface" aria-labelledby="policy-heading">
      <div className="surface-heading compact">
        <div>
          <p className="section-kicker">Policy</p>
          <h2 id="policy-heading">Scheduling assumptions</h2>
        </div>
        <span className="status-chip stale">v0 fixture fields</span>
      </div>
      <div className="form-stack">
        <label>
          <span>Allocation</span>
          <select
            value={spec.policy.allocation}
            onChange={(event) => onUpdate({ allocation: event.target.value as WorkflowSpec["policy"]["allocation"] })}
          >
            <option value="fixed">fixed</option>
            <option value="release-aware">release-aware</option>
          </select>
        </label>
        <label>
          <span>Max in-flight quantum</span>
          <input
            type="number"
            min="1"
            step="1"
            value={spec.policy.maxInFlightQuantum ?? ""}
            onChange={(event) => onUpdate({ maxInFlightQuantum: Number(event.target.value) })}
          />
        </label>
        <label>
          <span>Batching</span>
          <input
            type="number"
            min="1"
            step="1"
            value={spec.policy.batching ?? ""}
            onChange={(event) => onUpdate({ batching: Number(event.target.value) })}
          />
        </label>
      </div>
      <p className="field-note">This editor remains fixture-only until Agent F freezes v1 policy fields.</p>
    </section>
  );
}
