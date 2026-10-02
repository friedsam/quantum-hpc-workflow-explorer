import type { WorkflowSpec } from "../../contracts";
import type { DagViewModel } from "./types";

export function projectWorkflowDag(spec: WorkflowSpec): DagViewModel {
  const resourceById = new Map(spec.resources.map((resource) => [resource.id, resource]));

  return {
    nodes: spec.tasks.map((task) => {
      // v0 fixture compatibility: Agent-F-frozen v1 will use resourcePoolId.
      const provisionalPoolId =
        "resourcePoolId" in task && typeof (task as { resourcePoolId?: unknown }).resourcePoolId === "string"
          ? (task as { resourcePoolId: string }).resourcePoolId
          : undefined;
      const provisionalKind =
        "resourceKind" in task && typeof (task as { resourceKind?: unknown }).resourceKind === "string"
          ? String((task as { resourceKind: unknown }).resourceKind)
          : undefined;
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
