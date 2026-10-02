import type { TaskSpec } from "../../contracts";

interface Props {
  task: TaskSpec | undefined;
  onUpdate: (patch: Partial<TaskSpec>) => void;
}

export function TaskInspector({ task, onUpdate }: Props) {
  if (!task) {
    return (
      <section className="surface inspector-surface">
        <h2>Task inspector</h2>
        <p>Select a task to edit its supported fields.</p>
      </section>
    );
  }

  return (
    <section className="surface inspector-surface" aria-labelledby="task-inspector-heading">
      <div className="surface-heading compact">
        <div>
          <p className="section-kicker">Inspector</p>
          <h2 id="task-inspector-heading">{task.id}</h2>
        </div>
      </div>
      <div className="form-stack">
        <label>
          <span>Label</span>
          <input value={task.label} onChange={(event) => onUpdate({ label: event.target.value })} />
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
            onChange={(event) => onUpdate({ serviceTime: { ...task.serviceTime, seconds: Number(event.target.value) } })}
          />
        </label>
      </div>
      <p className="field-note">No values are clamped or normalized. Invalid values remain explicit until corrected.</p>
    </section>
  );
}
