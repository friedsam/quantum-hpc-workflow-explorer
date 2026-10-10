import type { CompilationManifest, WorkflowDesign } from "../../design/types";
import type { SystemStateSnapshot } from "../../causal/systemState.mjs";
import type { DagRuntimeState } from "./types";

const stateLabels: Record<string, string> = {
  running: "running",
  queued: "resource queued",
  "policy-held": "policy held",
  "dependency-gated": "waiting",
  complete: "complete",
  pending: "pending"
};

const priority = [
  "running",
  "queued",
  "policy-held",
  "dependency-gated",
  "pending",
  "complete"
] as const;

export function deriveLogicalDagRuntime(
  design: WorkflowDesign,
  manifest: CompilationManifest,
  snapshot: SystemStateSnapshot
): Record<string, DagRuntimeState> {
  const compiledByDesign = new Map<string, string[]>();
  for (const [compiledTaskId, entry] of Object.entries(manifest.tasks)) {
    const list = compiledByDesign.get(entry.designTaskId) ?? [];
    list.push(compiledTaskId);
    compiledByDesign.set(entry.designTaskId, list);
  }

  const runtime: Record<string, DagRuntimeState> = {};

  for (const task of design.tasks) {
    const compiledIds = compiledByDesign.get(task.id) ?? [];
    const counts = new Map<string, number>();

    for (const compiledId of compiledIds) {
      const state = snapshot.dag.taskStateById[compiledId] ?? "pending";
      counts.set(state, (counts.get(state) ?? 0) + 1);
    }

    const allComplete =
      compiledIds.length > 0 &&
      (counts.get("complete") ?? 0) === compiledIds.length;

    const state = allComplete
      ? "complete"
      : priority.find((candidate) => (counts.get(candidate) ?? 0) > 0) ??
        "pending";

    const text = [
      ...priority
        .filter((candidate) => (counts.get(candidate) ?? 0) > 0)
        .map(
          (candidate) =>
            (counts.get(candidate) ?? 0) + " " + stateLabels[candidate]
        )
    ].join(" · ");

    runtime[task.id] = { state, text };
  }

  return runtime;
}
