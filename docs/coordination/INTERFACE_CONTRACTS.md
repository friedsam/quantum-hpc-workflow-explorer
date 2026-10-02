# Shared Interface Contracts

Owner: Agent F  
Status: **v0 provisional**  
Updated: 2026-10-02

The goal is to let A/B/C/D/E work independently without creating separate execution models.

Agent A should propose implementation-ready v1. Agent F decides the accepted version.

## Non-negotiable semantic boundaries

1. Task state and resource-allocation state are distinct.
2. Queue state is distinct from task/resource state.
3. Communication/transfer is represented by dependency/event cost.
4. Metrics are derived from the simulation trajectory, not independently recomputed by UI/playback.
5. Presentation time may differ from simulation time.
6. Playback may aggregate repeated events but cannot alter final counts/metrics/order constraints.
7. QPU capacity is configurable.
8. Initial loops are bounded repeated subgraphs/templates and may be unrolled internally.

## Provisional workflow shape

```ts
type ResourceKind = "cpu" | "gpu" | "qpu" | "network";

interface WorkflowSpec {
  id: string;
  name: string;
  tasks: TaskSpec[];
  dependencies: DependencySpec[];
  resources: ResourcePoolSpec[];
  policy: PolicySpec;
  repeats?: RepeatSpec[];
}

interface TaskSpec {
  id: string;
  label: string;
  resourceKind: ResourceKind;
  resourceCount: number;
  serviceTime: TimeModel;
  batchable?: boolean;
  metadata?: Record<string, unknown>;
}

interface DependencySpec {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  dataBytes?: number;
  fixedLatencyS?: number;
  bandwidthBytesPerS?: number;
}

interface ResourcePoolSpec {
  id: string;
  kind: ResourceKind;
  capacity: number;
  costPerUnitSecond?: number;
}

interface PolicySpec {
  allocation: "fixed" | "release-aware";
  maxInFlightQuantum?: number;
  batching?: number;
}
```

Exact names/fields may change at v1.

## Simulation output contract

The engine owns exact simulation state.

```ts
interface SimulationEvent {
  seq: number;
  simTimeS: number;
  type: string;
  taskId?: string;
  resourcePoolId?: string;
  metadata?: Record<string, unknown>;
}

interface ResourceInterval {
  resourcePoolId: string;
  startS: number;
  endS: number;
  state: "active" | "allocated-idle" | "released";
  units: number;
  taskId?: string;
}

interface TaskInterval {
  taskId: string;
  startS: number;
  endS: number;
  state: "ready" | "running" | "waiting" | "complete";
}

interface QueueSample {
  simTimeS: number;
  resourcePoolId: string;
  depth: number;
}

interface Metrics {
  makespanS: number;
  utilizationByPool: Record<string, number>;
  allocatedResourceSecondsByPool: Record<string, number>;
  idleAllocatedResourceSecondsByPool: Record<string, number>;
  queueWaitSecondsByPool: Record<string, number>;
  communicationSeconds: number;
}

interface SimulationResult {
  workflowId: string;
  events: SimulationEvent[];
  resourceIntervals: ResourceInterval[];
  taskIntervals: TaskInterval[];
  queueSeries: QueueSample[];
  metrics: Metrics;
  assumptions: string[];
}
```

## Playback contract

Agent B may derive presentation artifacts:

```ts
interface VisualKeyframe {
  presentationTimeMs: number;
  sourceEventSeqRange: [number, number];
  simTimeRangeS: [number, number];
  label: string;
  snapshot: VisualSnapshot;
}
```

A `VisualKeyframe` must reference the source event range that produced it.

Playback rules:
- exact simulation trace remains intact;
- repetitive regimes may be compressed;
- first/last/decision events may be slowed for human comprehension;
- minimum dwell time is a presentation concern only.

## UI contract

Agent C consumes `WorkflowSpec` and `SimulationResult`.

The UI may:
- edit supported workflow/policy parameters;
- request a simulation;
- render graph/timeline/metrics/comparison;
- derive purely presentational labels/formatting.

The UI may not:
- invent queue depth;
- compute makespan independently;
- infer hidden resource state;
- alter engine ordering/dependency semantics.

## Change process

To change this contract, record the proposal in the relevant role/status document and flag it in `REVIEW_QUEUE.md`. Agent F records the accepted change in `DECISION_LOG.md`.
