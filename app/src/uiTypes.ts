import type { SimulationResult, WorkflowSpec } from "./domain/types";

export interface RunRecord {
  id: string;
  createdAt: number;
  label: string;
  spec: WorkflowSpec;
  result: SimulationResult;
}
