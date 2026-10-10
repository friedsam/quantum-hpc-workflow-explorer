export interface DagNodeView {
  id: string;
  label: string;
  detail?: string;
  multiplicity?: number;
  resourceTag?: string;
  accessibleLabel?: string;
}

export interface DagEdgeView {
  id: string;
  source: string;
  target: string;
}

export interface DagViewModel {
  nodes: DagNodeView[];
  edges: DagEdgeView[];
}

export interface DagRuntimeState {
  state?:
    | "running"
    | "queued"
    | "policy-held"
    | "dependency-gated"
    | "complete"
    | "pending";
  text?: string;
}
