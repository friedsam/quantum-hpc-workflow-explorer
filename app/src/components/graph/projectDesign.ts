import type { WorkflowDesignBundle } from "../../design/bundle";
import type { DagViewModel } from "./types";

export function projectDesignDag(bundle: WorkflowDesignBundle): DagViewModel {
  const resourceById = new Map(
    bundle.runConfiguration.resources.map((resource) => [resource.id, resource])
  );

  return {
    nodes: bundle.design.tasks.map((task) => {
      const multiplicity = task.multiplicity ?? 1;
      const binding = bundle.runConfiguration.taskResources[task.id];
      const resource = binding
        ? resourceById.get(binding.resourcePoolId)
        : undefined;
      const resourceKind = resource?.kind?.toUpperCase() ?? "UNBOUND";
      const units = binding?.resourceCount ?? 0;
      const resourceTag = binding
        ? resourceKind +
          " · " +
          units +
          " unit" +
          (units === 1 ? "" : "s") +
          " / instance · " +
          binding.resourcePoolId
        : "Unbound resource";
      const timingKey = task.timingKey ?? task.id;
      const seconds =
        bundle.systemProfile.taskServiceTimes[timingKey]?.value.seconds;

      return {
        id: task.id,
        label: task.label,
        multiplicity,
        resourceTag,
        detail:
          seconds === undefined
            ? "service time unresolved"
            : seconds + " s / instance",
        accessibleLabel:
          task.label +
          ", logical multiplicity " +
          multiplicity +
          ", " +
          resourceTag +
          (seconds === undefined ? "" : ", service time " + seconds + " seconds per instance")
      };
    }),
    edges: bundle.design.dependencies.map((dependency) => ({
      id: dependency.id,
      source: dependency.sourceTaskId,
      target: dependency.targetTaskId
    }))
  };
}
