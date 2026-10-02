import { useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node
} from "@xyflow/react";
import type { DagViewModel } from "./types";
import { layoutDag } from "./layout";

interface Props {
  model: DagViewModel;
  selectedTaskId?: string;
  onSelectTask?: (taskId: string) => void;
}

export function WorkflowDag({ model, selectedTaskId, onSelectTask }: Props) {
  const sourceNodes = useMemo<Node[]>(
    () =>
      model.nodes.map((node) => ({
        id: node.id,
        position: { x: 0, y: 0 },
        data: {
          label: (
            <div className="dag-node-content">
              <strong>{node.label}</strong>
              <span>{node.detail}</span>
            </div>
          )
        },
        className: "dag-node",
        draggable: false,
        selectable: true
      })),
    [model.nodes]
  );

  const sourceEdges = useMemo<Edge[]>(
    () =>
      model.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed }
      })),
    [model.edges]
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
    // topologyKey intentionally gates layout. Selection/playback state must not relayout the DAG.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topologyKey]);

  const displayedNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        className: selectedTaskId === node.id ? "dag-node selected" : "dag-node"
      })),
    [nodes, selectedTaskId]
  );

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
          colorMode="dark"
          fitView
          fitViewOptions={{ padding: 0.22 }}
          minZoom={0.35}
          maxZoom={1.6}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          onNodeClick={(_, node) => onSelectTask?.(node.id)}
          proOptions={{ hideAttribution: true }}
        >
          <Controls showInteractive={false} />
          <Background gap={22} size={1} />
        </ReactFlow>
      </div>

      <div className="edge-list" aria-label="Dependencies">
        {model.edges.map((edge) => (
          <span className="edge-chip" key={edge.id}>
            {edge.source} → {edge.target}
          </span>
        ))}
      </div>
    </section>
  );
}
