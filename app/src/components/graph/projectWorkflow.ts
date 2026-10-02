import type { WorkflowSpec } from "../../contracts";
import type { DagViewModel } from "./types";

export function projectWorkflowDag(spec: WorkflowSpec): DagViewModel {
  const resourceById = new Map(spec.resources.map((resource) => [resource.id, resource]));

  return {
    nodes: spec.tasks.map((task) => {
      // Temporary compatibility projection. Frozen v1 will expose resourcePoolId directly.
      const taskRecord = task as unknown as Record<string, unknown>;
      const provisionalPoolId =
        typeof taskRecord.resourcePoolId === "string" ? taskRecord.resourcePoolId : undefined;
      const provisionalKind =
        typeof taskRecord.resourceKind === "string" ? taskRecord.resourceKind : undefined;
      const resource = provisionalPoolId ? resourceById.get(provisionalPoolId) : undefined;
      const resourceLabel = resource ? resource.id + " · " + resource.kind : provisionalKind ?? "resource";

      return {
        id: task.id,
        label: task.label,
        detail: resourceLabel + " · " + task.resourceCount + " unit" + (task.resourceCount === 1 ? "" : "s")
      };
    }),
    edges: spec.dependencies.map((dependency) => ({
      id: dependency.id,
      source: dependency.sourceTaskId,
      target: dependency.targetTaskId
    }))
  };
}
