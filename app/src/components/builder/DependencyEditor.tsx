import { useEffect, useMemo, useState } from "react";
import type { DependencySpec, TaskSpec } from "../../domain/types";
import { nextId } from "../../domain/id";

interface Props {
  tasks: TaskSpec[];
  dependencies: DependencySpec[];
  onChange: (dependencies: DependencySpec[]) => void;
}

function numberOrUndefined(raw: string): number | undefined {
  return raw.trim() === "" ? undefined : Number(raw);
}

export function DependencyEditor({ tasks, dependencies, onChange }: Props) {
  const fallbackSource = tasks[0]?.id ?? "";
  const fallbackTarget = tasks[1]?.id ?? tasks[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(dependencies[0]?.id ?? "");
  const [source, setSource] = useState(fallbackSource);
  const [target, setTarget] = useState(fallbackTarget);

  const taskIds = useMemo(() => new Set(tasks.map((task) => task.id)), [tasks]);
  const selected = dependencies.find((dependency) => dependency.id === selectedId);

  useEffect(() => {
    if (!taskIds.has(source)) setSource(fallbackSource);
    if (!taskIds.has(target)) setTarget(fallbackTarget);
  }, [taskIds, source, target, fallbackSource, fallbackTarget]);

  useEffect(() => {
    if (selectedId && !dependencies.some((dependency) => dependency.id === selectedId)) {
      setSelectedId(dependencies[0]?.id ?? "");
    }
  }, [dependencies, selectedId]);

  function updateSelected(patch: Partial<DependencySpec>) {
    if (!selected) return;
    onChange(dependencies.map((dependency) => dependency.id === selected.id ? { ...dependency, ...patch } : dependency));
  }

  function addDependency() {
    if (!source || !target || source === target) return;
    if (dependencies.some((dependency) => dependency.sourceTaskId === source && dependency.targetTaskId === target)) return;
    const id = nextId("dep", dependencies.map((dependency) => dependency.id));
    onChange([...dependencies, { id, sourceTaskId: source, targetTaskId: target }]);
    setSelectedId(id);
  }

  function deleteSelected() {
    if (!selected) return;
    const next = dependencies.filter((dependency) => dependency.id !== selected.id);
    onChange(next);
    setSelectedId(next[0]?.id ?? "");
  }

  return (
    <section className="surface dependency-editor" aria-labelledby="dependency-editor-heading">
      <div className="surface-heading compact">
        <div>
          <p className="section-kicker">Dependencies</p>
          <h2 id="dependency-editor-heading">Edges</h2>
        </div>
      </div>

      <div className="dependency-add-row">
        <label><span>Source</span><select value={source} onChange={(event) => setSource(event.target.value)}>{tasks.map((task) => <option key={task.id} value={task.id}>{task.label}</option>)}</select></label>
        <label><span>Target</span><select value={target} onChange={(event) => setTarget(event.target.value)}>{tasks.map((task) => <option key={task.id} value={task.id}>{task.label}</option>)}</select></label>
        <button className="secondary-action" type="button" disabled={!source || !target || source === target} onClick={addDependency}>Add edge</button>
      </div>

      {dependencies.length ? (
        <>
          <label className="standalone-field">
            <span>Edit dependency</span>
            <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
              {dependencies.map((dependency) => <option key={dependency.id} value={dependency.id}>{dependency.sourceTaskId} → {dependency.targetTaskId}</option>)}
            </select>
          </label>
          {selected ? (
            <div className="compact-form-grid dependency-fields">
              <label><span>Fixed latency (s)</span><input type="number" min="0" step="any" value={selected.fixedLatencyS ?? ""} onChange={(event) => updateSelected({ fixedLatencyS: numberOrUndefined(event.target.value) })} /></label>
              <label><span>Data bytes</span><input type="number" min="0" step="any" value={selected.dataBytes ?? ""} onChange={(event) => updateSelected({ dataBytes: numberOrUndefined(event.target.value) })} /></label>
              <label><span>Bandwidth bytes/s</span><input type="number" min="0" step="any" value={selected.bandwidthBytesPerS ?? ""} onChange={(event) => updateSelected({ bandwidthBytesPerS: numberOrUndefined(event.target.value) })} /></label>
              <button className="danger-action" type="button" onClick={deleteSelected}>Delete edge</button>
            </div>
          ) : null}
        </>
      ) : <p className="field-note">No dependencies. Independent tasks may start together if resources permit.</p>}
    </section>
  );
}
