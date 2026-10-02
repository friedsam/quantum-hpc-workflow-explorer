export type ResourceKind = "cpu" | "gpu" | "qpu";

export interface ConstantTimeModel {
  kind: "constant";
  seconds: number;
}

export type TimeModel = ConstantTimeModel;

export interface WorkflowSpec {
  id: string;
  name: string;
  tasks: TaskSpec[];
  dependencies: DependencySpec[];
  resources: ResourcePoolSpec[];
  policy: PolicySpec;
  assumptions?: string[];
}

export interface TaskSpec {
  id: string;
  label: string;
  resourcePoolId: string;
  resourceCount: number;
  serviceTime: TimeModel;
  metadata?: Record<string, unknown>;
}

export interface DependencySpec {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  dataBytes?: number;
  fixedLatencyS?: number;
  bandwidthBytesPerS?: number;
}

export interface ResourcePoolSpec {
  id: string;
  kind: ResourceKind;
  capacity: number;
  costPerUnitSecond?: number;
}

export interface PolicySpec {
  allocation: "fixed" | "release-aware";
  fixedReservationByPool?: Record<string, number>;
  maxInFlightQuantumByPool?: Record<string, number>;
}

export type SimulationEventType =
  | "task_ready"
  | "task_throttled"
  | "task_queued"
  | "task_started"
  | "task_completed"
  | "communication_started"
  | "communication_completed";

export interface SimulationEvent {
  seq: number;
  simTimeS: number;
  type: SimulationEventType;
  taskId?: string;
  resourcePoolId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * All intervals use half-open semantics [startS, endS).
 */
export interface ResourceInterval {
  resourcePoolId: string;
  startS: number;
  endS: number;
  state: "active" | "allocated-idle" | "released";
  units: number;
  taskId?: string;
}

/**
 * All intervals use half-open semantics [startS, endS).
 * Task completion is represented authoritatively by task_completed events,
 * not by a zero-width "complete" interval.
 */
export interface TaskInterval {
  taskId: string;
  startS: number;
  endS: number;
  state: "ready" | "queued" | "running";
}

export interface QueueSample {
  simTimeS: number;
  resourcePoolId: string;
  depth: number;
}

export interface Metrics {
  makespanS: number;
  utilizationByPool: Record<string, number>;
  activeResourceSecondsByPool: Record<string, number>;
  allocatedResourceSecondsByPool: Record<string, number>;
  idleAllocatedResourceSecondsByPool: Record<string, number>;
  releasedResourceSecondsByPool: Record<string, number>;
  queueWaitSecondsByPool: Record<string, number>;
  admissionWaitSecondsByPool: Record<string, number>;
  aggregateCommunicationSeconds: number;
  costByPool: Record<string, number>;
  totalCost: number;
}

export interface SimulationResult {
  workflowId: string;
  events: SimulationEvent[];
  resourceIntervals: ResourceInterval[];
  taskIntervals: TaskInterval[];
  queueSeries: QueueSample[];
  metrics: Metrics;
  assumptions: string[];
}
