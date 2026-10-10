import type { RunResource } from "../../design/types";
import type { PolicySpec, ResourceKind } from "../../domain/types";
import type { WorkflowDesignBundle } from "../../design/bundle";
import { nextId } from "../../domain/id";

interface Props {
  bundle: WorkflowDesignBundle;
  onChange: (bundle: WorkflowDesignBundle) => void;
}

function numericOrUndefined(raw: string): number | undefined {
  return raw.trim() === "" ? undefined : Number(raw);
}

export function LogicalResourceEditor({ bundle, onChange }: Props) {
  const { runConfiguration } = bundle;
  const resources = runConfiguration.resources;
  const bindings = runConfiguration.taskResources;
  const policy = runConfiguration.policy;

  function setRunConfiguration(
    resourcesNext: RunResource[],
    policyNext: PolicySpec
  ) {
    onChange({
      ...bundle,
      runConfiguration: {
        ...runConfiguration,
        resources: resourcesNext,
        policy: policyNext
      }
    });
  }

  function updateResource(id: string, patch: Partial<RunResource>) {
    const nextResources = resources.map((resource) =>
      resource.id === id ? { ...resource, ...patch } : resource
    );
    let nextPolicy = policy;

    if (patch.kind) {
      const fixedReservationByPool = {
        ...(policy.fixedReservationByPool ?? {})
      };
      const maxInFlightQuantumByPool = {
        ...(policy.maxInFlightQuantumByPool ?? {})
      };
      if (patch.kind === "qpu") delete fixedReservationByPool[id];
      else delete maxInFlightQuantumByPool[id];
      nextPolicy = {
        ...policy,
        fixedReservationByPool: Object.keys(fixedReservationByPool).length
          ? fixedReservationByPool
          : undefined,
        maxInFlightQuantumByPool: Object.keys(maxInFlightQuantumByPool).length
          ? maxInFlightQuantumByPool
          : undefined
      };
    }

    setRunConfiguration(nextResources, nextPolicy);
  }

  function deleteResource(id: string) {
    if (
      Object.values(bindings).some(
        (binding) => binding.resourcePoolId === id
      )
    ) return;

    const fixedReservationByPool = {
      ...(policy.fixedReservationByPool ?? {})
    };
    const maxInFlightQuantumByPool = {
      ...(policy.maxInFlightQuantumByPool ?? {})
    };
    delete fixedReservationByPool[id];
    delete maxInFlightQuantumByPool[id];

    setRunConfiguration(
      resources.filter((resource) => resource.id !== id),
      {
        ...policy,
        fixedReservationByPool: Object.keys(fixedReservationByPool).length
          ? fixedReservationByPool
          : undefined,
        maxInFlightQuantumByPool: Object.keys(maxInFlightQuantumByPool).length
          ? maxInFlightQuantumByPool
          : undefined
      }
    );
  }

  function addResource() {
    const id = nextId("pool", resources.map((resource) => resource.id));
    setRunConfiguration(
      [...resources, { id, kind: "cpu", capacity: 1 }],
      policy
    );
  }

  function updateReservation(poolId: string, raw: string) {
    const value = numericOrUndefined(raw);
    const next = { ...(policy.fixedReservationByPool ?? {}) };
    if (value === undefined) delete next[poolId];
    else next[poolId] = value;
    setRunConfiguration(resources, {
      ...policy,
      fixedReservationByPool: Object.keys(next).length ? next : undefined
    });
  }

  function updateCost(resource: RunResource, raw: string) {
    const value = numericOrUndefined(raw);
    const key = resource.costKey ?? resource.id;
    const costPerUnitSecond = {
      ...(bundle.systemProfile.costPerUnitSecond ?? {})
    };

    if (value === undefined) {
      delete costPerUnitSecond[key];
    } else {
      costPerUnitSecond[key] = {
        value,
        provenance: {
          kind: "user-entered",
          source: "Workflow Explorer Builder",
          notes: "Edited modeled cost rate; not provider billing unless explicitly sourced."
        }
      };
    }

    onChange({
      ...bundle,
      systemProfile: {
        ...bundle.systemProfile,
        costPerUnitSecond: Object.keys(costPerUnitSecond).length
          ? costPerUnitSecond
          : undefined
      }
    });
  }

  function updateActorCount(actorGroupId: string, value: number) {
    onChange({
      ...bundle,
      runConfiguration: {
        ...bundle.runConfiguration,
        actorGroupCounts: {
          ...(bundle.runConfiguration.actorGroupCounts ?? {}),
          [actorGroupId]: value
        }
      }
    });
  }

  function updateInFlight(poolId: string, raw: string) {
    const value = numericOrUndefined(raw);
    const next = { ...(policy.maxInFlightQuantumByPool ?? {}) };
    if (value === undefined) delete next[poolId];
    else next[poolId] = value;
    setRunConfiguration(resources, {
      ...policy,
      maxInFlightQuantumByPool: Object.keys(next).length ? next : undefined
    });
  }

  return (
    <section className="surface" aria-labelledby="logical-resource-heading">
      <div className="surface-heading compact">
        <div>
          <p className="section-kicker">Run configuration</p>
          <h2 id="logical-resource-heading">Resources & policy</h2>
        </div>
        <button
          className="secondary-action compact-action"
          type="button"
          onClick={addResource}
        >
          Add pool
        </button>
      </div>

      <label className="standalone-field">
        <span>Allocation policy</span>
        <select
          value={policy.allocation}
          onChange={(event) =>
            setRunConfiguration(resources, {
              ...policy,
              allocation: event.target.value as PolicySpec["allocation"]
            })
          }
        >
          <option value="release-aware">release-aware</option>
          <option value="fixed">fixed</option>
        </select>
      </label>

      <div className="resource-card-list">
        {resources.map((resource) => {
          const referenced = Object.values(bindings).some(
            (binding) => binding.resourcePoolId === resource.id
          );
          return (
            <div className="resource-edit-card" key={resource.id}>
              <div className="resource-edit-head">
                <strong>{resource.id}</strong>
                <button
                  className="text-action danger-text"
                  type="button"
                  disabled={referenced}
                  title={
                    referenced
                      ? "Reassign logical tasks using this pool first."
                      : "Delete resource pool"
                  }
                  onClick={() => deleteResource(resource.id)}
                >
                  Delete
                </button>
              </div>

              <div className="compact-form-grid">
                <label>
                  <span>Kind</span>
                  <select
                    value={resource.kind}
                    onChange={(event) =>
                      updateResource(resource.id, {
                        kind: event.target.value as ResourceKind
                      })
                    }
                  >
                    <option value="cpu">cpu</option>
                    <option value="gpu">gpu</option>
                    <option value="qpu">qpu</option>
                  </select>
                </label>

                <label>
                  <span>Capacity</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={resource.capacity}
                    onChange={(event) =>
                      updateResource(resource.id, {
                        capacity: Number(event.target.value)
                      })
                    }
                  />
                </label>

                <label>
                  <span>Cost / unit-s</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={
                      bundle.systemProfile.costPerUnitSecond?.[
                        resource.costKey ?? resource.id
                      ]?.value ?? ""
                    }
                    placeholder="optional"
                    onChange={(event) =>
                      updateCost(resource, event.target.value)
                    }
                  />
                </label>

                {resource.kind !== "qpu" &&
                policy.allocation === "fixed" ? (
                  <label>
                    <span>Fixed reservation</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={
                        policy.fixedReservationByPool?.[resource.id] ?? ""
                      }
                      placeholder={"default " + resource.capacity}
                      onChange={(event) =>
                        updateReservation(resource.id, event.target.value)
                      }
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
                      value={
                        policy.maxInFlightQuantumByPool?.[resource.id] ?? ""
                      }
                      placeholder="unbounded"
                      onChange={(event) =>
                        updateInFlight(resource.id, event.target.value)
                      }
                    />
                  </label>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {bundle.design.actorGroups?.length ? (
        <div className="actor-model-summary">
          <strong>Persistent actor groups</strong>
          {bundle.design.actorGroups.map((group) => (
            <label className="actor-count-editor" key={group.id}>
              <span>{group.label}</span>
              <input
                aria-label={group.label + " actor count"}
                type="number"
                min="1"
                step="1"
                value={
                  bundle.runConfiguration.actorGroupCounts?.[group.id] ?? ""
                }
                onChange={(event) =>
                  updateActorCount(group.id, Number(event.target.value))
                }
              />
              <small>{group.kind ?? "logical"} actors</small>
            </label>
          ))}
          <small>
            Actor count is independent of task multiplicity and resource units / instance.
          </small>
        </div>
      ) : null}
    </section>
  );
}
