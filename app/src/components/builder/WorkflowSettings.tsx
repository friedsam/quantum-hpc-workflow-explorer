import type { WorkflowSpec } from "../../domain/types";

interface Props {
  spec: WorkflowSpec;
  onChange: (spec: WorkflowSpec) => void;
}

export function WorkflowSettings({ spec, onChange }: Props) {
  return (
    <section className="surface workflow-settings" aria-labelledby="workflow-settings-heading">
      <div className="surface-heading compact">
        <div>
          <p className="section-kicker">Workflow</p>
          <h2 id="workflow-settings-heading">Identity & assumptions</h2>
        </div>
      </div>
      <div className="form-stack">
        <label>
          <span>Name</span>
          <input value={spec.name} onChange={(event) => onChange({ ...spec, name: event.target.value })} />
        </label>
        <label>
          <span>Assumptions (one per line)</span>
          <textarea
            rows={4}
            value={(spec.assumptions ?? []).join("\n")}
            onChange={(event) => onChange({
              ...spec,
              assumptions: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean)
            })}
          />
        </label>
      </div>
    </section>
  );
}
