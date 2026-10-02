import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  detail: string;
}

export function WorkflowNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  return (
    <div className={selected ? "workflow-node-card selected" : "workflow-node-card"}>
      <Handle id="in" type="target" position={Position.Left} />
      <div className="dag-node-content">
        <strong>{nodeData.label}</strong>
        <span>{nodeData.detail}</span>
      </div>
      <Handle id="out" type="source" position={Position.Right} />
    </div>
  );
}
