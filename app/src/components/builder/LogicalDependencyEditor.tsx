import { useEffect, useMemo, useState } from "react";
import type {
  DesignDependency,
  DesignTask,
  SystemProfile
} from "../../design/types";
import type { WorkflowDesignBundle } from "../../design/bundle";
import { nextId } from "../../domain/id";

interface Props {
  bundle: WorkflowDesignBundle;
  onChange: (bundle: WorkflowDesignBundle) => void;
}

function numberOrUndefined(raw: string): number | undefined {
  return raw.trim() === "" ? undefined : Number(raw);
}

function multiplicity(task: DesignTask | undefined): number {
  return task?.multiplicity ?? 1;
}

export function LogicalDependencyEditor({ bundle, onChange }: Props) {
  const tasks = bundle.design.tasks;
  const dependencies = bundle.design.dependencies;
  const fallbackSource = tasks[0]?.id ?? "";
  const fallbackTarget = tasks[1]?.id ?? tasks[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(dependencies[0]?.id ?? "");
  const [source, setSource] = useState(fallbackSource);
  const [target, setTarget] = useState(fallbackTarget);

  const taskIds = useMemo(() => new Set(tasks.map((task) => task.id)), [tasks]);
  const selected = dependencies.find((dependency) => dependency.id === selectedId);
  const sourceTask = tasks.find((task) => task.id === source);
  const targetTask = tasks.find((task) => task.id === target);

  useEffect(() => {
    if (!taskIds.has(source)) setSource(fallbackSource);
    if (!taskIds.has(target)) setTarget(fallbackTarget);
  }, [taskIds, source, target, fallbackSource, fallbackTarget]);

  useEffect(() => {
    if (
      selectedId &&
      !dependencies.some((dependency) => dependency.id === selectedId)
    ) {
      setSelectedId(dependencies[0]?.id ?? "");
    }
  }, [dependencies, selectedId]);

  function updateDependencies(next: DesignDependency[]) {
    onChange({
      ...bundle,
      design: { ...bundle.design, dependencies: next }
    });
  }

  function updateSelected(patch: Partial<DesignDependency>) {
    if (!selected) return;
    updateDependencies(
      dependencies.map((dependency) =>
        dependency.id === selected.id
          ? { ...dependency, ...patch }
          : dependency
      )
    );
  }

  function addDependency() {
    if (!source || !target || source === target) return;
    if (
      dependencies.some(
        (dependency) =>
          dependency.sourceTaskId === source &&
          dependency.targetTaskId === target
      )
    ) return;

    const id = nextId("dep", dependencies.map((dependency) => dependency.id));
    updateDependencies([
      ...dependencies,
      { id, sourceTaskId: source, targetTaskId: target }
    ]);
    setSelectedId(id);
  }

  function deleteSelected() {
    if (!selected) return;
    const next = dependencies.filter(
      (dependency) => dependency.id !== selected.id
    );
    updateDependencies(next);

    const communicationKey = selected.communicationKey ?? selected.id;
    const profile = { ...bundle.systemProfile };
    const dependencyCommunication = {
      ...(profile.dependencyCommunication ?? {})
    };
    delete dependencyCommunication[communicationKey];
    onChange({
      ...bundle,
      design: { ...bundle.design, dependencies: next },
      systemProfile: {
        ...profile,
        dependencyCommunication: Object.keys(dependencyCommunication).length
          ? dependencyCommunication
          : undefined
      }
    });

    setSelectedId(next[0]?.id ?? "");
  }

  function updateCommunication(
    patch: Partial<{
      fixedLatencyS: number;
      dataBytes: number;
      bandwidthBytesPerS: number;
    }>
  ) {
    if (!selected) return;
    const key = selected.communicationKey ?? selected.id;
    const current =
      bundle.systemProfile.dependencyCommunication?.[key]?.value ?? {};
    const value = { ...current, ...patch };

    const compact = Object.fromEntries(
      Object.entries(value).filter(([, candidate]) => candidate !== undefined)
    );

    const dependencyCommunication = {
      ...(bundle.systemProfile.dependencyCommunication ?? {})
    };

    if (Object.keys(compact).length === 0) {
      delete dependencyCommunication[key];
    } else {
      dependencyCommunication[key] = {
        value: compact,
        provenance: {
          kind: "user-entered",
          source: "Workflow Explorer Builder",
          notes: "Edited logical dependency communication assumption."
        }
      };
    }

    onChange({
      ...bundle,
      systemProfile: {
        ...bundle.systemProfile,
        dependencyCommunication: Object.keys(dependencyCommunication).length
          ? dependencyCommunication
          : undefined
      }
    });
  }

  const selectedKey = selected
    ? selected.communicationKey ?? selected.id
    : "";
  const communication =
    selectedKey
      ? bundle.systemProfile.dependencyCommunication?.[selectedKey]?.value
      : undefined;

  const unequalNew =
    multiplicity(sourceTask) !== multiplicity(targetTask);

  return (
    <section className="surface" aria-labelledby="logical-dependency-heading">
      <div className="surface-heading compact">
        <div>
          <p className="section-kicker">Logical dependencies</p>
          <h2 id="logical-dependency-heading">Edges & instance mapping</h2>
        </div>
      </div>

      <div className="dependency-add-row">
        <label>
          <span>Source</span>
          <select value={source} onChange={(event) => setSource(event.target.value)}>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.label} ×{task.multiplicity ?? 1}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Target</span>
          <select value={target} onChange={(event) => setTarget(event.target.value)}>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.label} ×{task.multiplicity ?? 1}
              </option>
            ))}
          </select>
        </label>
        <button
          className="secondary-action"
          type="button"
          disabled={!source || !target || source === target}
          onClick={addDependency}
        >
          Add edge
        </button>
      </div>

      {unequalNew ? (
        <p className="field-note warning-note">
          These multiplicities differ. A new edge is intentionally left
          ambiguous until you choose an explicit mapping; simulation remains
          blocked rather than guessing.
        </p>
      ) : null}

      {dependencies.length ? (
        <>
          <label className="standalone-field">
            <span>Edit dependency</span>
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {dependencies.map((dependency) => (
                <option key={dependency.id} value={dependency.id}>
                  {dependency.sourceTaskId} → {dependency.targetTaskId}
                </option>
              ))}
            </select>
          </label>

          {selected ? (
            <div className="compact-form-grid dependency-fields">
              <label>
                <span>Instance mapping</span>
                <select
                  value={selected.instanceMapping ?? "auto"}
                  onChange={(event) =>
                    updateSelected({
                      instanceMapping:
                        event.target.value === "auto"
                          ? undefined
                          : event.target.value as "pairwise" | "all-to-all"
                    })
                  }
                >
                  <option value="auto">auto · pairwise only when equal</option>
                  <option value="pairwise">pairwise</option>
                  <option value="all-to-all">all-to-all</option>
                </select>
              </label>

              <label>
                <span>Fixed latency (s)</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={communication?.fixedLatencyS ?? ""}
                  onChange={(event) =>
                    updateCommunication({
                      fixedLatencyS: numberOrUndefined(event.target.value)
                    })
                  }
                />
              </label>

              <label>
                <span>Data bytes</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={communication?.dataBytes ?? ""}
                  onChange={(event) =>
                    updateCommunication({
                      dataBytes: numberOrUndefined(event.target.value)
                    })
                  }
                />
              </label>

              <label>
                <span>Bandwidth bytes/s</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={communication?.bandwidthBytesPerS ?? ""}
                  onChange={(event) =>
                    updateCommunication({
                      bandwidthBytesPerS: numberOrUndefined(event.target.value)
                    })
                  }
                />
              </label>

              <button
                className="danger-action"
                type="button"
                onClick={deleteSelected}
              >
                Delete edge
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <p className="field-note">
          No dependencies. Logical task instances may start independently if
          resources permit.
        </p>
      )}
    </section>
  );
}
