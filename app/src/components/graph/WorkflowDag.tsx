import { useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  type Connection,
  type Edge,
  type Node
} from "@xyflow/react";
import type { DagViewModel } from "./types";
import { layoutDag } from "./layout";
import { WorkflowNode } from "./WorkflowNode";

interface Props {
  model: DagViewModel;
  selectedTaskId?: string;
  onSelectTask?: (taskId: string) => void;
  onConnectTasks?: (sourceTaskId: string, targetTaskId: string) => void;
  onDeleteDependencies?: (dependencyIds: string[]) => void;
}

const nodeTypes = { workflow: WorkflowNode };

export function WorkflowDag({
  model,
  selectedTaskId,
  onSelectTask,
  onConnectTasks,
  onDeleteDependencies
}: Props) {
  const sourceNodes = useMemo<Node[]>(
    () =>
      model.nodes.map((node) => ({
        id: node.id,
        type: "workflow",
        position: { x: 0, y: 0 },
        data: { label: node.label, detail: node.detail },
        draggable: false,
        selectable: true,
        deletable: false
      })),
    [model.nodes]
  );

  const sourceEdges = useMemo<Edge[]>(
    () =>
      model.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: "out",
        targetHandle: "in",
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed },
        deletable: Boolean(onDeleteDependencies)
      })),
    [model.edges, onDeleteDependencies]
  );

  const topologyKey = useMemo(
    () =>
      JSON.stringify({
        nodes: model.nodes.map((node) => [node.id, node.label, node.detail]),
        edges: model.edges.map((edge) => [edge.id, edge.source, edge.target])
      }),
    [model]
  );

  const [nodes, setNodes] = useState<Node[]>(sourceNodes);
  const [edges, setEdges] = useState<Edge[]>(sourceEdges);
  const [layoutError, setLayoutError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLayoutError("");

    layoutDag(sourceNodes, sourceEdges)
      .then((layout) => {
        if (cancelled) return;
        setNodes(layout.nodes);
        setEdges(layout.edges);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setNodes(sourceNodes);
        setEdges(sourceEdges);
        setLayoutError(error instanceof Error ? error.message : "ELK layout failed.");
      });

    return () => {
      cancelled = true;
    };
    // Selection/playback state is intentionally excluded: layout is topology/size driven only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topologyKey]);

  const displayedNodes = useMemo(
    () => nodes.map((node) => ({ ...node, selected: node.id === selectedTaskId })),
    [nodes, selectedTaskId]
  );

  function connect(connection: Connection) {
    if (!onConnectTasks || !connection.source || !connection.target) return;
    onConnectTasks(connection.source, connection.target);
  }

  return (
    <section className="surface workflow-surface" aria-labelledby="workflow-heading">
      <div className="surface-heading">
        <div>
          <p className="section-kicker">Structure</p>
          <h2 id="workflow-heading">Workflow DAG</h2>
        </div>
        <span className="muted-label">React Flow + deterministic ELK layered layout</span>
      </div>

      {layoutError ? <div className="notice error" role="status">{layoutError}</div> : null}

      <div className="workflow-dag" aria-label="Workflow directed acyclic graph">
        <ReactFlow
          nodes={displayedNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          colorMode="dark"
          fitView
          fitViewOptions={{ padding: 0.22 }}
          minZoom={0.35}
          maxZoom={1.6}
          nodesDraggable={false}
          nodesConnectable={Boolean(onConnectTasks)}
          elementsSelectable
          onNodeClick={(_, node) => onSelectTask?.(node.id)}
          onConnect={connect}
          onEdgesDelete={(deleted) => onDeleteDependencies?.(deleted.map((edge) => edge.id))}
          proOptions={{ hideAttribution: true }}
        >
          <Controls showInteractive={false} />
          <Background gap={22} size={1} />
        </ReactFlow>
      </div>

      <div className="dag-help">
        {onConnectTasks
          ? "Connect the right handle of a source task to the left handle of a target task. Select an edge and press Delete/Backspace to remove it."
          : "Read-only workflow topology."}
      </div>
      <div className="edge-list" aria-label="Dependencies">
        {model.edges.map((edge) => (
          <span className="edge-chip" key={edge.id}>{edge.source} → {edge.target}</span>
        ))}
      </div>
    </section>
  );
}
