import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  detail?: string;
  multiplicity?: number;
  resourceTag?: string;
  debugState?: string;
  statusText?: string;
}

const stateLabels: Record<string, string> = {
  running: "RUNNING",
  queued: "RESOURCE QUEUED",
  "policy-held": "POLICY HELD",
  "dependency-gated": "WAITING",
  complete: "COMPLETE",
  pending: "PENDING"
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
      <div className="logical-node-head">
        <strong>{nodeData.label}</strong>
        {nodeData.multiplicity !== undefined ? (
          <span className="multiplicity-badge">×{nodeData.multiplicity}</span>
        ) : null}
      </div>
      {nodeData.resourceTag ? (
        <span className="resource-instance-tag">{nodeData.resourceTag}</span>
      ) : null}
      {nodeData.detail ? <span className="dag-node-detail">{nodeData.detail}</span> : null}
      {state && state !== "pending" ? (
        <span className="dag-debug-state">
          {nodeData.statusText || stateLabels[state] || state}
        </span>
      ) : null}
      <Handle id="out" type="source" position={Position.Right} />
    </div>
  );
}
