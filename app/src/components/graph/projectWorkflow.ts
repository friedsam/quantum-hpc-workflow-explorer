import type { WorkflowSpec } from "../../domain/types";
import type { DagViewModel } from "./types";

export function projectWorkflowDag(spec: WorkflowSpec): DagViewModel {
  const resourceById = new Map(spec.resources.map((resource) => [resource.id, resource]));

  return {
    nodes: spec.tasks.map((task) => {
      const resource = resourceById.get(task.resourcePoolId);
      const resourceLabel = resource
        ? resource.id + " · " + resource.kind
        : task.resourcePoolId + " · missing";

      return {
        id: task.id,
        label: task.label,
        detail:
          resourceLabel +
          " · " +
          task.resourceCount +
          " unit" +
          (task.resourceCount === 1 ? "" : "s") +
          " · " +
          task.serviceTime.seconds +
          " s"
      };
    }),
    edges: spec.dependencies.map((dependency) => ({
      id: dependency.id,
      source: dependency.sourceTaskId,
      target: dependency.targetTaskId
    }))
  };
}
