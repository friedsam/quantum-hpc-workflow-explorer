import type { SimulationResult, WorkflowSpec } from "../domain/types";

export function validateWorkflowSpec(spec: WorkflowSpec): true;
export function simulateWorkflow(spec: WorkflowSpec): SimulationResult;
