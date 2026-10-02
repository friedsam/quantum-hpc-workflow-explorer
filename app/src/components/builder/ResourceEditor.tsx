import type { PolicySpec, ResourceKind, ResourcePoolSpec, TaskSpec } from "../../domain/types";
import { nextId } from "../../domain/id";

interface Props {
  resources: ResourcePoolSpec[];
  tasks: TaskSpec[];
  policy: PolicySpec;
  onChange: (resources: ResourcePoolSpec[], policy: PolicySpec) => void;
}

function numericOrUndefined(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  return Number(raw);
}

export function ResourceEditor({ resources, tasks, policy, onChange }: Props) {
  function updateResource(id: string, patch: Partial<ResourcePoolSpec>) {
    const nextResources = resources.map((resource) => resource.id === id ? { ...resource, ...patch } : resource);
    let nextPolicy = policy;

    if (patch.kind) {
      const fixedReservationByPool = { ...(policy.fixedReservationByPool ?? {}) };
      const maxInFlightQuantumByPool = { ...(policy.maxInFlightQuantumByPool ?? {}) };

      if (patch.kind === "qpu") delete fixedReservationByPool[id];
      else delete maxInFlightQuantumByPool[id];

      nextPolicy = {
        ...policy,
        fixedReservationByPool: Object.keys(fixedReservationByPool).length ? fixedReservationByPool : undefined,
        maxInFlightQuantumByPool: Object.keys(maxInFlightQuantumByPool).length ? maxInFlightQuantumByPool : undefined
      };
    }

    onChange(nextResources, nextPolicy);
  }

  function deleteResource(id: string) {
    if (tasks.some((task) => task.resourcePoolId === id)) return;
    const nextResources = resources.filter((resource) => resource.id !== id);
    const fixedReservationByPool = { ...(policy.fixedReservationByPool ?? {}) };
    const maxInFlightQuantumByPool = { ...(policy.maxInFlightQuantumByPool ?? {}) };
    delete fixedReservationByPool[id];
    delete maxInFlightQuantumByPool[id];

    onChange(nextResources, {
      ...policy,
      fixedReservationByPool: Object.keys(fixedReservationByPool).length ? fixedReservationByPool : undefined,
      maxInFlightQuantumByPool: Object.keys(maxInFlightQuantumByPool).length ? maxInFlightQuantumByPool : undefined
    });
  }

  function addResource() {
    const id = nextId("pool", resources.map((resource) => resource.id));
    onChange([...resources, { id, kind: "cpu", capacity: 1 }], policy);
  }

  function updateReservation(poolId: string, raw: string) {
    const value = numericOrUndefined(raw);
    const next = { ...(policy.fixedReservationByPool ?? {}) };
    if (value === undefined) delete next[poolId];
    else next[poolId] = value;
    onChange(resources, { ...policy, fixedReservationByPool: Object.keys(next).length ? next : undefined });
  }

  function updateInFlight(poolId: string, raw: string) {
    const value = numericOrUndefined(raw);
    const next = { ...(policy.maxInFlightQuantumByPool ?? {}) };
    if (value === undefined) delete next[poolId];
    else next[poolId] = value;
    onChange(resources, { ...policy, maxInFlightQuantumByPool: Object.keys(next).length ? next : undefined });
  }

  return (
    <section className="surface resource-editor" aria-labelledby="resource-editor-heading">
      <div className="surface-heading compact">
        <div>
          <p className="section-kicker">Resources & policy</p>
          <h2 id="resource-editor-heading">Pools</h2>
        </div>
        <button className="secondary-action compact-action" type="button" onClick={addResource}>Add pool</button>
      </div>

      <label className="standalone-field">
        <span>Allocation policy</span>
        <select
          value={policy.allocation}
          onChange={(event) => onChange(resources, { ...policy, allocation: event.target.value as PolicySpec["allocation"] })}
        >
          <option value="release-aware">release-aware</option>
          <option value="fixed">fixed</option>
        </select>
      </label>

      <div className="resource-card-list">
        {resources.map((resource) => {
          const referenced = tasks.some((task) => task.resourcePoolId === resource.id);
          return (
            <div className="resource-edit-card" key={resource.id}>
              <div className="resource-edit-head">
                <strong>{resource.id}</strong>
                <button
                  className="text-action danger-text"
                  type="button"
                  disabled={referenced}
                  title={referenced ? "Reassign or delete tasks using this pool first." : "Delete resource pool"}
                  onClick={() => deleteResource(resource.id)}
                >
                  Delete
                </button>
              </div>
              <div className="compact-form-grid">
                <label>
                  <span>Kind</span>
                  <select value={resource.kind} onChange={(event) => updateResource(resource.id, { kind: event.target.value as ResourceKind })}>
                    <option value="cpu">cpu</option>
                    <option value="gpu">gpu</option>
                    <option value="qpu">qpu</option>
                  </select>
                </label>
                <label>
                  <span>Capacity</span>
                  <input type="number" min="1" step="1" value={resource.capacity} onChange={(event) => updateResource(resource.id, { capacity: Number(event.target.value) })} />
                </label>
                <label>
                  <span>Cost / unit-s</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={resource.costPerUnitSecond ?? ""}
                    placeholder="optional"
                    onChange={(event) => updateResource(resource.id, { costPerUnitSecond: numericOrUndefined(event.target.value) })}
                  />
                </label>
                {resource.kind !== "qpu" && policy.allocation === "fixed" ? (
                  <label>
                    <span>Fixed reservation</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={policy.fixedReservationByPool?.[resource.id] ?? ""}
                      placeholder={"default " + resource.capacity}
                      onChange={(event) => updateReservation(resource.id, event.target.value)}
                    />
                  </label>
                ) : null}
                {resource.kind === "qpu" ? (
                  <label>
                    <span>Max in-flight</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={policy.maxInFlightQuantumByPool?.[resource.id] ?? ""}
                      placeholder="unbounded"
                      onChange={(event) => updateInFlight(resource.id, event.target.value)}
                    />
                  </label>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
