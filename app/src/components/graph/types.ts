export interface DagNodeView {
  id: string;
  label: string;
  detail: string;
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
