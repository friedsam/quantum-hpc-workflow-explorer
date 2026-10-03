import type {
  CompilationResult,
  CompilationManifest,
  RunConfiguration,
  RunRecord,
  SystemProfile,
  WorkflowDesign
} from "./types";
import type { SimulationResult, WorkflowSpec } from "../domain/types";

export function compileWorkflowDesignDetailed(
  design: WorkflowDesign,
  runConfiguration: RunConfiguration,
  systemProfile: SystemProfile
): CompilationResult;

export function compileWorkflowDesign(
  design: WorkflowDesign,
  runConfiguration: RunConfiguration,
  systemProfile: SystemProfile
): WorkflowSpec;

export function createRunRecord(input: {
  id: string;
  design: WorkflowDesign;
  runConfiguration: RunConfiguration;
  systemProfile: SystemProfile;
  compiledWorkflowSpec: WorkflowSpec;
  compilationManifest: CompilationManifest;
  simulationResult: SimulationResult;
  metadata?: Record<string, unknown>;
}): RunRecord;
