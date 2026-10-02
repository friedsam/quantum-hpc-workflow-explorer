import type { WorkflowSpec } from "./types";
import { validateWorkflowSpec } from "../engine/runtime.mjs";

export interface ValidationIssue {
  severity: "error" | "warning";
  path: string;
  message: string;
}

export function validateForUi(spec: WorkflowSpec): ValidationIssue[] {
  try {
    validateWorkflowSpec(spec);
    return [];
  } catch (error: unknown) {
    return [{
      severity: "error",
      path: "workflow",
      message: error instanceof Error ? error.message : "Workflow validation failed."
    }];
  }
}
