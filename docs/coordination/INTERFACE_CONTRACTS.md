# Shared Interface Contracts

Owner: Agent F  
Status: **v1 FROZEN for 10-day integration**  
Updated: 2026-10-02

The shared product contract is now frozen unless Agent F records a concrete compatibility defect.

## Product boundary

The core product is a generic user-authored workflow explorer:

`create/edit WorkflowSpec → validate → simulate → inspect/animate SimulationResult → compare alternatives`

QAMP Scenarios A-D are the first acceptance/preset suite. IBM Fe4S4 SQD is a later real-workflow reference preset.

## Engine input

```ts
type ResourceKind = "cpu" | "gpu" | "qpu";

interface WorkflowSpec {
  id: string;
  name: string;
  tasks: TaskSpec[];
  dependencies: DependencySpec[];
  resources: ResourcePoolSpec[];
  policy: PolicySpec;
  assumptions?: string[];
}

interface TaskSpec {
  id: string;
  label: string;
  resourcePoolId: string;
  resourceCount: number;
  serviceTime: { kind: "constant"; seconds: number };
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
  fixedReservationByPool?: Record<string, number>;
  maxInFlightQuantumByPool?: Record<string, number>;
}
```

### Semantics

- Tasks bind to explicit resource pools.
- Input to the DES core is an already-expanded DAG.
- Bounded-repeat/template expansion happens before simulation.
- `capacity` is available modeled pool capacity; fixed classical reservation is separate.
- Under fixed allocation, CPU/GPU task concurrency is limited by the reservation; unused reserved units are `allocated-idle`; capacity outside the reservation is `released`.
- Under release-aware allocation, CPU/GPU capacity is allocated on demand up to pool capacity.
- QPU capacity is on-demand/released in v1.
- `maxInFlightQuantumByPool` is per QPU pool.
- in-flight quantum work = running + QPU-resource-queued admitted tasks.
- dependency-ready work held by policy remains ready/policy-waiting and does not increase QPU resource queue depth.
- pool queueing is deterministic FIFO with workflow task order as tie-break; no backfilling.
- network contention, stochastic service time, live provider queues and arbitrary dynamic control flow are outside v1.

## Dependency / communication semantics

For positive modeled transfer:

`transferS = fixedLatencyS + dataBytes / bandwidthBytesPerS`

- zero-cost dependencies are pure control edges and release immediately;
- zero-cost edges emit no communication events;
- positive-duration transfers emit communication start/complete events;
- independent transfers may overlap;
- `aggregateCommunicationSeconds` is the sum of positive modeled transfer durations, not wall-clock or critical-path communication time.

## Equal-time rule

At simulation time `t`:

1. process completion/dependency-release consequences to causal closure;
2. perform admission and resource-start decisions;
3. if zero-duration started tasks complete at `t`, process another same-time causal round.

## Simulation output

```ts
interface SimulationEvent {
  seq: number;
  simTimeS: number;
  type:
    | "task_ready"
    | "task_throttled"
    | "task_queued"
    | "task_started"
    | "task_completed"
    | "communication_started"
    | "communication_completed";
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
  state: "ready" | "queued" | "running";
}

interface QueueSample {
  simTimeS: number;
  resourcePoolId: string;
  depth: number;
}

interface Metrics {
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

All intervals are half-open: `[startS, endS)`. Completion is authoritative via `task_completed`; there is no zero-width completion interval.

## Playback contract

Agent B may derive presentation-only keyframes from `SimulationResult`. Playback may compress repetitive trace regions and alter presentation dwell time, but may not reorder simulation causality or recalculate metrics. Every keyframe must retain source event sequence provenance.

## UI contract

Agent C consumes the frozen `WorkflowSpec` and `SimulationResult`.

The UI may:
- create/add/delete/edit supported tasks and dependencies;
- create/edit resource pools and supported policy fields;
- validate structural input;
- request simulation;
- render graph/timeline/metrics/playback/comparison;
- derive presentation-only formatting/deltas.

The UI may not:
- maintain a second canonical workflow/result type system;
- invent queue depth, policy wait or resource state;
- calculate authoritative makespan/utilization/cost;
- alter engine ordering/dependency semantics.

## Graphics contract

- editable workflow DAG: React Flow + ELK layered;
- runtime resource/state view: structured inline SVG with stable logical grid/named anchors;
- auto-layout runs only on topology/size changes, not playback updates;
- Figma is optional for later static polish, not runtime truth.

## Change process

Any v1 change requires a concrete compatibility defect, affected producer/consumer analysis, migration impact, and regression test. Agent F records the accepted change in DECISION_LOG.
