import type { CompilationManifest, RunRecord as DesignRunRecord } from "./design/types";
import type { WorkflowDesignBundle } from "./design/bundle";
import type { SimulationResult, WorkflowSpec } from "./domain/types";

export interface CompilationContext {
  bundle: WorkflowDesignBundle;
  manifest: CompilationManifest;
}

export interface DirectRunRecord {
  schemaVersion: 1;
  sourceKind: "direct-workflow-spec";
  id: string;
  createdAt: number;
  label: string;
  spec: WorkflowSpec;
  result: SimulationResult;
}

export type RunRecord = DirectRunRecord | DesignRunRecord;

export function isDesignRunRecord(run: RunRecord): run is DesignRunRecord {
  return "compiledWorkflowSpec" in run;
}

export function runSpec(run: RunRecord): WorkflowSpec {
  return isDesignRunRecord(run) ? run.compiledWorkflowSpec : run.spec;
}

export function runResult(run: RunRecord): SimulationResult {
  return isDesignRunRecord(run) ? run.simulationResult : run.result;
}

export function runLabel(run: RunRecord): string {
  if (!isDesignRunRecord(run)) return run.label;
  const label = run.metadata?.label;
  return typeof label === "string"
    ? label
    : run.compiledWorkflowSpec.name + " · " + run.id;
}
