// Temporary compatibility boundary.
// During the Agent-F v1 freeze pass, replace these re-exports with the frozen
// shared engine contract/validator. Components should not import model.ts directly.
export {
  cloneWorkflowSpec,
  fixtures,
  getFixture,
  validateWorkflowSpec
} from "./model";

export type {
  FixturePair,
  Metrics,
  SimulationResult,
  TaskSpec,
  ValidationIssue,
  WorkflowSpec
} from "./model";
