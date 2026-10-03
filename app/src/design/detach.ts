import type { WorkflowSpec } from "../domain/types";
import type { WorkflowDesignBundle } from "./bundle";

const compilerTaskMetadataKeys = new Set([
  "designTaskId",
  "semanticType",
  "actorGroupIds",
  "repeatBlockId",
  "repeatIndex",
  "repeatOrdinal",
  "timingKey",
  "timingProvenance"
]);

export function detachCompilationProvenance(
  spec: WorkflowSpec,
  bundle: WorkflowDesignBundle
): WorkflowSpec {
  const compilerAssumptions = new Set([
    ...(bundle.runConfiguration.assumptions ?? []),
    ...(bundle.systemProfile.assumptions ?? []),
    `Compiled from WorkflowDesign ${bundle.design.id}, RunConfiguration ${bundle.runConfiguration.id}, SystemProfile ${bundle.systemProfile.id}.`,
    "Resolved WorkflowSpec contains deterministic constants only; exact input provenance is retained in RunRecord."
  ]);

  const tasks = spec.tasks.map((task) => {
    if (!task.metadata) return task;
    const metadata = Object.fromEntries(
      Object.entries(task.metadata).filter(
        ([key]) => !compilerTaskMetadataKeys.has(key)
      )
    );
    return {
      ...task,
      ...(Object.keys(metadata).length ? { metadata } : { metadata: undefined })
    };
  });

  const assumptions = [
    ...(spec.assumptions ?? []).filter(
      (assumption) => !compilerAssumptions.has(assumption)
    ),
    "Direct WorkflowSpec edit: prior CompilationManifest/SystemProfile provenance was detached before this draft was modified."
  ];

  return {
    ...spec,
    tasks,
    assumptions
  };
}
