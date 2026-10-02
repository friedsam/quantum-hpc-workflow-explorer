import type { SimulationResult, WorkflowSpec } from "../domain/types";
import { simulateWorkflow, validateWorkflowSpec } from "../engine/runtime.mjs";

export interface EngineAdapter {
  validate(spec: WorkflowSpec): true;
  simulate(spec: WorkflowSpec): Promise<SimulationResult>;
}

export const localEngineAdapter: EngineAdapter = {
  validate(spec) {
    return validateWorkflowSpec(spec);
  },
  async simulate(spec) {
    return simulateWorkflow(structuredClone(spec));
  }
};
