import type { WorkflowDesignBundle } from "../design/bundle";

export const customLogicalBundle: WorkflowDesignBundle;
export const scenarioALogicalBundle: WorkflowDesignBundle;
export const scenarioBLogicalBundle: WorkflowDesignBundle;
export const scenarioCLogicalBundle: WorkflowDesignBundle;
export const scenarioDLogicalBundle: WorkflowDesignBundle;
export const logicalPresetBundles: Readonly<{
  custom: WorkflowDesignBundle;
  A: WorkflowDesignBundle;
  B: WorkflowDesignBundle;
  C: WorkflowDesignBundle;
  D: WorkflowDesignBundle;
}>;
