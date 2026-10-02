import type { ResourcePoolSpec, TaskSpec } from "../../domain/types";

interface Props {
  task: TaskSpec | undefined;
  resources: ResourcePoolSpec[];
  onUpdate: (patch: Partial<TaskSpec>) => void;
  onDelete: () => void;
}

export function TaskInspector({ task, resources, onUpdate, onDelete }: Props) {
  if (!task) {
    return (
      <section className="surface inspector-surface">
        <p className="section-kicker">Inspector</p>
        <h2>Task</h2>
        <p className="field-note">Select a task in the DAG or task list.</p>
      </section>
    );
  }

  return (
    <section className="surface inspector-surface" aria-labelledby="task-inspector-heading">
      <div className="surface-heading compact">
        <div>
          <p className="section-kicker">Task inspector</p>
          <h2 id="task-inspector-heading">{task.id}</h2>
        </div>
        <button className="danger-action compact-action" type="button" onClick={onDelete}>Delete</button>
      </div>

      <div className="form-stack">
        <label>
          <span>Label</span>
          <input value={task.label} onChange={(event) => onUpdate({ label: event.target.value })} />
        </label>
        <label>
          <span>Resource pool</span>
          <select value={task.resourcePoolId} onChange={(event) => onUpdate({ resourcePoolId: event.target.value })}>
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>{resource.id} · {resource.kind}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Resource units</span>
          <input
            type="number"
            min="1"
            step="1"
            value={task.resourceCount}
            onChange={(event) => onUpdate({ resourceCount: Number(event.target.value) })}
          />
        </label>
        <label>
          <span>Constant service time (s)</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={task.serviceTime.seconds}
            onChange={(event) => onUpdate({ serviceTime: { kind: "constant", seconds: Number(event.target.value) } })}
          />
        </label>
      </div>
      <p className="field-note">Task IDs are stable graph identifiers and are not renamed in-place.</p>
    </section>
  );
}
