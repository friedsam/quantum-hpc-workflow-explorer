import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { DebugTaskState } from "../../causal/systemState.mjs";

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  detail: string;
  debugState?: DebugTaskState;
}

const stateLabels: Partial<Record<DebugTaskState, string>> = {
  running: "RUN",
  queued: "QUEUE",
  "policy-held": "POLICY HELD",
  "dependency-gated": "DEPENDENCY GATE",
  complete: "complete"
};

export function WorkflowNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  const state = nodeData.debugState;
  const classes = [
    "workflow-node-card",
    selected ? "selected" : "",
    state ? "debug-" + state : ""
  ].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <Handle id="in" type="target" position={Position.Left} />
      <div className="dag-node-content">
        <strong>{nodeData.label}</strong>
        <span>{nodeData.detail}</span>
        {state && state !== "pending" ? (
          <span className="dag-debug-state">{stateLabels[state] ?? state}</span>
        ) : null}
      </div>
      <Handle id="out" type="source" position={Position.Right} />
    </div>
  );
}
