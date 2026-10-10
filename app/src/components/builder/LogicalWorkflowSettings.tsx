import type { WorkflowDesignBundle } from "../../design/bundle";

export function LogicalWorkflowSettings({
  bundle,
  onChange
}: {
  bundle: WorkflowDesignBundle;
  onChange: (bundle: WorkflowDesignBundle) => void;
}) {
  return (
    <section className="surface" aria-labelledby="logical-settings-heading">
      <div className="surface-heading compact">
        <div>
          <p className="section-kicker">Authored workflow</p>
          <h2 id="logical-settings-heading">Identity & assumptions</h2>
        </div>
      </div>
      <div className="form-stack">
        <label>
          <span>Name</span>
          <input
            value={bundle.design.name}
            onChange={(event) =>
              onChange({
                ...bundle,
                design: { ...bundle.design, name: event.target.value }
              })
            }
          />
        </label>
        <label>
          <span>Assumptions (one per line)</span>
          <textarea
            rows={4}
            value={(bundle.design.assumptions ?? []).join("\n")}
            onChange={(event) =>
              onChange({
                ...bundle,
                design: {
                  ...bundle.design,
                  assumptions: event.target.value
                    .split("\n")
                    .map((value) => value.trim())
                    .filter(Boolean)
                }
              })
            }
          />
        </label>
      </div>
    </section>
  );
}
