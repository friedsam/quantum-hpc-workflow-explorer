import { useEffect, useMemo, useRef, useState } from "react";
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

interface DagBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DagViewport {
  x: number;
  y: number;
  zoom: number;
}

const LONG_DAG_MIN_ZOOM = 0.85;
const DAG_EDGE_MARGIN = 22;

// ELK uses 210 x 144 for unmeasured workflow cards. Match those estimates
// while deriving camera bounds, so the first row isn't hidden off-screen.
function boundsForLayout(nodes: Node[]): DagBounds | null {
  if (nodes.length === 0) return null;
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const node of nodes) {
    const width = Number(node.measured?.width ?? node.width ?? 210);
    const height = Number(node.measured?.height ?? node.height ?? 144);
    left = Math.min(left, node.position.x);
    top = Math.min(top, node.position.y);
    right = Math.max(right, node.position.x + width);
    bottom = Math.max(bottom, node.position.y + height);
  }
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function horizontalLimits(bounds: DagBounds, canvasWidth: number, zoom: number) {
  return {
    start: DAG_EDGE_MARGIN - bounds.x * zoom,
    end: canvasWidth - DAG_EDGE_MARGIN - (bounds.x + bounds.width) * zoom
  };
}

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
  const [expanded, setExpanded] = useState(false);
  const [layoutRevision, setLayoutRevision] = useState(0);
  const [layoutBounds, setLayoutBounds] = useState<DagBounds | null>(null);
  const [wideBounds, setWideBounds] = useState<DagBounds | null>(null);
  const [horizontalPosition, setHorizontalPosition] = useState(0);
  const graphRef = useRef<HTMLDivElement | null>(null);
  const fitViewRef = useRef<((maxZoom: number) => void) | null>(null);
  const setViewportRef = useRef<((viewport: DagViewport) => void) | null>(null);
  const getViewportRef = useRef<(() => DagViewport) | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLayoutError("");

    layoutDag(sourceNodes, sourceEdges)
      .then((layout) => {
        if (cancelled) return;
        setNodes(layout.nodes);
        setEdges(layout.edges);
        setLayoutBounds(boundsForLayout(layout.nodes));
        setLayoutRevision((revision) => revision + 1);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setNodes(sourceNodes);
        setEdges(sourceEdges);
        setLayoutBounds(null);
        setLayoutRevision((revision) => revision + 1);
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

  // ELK resolves after React Flow mounts. Wide chains need readable card size,
  // so start at the first task rather than shrinking the entire chain.
  // Other layouts keep the overview fit. Never refit during playback.
  useEffect(() => {
    if (!layoutRevision) return;
    const frame = window.requestAnimationFrame(() => {
      const canvas = graphRef.current;
      const bounds = layoutBounds;
      const longHorizontal = Boolean(
        canvas &&
        bounds &&
        bounds.width > bounds.height * 2 &&
        bounds.width * LONG_DAG_MIN_ZOOM > canvas.clientWidth - 2 * DAG_EDGE_MARGIN
      );
      if (canvas && bounds && longHorizontal) {
        setWideBounds(bounds);
        setHorizontalPosition(0);
        const zoom = LONG_DAG_MIN_ZOOM;
        const horizontal = horizontalLimits(bounds, canvas.clientWidth, zoom);
        setViewportRef.current?.({
          x: horizontal.start,
          y: canvas.clientHeight / 2 - (bounds.y + bounds.height / 2) * zoom,
          zoom
        });
      } else {
        setWideBounds(null);
        fitViewRef.current?.(expanded ? 1.05 : 0.85);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [layoutRevision, layoutBounds, expanded]);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", escape);
    };
  }, [expanded]);

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

  function navigateHorizontally(percent: number) {
    if (!wideBounds || !graphRef.current) return;
    const viewport = getViewportRef.current?.();
    if (!viewport) return;
    const limits = horizontalLimits(
      wideBounds, graphRef.current.clientWidth, viewport.zoom
    );
    if (limits.end >= limits.start) return;
    const x = limits.start + (limits.end - limits.start) * percent / 100;
    setHorizontalPosition(percent);
    setViewportRef.current?.({ ...viewport, x });
  }

  function recordViewport(viewport: DagViewport) {
    if (!wideBounds || !graphRef.current) return;
    const limits = horizontalLimits(
      wideBounds, graphRef.current.clientWidth, viewport.zoom
    );
    const distance = limits.start - limits.end;
    if (distance <= 0) {
      setHorizontalPosition(0);
      return;
    }
    const percent = Math.max(0, Math.min(100,
      Math.round(100 * (limits.start - viewport.x) / distance)
    ));
    setHorizontalPosition((previous) => previous === percent ? previous : percent);
  }

  return (
    <section
      className={expanded
        ? "surface workflow-surface workflow-surface-expanded"
        : "surface workflow-surface"}
      aria-labelledby="workflow-heading"
    >
      <div className="surface-heading">
        <div>
          <p className="section-kicker">
            {logical ? "Authored logical model" : debugSnapshot ? "Workflow lens" : "Structure"}
          </p>
          <h2 id="workflow-heading">{heading}</h2>
        </div>
        <div className="workflow-heading-actions">
          <span className="muted-label">
            {logical
              ? straightLogicalEdges
                ? "one authored task = one node · linear logical flow"
                : "one authored task = one node · multiplicity does not change geometry"
              : debugSnapshot
                ? "fixed geometry · state styling follows shared simulation cursor"
                : "React Flow + deterministic ELK layered layout"}
          </span>
          <button
            className="secondary-action"
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? "Return to page" : "Expand diagram"}
          </button>
        </div>
      </div>

      {layoutError ? (
        <div className="notice error" role="status">{layoutError}</div>
      ) : null}

      <div
        className="workflow-dag"
        aria-label="Workflow directed acyclic graph"
        ref={graphRef}
      >
        <ReactFlow
          nodes={displayedNodes}
          edges={displayedEdges}
          nodeTypes={nodeTypes}
          colorMode="dark"
          onInit={(instance) => {
            fitViewRef.current = (maxZoom) => {
              void instance.fitView({
                padding: 0.14,
                minZoom: 0.1,
                maxZoom,
                duration: 180
              });
            };
            getViewportRef.current = () => instance.getViewport();
            setViewportRef.current = (viewport) => {
              void instance.setViewport(viewport, { duration: 0 });
            };
          }}
          onMoveEnd={(_, viewport) => recordViewport(viewport)}
          fitView
          fitViewOptions={{ padding: 0.14, minZoom: 0.1, maxZoom: 0.85 }}
          minZoom={0.1}
          maxZoom={1.6}
          zoomOnScroll={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
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

      {wideBounds ? (
        <div className="dag-horizontal-navigation">
          <label htmlFor="dag-horizontal-position">Scroll through workflow</label>
          <span>Start</span>
          <input
            id="dag-horizontal-position"
            type="range"
            min="0"
            max="100"
            step="1"
            value={horizontalPosition}
            aria-label="Horizontal diagram position"
            onChange={(event) =>
              navigateHorizontally(Number(event.target.value))
            }
          />
          <span>End</span>
          <small>Drag empty canvas to pan; use + / − to zoom</small>
        </div>
      ) : null}

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
