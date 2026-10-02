import ELK from "elkjs/lib/elk.bundled.js";
import type { Edge, Node } from "@xyflow/react";

const elk = new ELK();

const layoutOptions = {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.edgeRouting": "ORTHOGONAL",
  "elk.randomSeed": "1",
  "elk.spacing.nodeNode": "44",
  "elk.layered.spacing.nodeNodeBetweenLayers": "68",
  "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX"
};

export async function layoutDag(nodes: Node[], edges: Edge[]): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const graph = {
    id: "workflow-root",
    layoutOptions,
    children: nodes.map((node) => ({
      id: node.id,
      width: Number(node.measured?.width ?? node.width ?? 210),
      height: Number(node.measured?.height ?? node.height ?? 96)
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target]
    }))
  };

  const result = await elk.layout(graph);
  const positions = new Map((result.children ?? []).map((node) => [node.id, node]));

  return {
    nodes: nodes.map((node) => {
      const placed = positions.get(node.id);
      return {
        ...node,
        position: {
          x: placed?.x ?? 0,
          y: placed?.y ?? 0
        }
      };
    }),
    edges
  };
}
