import type { RunConfiguration } from "../../design/types";

function poolTitle(kind: string, id: string): string {
  const upper = kind.toUpperCase();
  if (kind === "qpu") {
    return id.toLowerCase() === kind ? "QPU" : "QPU · " + id;
  }
  const base = upper + " pool";
  return id.toLowerCase() === kind ? base : base + " · " + id;
}

function capacityText(kind: string, capacity: number): string {
  if (kind === "qpu") {
    return (
      capacity +
      " execution lane" +
      (capacity === 1 ? "" : "s")
    );
  }
  return (
    capacity +
    " parallel unit" +
    (capacity === 1 ? "" : "s")
  );
}

export function SystemTopologyStrip({
  runConfiguration
}: {
  runConfiguration: RunConfiguration;
}) {
  return (
    <section
      className="surface system-topology-strip"
      aria-labelledby="system-topology-heading"
    >
      <div className="system-topology-head">
        <div>
          <p className="section-kicker">System topology</p>
          <h2 id="system-topology-heading">Modeled execution capacity</h2>
        </div>
        <span className="muted-label">
          from current RunConfiguration
        </span>
      </div>

      <div className="topology-pool-list">
        {runConfiguration.resources.map((resource) => {
          const reservation =
            runConfiguration.policy.fixedReservationByPool?.[resource.id];
          const inFlight =
            runConfiguration.policy.maxInFlightQuantumByPool?.[resource.id];

          return (
            <article
              className={
                resource.kind === "qpu"
                  ? "topology-pool-card qpu"
                  : "topology-pool-card classical"
              }
              key={resource.id}
            >
              <strong>{poolTitle(resource.kind, resource.id)}</strong>
              <span>{capacityText(resource.kind, resource.capacity)}</span>
              {resource.kind === "qpu" && inFlight !== undefined ? (
                <small>max in-flight quantum work · {inFlight}</small>
              ) : reservation !== undefined ? (
                <small>fixed reservation · {reservation} units</small>
              ) : (
                <small>{runConfiguration.policy.allocation} allocation</small>
              )}
            </article>
          );
        })}
      </div>

      <div className="builder-concept-key">
        <span>
          <strong>×N</strong> = N logical task instances represented by one
          node; it does not imply N actors or N resource units.
        </span>
        <span>
          <strong>Modeled wall time / instance</strong> = simulation assumption
          for one task instance, not CPU clock speed. Dependency communication
          is modeled separately.
        </span>
      </div>
    </section>
  );
}
