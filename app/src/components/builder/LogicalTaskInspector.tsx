import type { DesignTask } from "../../design/types";
import type { WorkflowDesignBundle } from "../../design/bundle";

interface Props {
  bundle: WorkflowDesignBundle;
  task: DesignTask | undefined;
  onChange: (bundle: WorkflowDesignBundle) => void;
  onDelete: () => void;
}

export function LogicalTaskInspector({
  bundle,
  task,
  onChange,
  onDelete
}: Props) {
  if (!task) {
    return (
      <section className="surface inspector-surface">
        <p className="section-kicker">Logical task</p>
        <h2>Inspector</h2>
        <p className="field-note">Select one authored task node.</p>
      </section>
    );
  }

  const selectedTask = task;
  const binding =
    bundle.runConfiguration.taskResources[selectedTask.id];
  const timingKey =
    selectedTask.timingKey ?? selectedTask.id;
  const timing =
    bundle.systemProfile.taskServiceTimes[timingKey];

  function updateTask(patch: Partial<DesignTask>) {
    onChange({
      ...bundle,
      design: {
        ...bundle.design,
        tasks: bundle.design.tasks.map((candidate) =>
          candidate.id === selectedTask.id ? { ...candidate, ...patch } : candidate
        )
      }
    });
  }

  function updateBinding(
    patch: Partial<{ resourcePoolId: string; resourceCount: number }>
  ) {
    onChange({
      ...bundle,
      runConfiguration: {
        ...bundle.runConfiguration,
        taskResources: {
          ...bundle.runConfiguration.taskResources,
          [selectedTask.id]: {
            ...(binding ?? { resourcePoolId: "", resourceCount: 1 }),
            ...patch
          }
        }
      }
    });
  }

  function updateServiceTime(seconds: number) {
    onChange({
      ...bundle,
      systemProfile: {
        ...bundle.systemProfile,
        taskServiceTimes: {
          ...bundle.systemProfile.taskServiceTimes,
          [timingKey]: {
            value: { kind: "constant", seconds },
            provenance: {
              kind: "user-entered",
              source: "Workflow Explorer Builder",
              notes: "Edited modeled wall-time assumption."
            }
          }
        }
      }
    });
  }

  return (
    <section
      className="surface inspector-surface"
      aria-labelledby="logical-task-inspector-heading"
    >
      <div className="surface-heading compact">
        <div>
          <p className="section-kicker">Logical task inspector</p>
          <h2 id="logical-task-inspector-heading">{selectedTask.id}</h2>
        </div>
        <button
          className="danger-action compact-action"
          type="button"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>

      <div className="form-stack">
        <label>
          <span>Label</span>
          <input
            value={selectedTask.label}
            onChange={(event) => updateTask({ label: event.target.value })}
          />
        </label>

        <label>
          <span>Multiplicity</span>
          <input
            aria-label="Multiplicity"
            type="number"
            min="1"
            step="1"
            value={selectedTask.multiplicity ?? 1}
            onChange={(event) =>
              updateTask({ multiplicity: Number(event.target.value) })
            }
          />
          <small>
            ×N = N logical task instances represented by this node. It does
            not imply persistent actor identity.
          </small>
        </label>

        <label>
          <span>Resource pool</span>
          <select
            value={binding?.resourcePoolId ?? ""}
            onChange={(event) =>
              updateBinding({ resourcePoolId: event.target.value })
            }
          >
            <option value="" disabled>Select pool</option>
            {bundle.runConfiguration.resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.id} · {resource.kind.toUpperCase()}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Resource units / instance</span>
          <input
            aria-label="Resource units / instance"
            type="number"
            min="1"
            step="1"
            value={binding?.resourceCount ?? 1}
            onChange={(event) =>
              updateBinding({ resourceCount: Number(event.target.value) })
            }
          />
          <small>Independent of logical multiplicity and actor count.</small>
        </label>

        <label>
          <span>Modeled wall time / instance (s)</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={timing?.value.seconds ?? ""}
            onChange={(event) =>
              updateServiceTime(Number(event.target.value))
            }
          />
          <small>
            Simulation assumption for one task instance; not CPU clock speed.
            Explicit dependency communication is modeled separately.
          </small>
        </label>
      </div>

      {selectedTask.actorParticipation?.length ? (
        <div className="logical-actor-note">
          <strong>Authored actor participation</strong>
          {selectedTask.actorParticipation.map((participation) => (
            <span key={participation.actorGroupId}>
              {participation.actorGroupId} · {participation.selection.kind} ·{" "}
              {participation.stateDuringTask}
            </span>
          ))}
        </div>
      ) : null}

      <p className="field-note">
        Task IDs remain stable authored IDs. The compiler expands multiplicity
        into concrete DES tasks only after validation.
      </p>
    </section>
  );
}
