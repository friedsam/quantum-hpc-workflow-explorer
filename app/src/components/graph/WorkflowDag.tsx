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
import type { SystemStateSnapshot } from "../../causal/systemState.mjs";
import type { DagRuntimeState, DagViewModel } from "./types";
import { layoutDag } from "./layout";
import { WorkflowNode } from "./WorkflowNode";

interface Props {
  model: DagViewModel;
  selectedTaskId?: string;
  onSelectTask?: (taskId: string) => void;
  onConnectTasks?: (sourceTaskId: string, targetTaskId: string) => void;
  onDeleteDependencies?: (dependencyIds: string[]) => void;
  debugSnapshot?: SystemStateSnapshot;
  runtimeByNodeId?: Record<string, DagRuntimeState>;
  heading?: string;
  logical?: boolean;
}

const nodeTypes = { workflow: WorkflowNode };

function isSimpleLinearDag(model: DagViewModel): boolean {
  if (model.nodes.length < 2) return false;
  if (model.edges.length !== model.nodes.length - 1) return false;

  const incoming = new Map(model.nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(model.nodes.map((node) => [node.id, 0]));

  for (const edge of model.edges) {
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
    outgoing.set(edge.source, (outgoing.get(edge.source) ?? 0) + 1);
  }

  if (
    [...incoming.values()].some((count) => count > 1) ||
    [...outgoing.values()].some((count) => count > 1)
  ) {
    return false;
  }

  return (
    [...incoming.values()].filter((count) => count === 0).length === 1 &&
    [...outgoing.values()].filter((count) => count === 0).length === 1
  );
}

export function WorkflowDag({
  model,
  selectedTaskId,
  onSelectTask,
  onConnectTasks,
  onDeleteDependencies,
  debugSnapshot,
  runtimeByNodeId,
  heading = "Workflow DAG",
  logical = false
}: Props) {
  const sourceNodes = useMemo<Node[]>(
    () =>
      model.nodes.map((node) => ({
        id: node.id,
        type: "workflow",
        position: { x: 0, y: 0 },
        data: {
          label: node.label,
          detail: node.detail,
          multiplicity: node.multiplicity,
          resourceTag: node.resourceTag
        },
        ariaLabel:
          node.accessibleLabel ??
          [node.label, node.detail, node.resourceTag].filter(Boolean).join(". "),
        draggable: false,
        selectable: true,
        deletable: false
      })),
    [model.nodes]
  );

  const straightLogicalEdges = useMemo(
    () => logical && isSimpleLinearDag(model),
    [logical, model]
  );

  const sourceEdges = useMemo<Edge[]>(
    () =>
      model.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: "out",
        targetHandle: "in",
        type: straightLogicalEdges ? "straight" : "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed },
        deletable: Boolean(onDeleteDependencies)
      })),
    [model.edges, onDeleteDependencies, straightLogicalEdges]
  );

  const topologyKey = useMemo(
    () =>
      JSON.stringify({
        nodes: model.nodes.map((node) => [
          node.id,
          node.label,
          node.detail,
          node.multiplicity,
          node.resourceTag
        ]),
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
        setLayoutError(
          error instanceof Error ? error.message : "ELK layout failed."
        );
      });

    return () => {
      cancelled = true;
    };
    // Runtime/playback state is intentionally excluded: layout is topology/size driven only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topologyKey]);

  const displayedNodes = useMemo(
    () =>
      nodes.map((node) => {
        const runtime =
          runtimeByNodeId?.[node.id] ??
          (debugSnapshot
            ? {
                state: debugSnapshot.dag.taskStateById[node.id],
                text: undefined
              }
            : undefined);

        return {
          ...node,
          selected: node.id === selectedTaskId,
          data: {
            ...node.data,
            debugState: runtime?.state,
            statusText: runtime?.text
          }
        };
      }),
    [nodes, selectedTaskId, debugSnapshot, runtimeByNodeId]
  );

  const activeCommunicationIds = useMemo(
    () => new Set(debugSnapshot?.dag.activeCommunicationDependencyIds ?? []),
    [debugSnapshot]
  );

  const displayedEdges = useMemo(
    () =>
      edges.map((edge) => ({
        ...edge,
        className: activeCommunicationIds.has(edge.id)
          ? "dag-edge communication-active"
          : "dag-edge"
      })),
    [edges, activeCommunicationIds]
  );

  function connect(connection: Connection) {
    if (!onConnectTasks || !connection.source || !connection.target) return;
    onConnectTasks(connection.source, connection.target);
  }

  return (
    <section className="surface workflow-surface" aria-labelledby="workflow-heading">
      <div className="surface-heading">
        <div>
          <p className="section-kicker">
            {logical ? "Authored logical model" : debugSnapshot ? "Workflow lens" : "Structure"}
          </p>
          <h2 id="workflow-heading">{heading}</h2>
        </div>
        <span className="muted-label">
          {logical
            ? straightLogicalEdges
              ? "one authored task = one node · linear logical flow"
              : "one authored task = one node · multiplicity does not change geometry"
            : debugSnapshot
              ? "fixed geometry · state styling follows shared simulation cursor"
              : "React Flow + deterministic ELK layered layout"}
        </span>
      </div>

      {layoutError ? (
        <div className="notice error" role="status">{layoutError}</div>
      ) : null}

      <div className="workflow-dag" aria-label="Workflow directed acyclic graph">
        <ReactFlow
          nodes={displayedNodes}
          edges={displayedEdges}
          nodeTypes={nodeTypes}
          colorMode="dark"
          fitView
          fitViewOptions={{ padding: 0.22 }}
          minZoom={0.35}
          maxZoom={1.6}
          nodesDraggable={false}
          nodesConnectable={Boolean(onConnectTasks)}
          elementsSelectable
          nodesFocusable
          edgesFocusable
          onNodeClick={(_, node) => onSelectTask?.(node.id)}
          onConnect={connect}
          onEdgesDelete={(deleted) =>
            onDeleteDependencies?.(deleted.map((edge) => edge.id))
          }
          proOptions={{ hideAttribution: true }}
        >
          <Controls showInteractive={false} />
          <Background gap={22} size={1} />
        </ReactFlow>
      </div>

      <div className="dag-help">
        {onConnectTasks
          ? "Connect the right handle of a source task to the left handle of a target task. Select an edge and press Delete/Backspace to remove it."
          : runtimeByNodeId
            ? "Logical multiplicity and per-instance resource demand remain distinct while status changes."
            : debugSnapshot
              ? "RUNNING, RESOURCE QUEUED, POLICY HELD and WAITING are synchronized to the selected simulation time."
              : "Read-only workflow topology."}
      </div>
      <div className="edge-list" aria-label="Dependencies">
        {model.edges.map((edge) => (
          <span
            className={
              activeCommunicationIds.has(edge.id)
                ? "edge-chip communication-active"
                : "edge-chip"
            }
            key={edge.id}
          >
            {edge.source} → {edge.target}
            {activeCommunicationIds.has(edge.id) ? " · TRANSFER" : ""}
          </span>
        ))}
      </div>
    </section>
  );
}
