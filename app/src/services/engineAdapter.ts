import type { SimulationResult, WorkflowSpec } from "../contracts";

export interface EngineAdapter {
  simulate(spec: WorkflowSpec): Promise<SimulationResult>;
}

export class EngineUnavailableError extends Error {
  constructor() {
    super("The shared simulation engine is not connected to this UI branch.");
    this.name = "EngineUnavailableError";
  }
}

export const unavailableEngineAdapter: EngineAdapter = {
  async simulate(_spec) {
    throw new EngineUnavailableError();
  }
};
