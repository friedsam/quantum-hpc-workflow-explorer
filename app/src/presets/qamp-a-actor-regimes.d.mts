import type {
  CompilationResult,
  RunConfiguration,
  SystemProfile,
  WorkflowDesign
} from "../design/types";
import type { WorkflowSpec } from "../domain/types";

export const qampScenarioAActorDesign: WorkflowDesign;
export const qampScenarioAActorRunConfiguration: RunConfiguration;
export const qampScenarioABaselineProfile: SystemProfile;
export const qampScenarioALongQuantumProfile: SystemProfile;
export const qampScenarioAActorCompilation: CompilationResult;
export const qampScenarioAActorWorkflowSpec: WorkflowSpec;

export function makeScenarioASingleRequestProfile(options?: {
  id?: string;
  quantumSeconds?: number;
  backgroundSeconds?: number;
}): SystemProfile;

export const qampScenarioAMultiRequestDesign: WorkflowDesign;
export const qampScenarioAMultiRequestRunConfiguration: RunConfiguration;
export const qampScenarioAMultiBelowCapacityProfile: SystemProfile;
export const qampScenarioAMultiOverloadProfile: SystemProfile;

export function makeScenarioAMultiRequestProfile(options: {
  id: string;
  submitSeconds: number[];
  quantumSeconds: number[];
  backgroundSeconds?: number;
}): SystemProfile;

export function compileScenarioAProfile(
  profile: SystemProfile
): CompilationResult;

export function compileScenarioAMultiProfile(
  profile: SystemProfile
): CompilationResult;
