# Agent A proposal — Engine interface v1

Status: **R1-R5 repaired; pending Agent F freeze**  
Branch: `agent/engine`

## Scope

Smallest executable contract for the 10-day product:

`expanded DAG -> deterministic discrete-event simulation -> trace + intervals + metrics`

Explicit non-scope: production scheduling, stochastic prediction, live provider queues, network contention, backfilling, arbitrary control flow, optimization, and playback/UI timing.

## Accepted v1 input model

### Workflow/tasks/resources

- Tasks bind to an explicit `resourcePoolId`.
- `ResourcePoolSpec.capacity` is maximum modeled pool capacity available to the workflow.
- Engine input is an already-expanded DAG.
- Bounded-loop expansion belongs in a preset/Builder adapter before simulation.
- v1 service time is deterministic only:

```ts
type TimeModel = {
  kind: "constant";
  seconds: number;
};
```

### Policy

```ts
interface PolicySpec {
  allocation: "fixed" | "release-aware";
  fixedReservationByPool?: Record<string, number>;
  maxInFlightQuantumByPool?: Record<string, number>;
}
```

#### Fixed classical reservation

For CPU/GPU pools under `allocation: "fixed"`:

- reservation = `fixedReservationByPool[poolId]`;
- if omitted, reservation defaults to full pool capacity;
- task concurrency cannot exceed the reservation;
- reserved but inactive units are `allocated-idle`;
- capacity outside the reservation is `released`;
- cost charges `active + allocated-idle` resource-seconds only.

Under `release-aware`, classical tasks allocate on demand up to pool capacity and inactive capacity is `released`.

QPU capacity is on-demand/released under either allocation policy in v1.

#### Per-pool quantum admission

`maxInFlightQuantumByPool[poolId]` limits each QPU pool independently.

`in flight = running + resource-queued quantum tasks`.

Dependency-ready work held by admission control remains `ready`; it is policy wait and does not increase QPU resource queue depth.

## Dependency / communication semantics

For a dependency with modeled transfer:

`transferS = fixedLatencyS + dataBytes / bandwidthBytesPerS`

where omitted latency/bytes are zero.

- A dependency with transferS = 0 is a pure control/DAG edge.
- Zero-cost control edges release immediately at the same simulation timestamp.
- Zero-cost edges emit no `communication_started` / `communication_completed` events.
- Positive-duration dependency transfers emit communication events and delay target readiness.
- Transfers may overlap; network contention is not modeled in v1.

Metric:

- `aggregateCommunicationSeconds` = sum of all positive modeled dependency transfer durations.
- It is not a wall-clock or critical-path communication time and may exceed elapsed communication time when transfers overlap.

## Deterministic scheduling semantics

- Dependency/data readiness is mandatory.
- Pool capacity is explicit and configurable.
- Fixed CPU/GPU policy additionally constrains active use by the configured reservation.
- Pool queue discipline is strict FIFO.
- Workflow task order is the deterministic tie-break for equal readiness/enqueue time.
- No backfilling in v1.
- QPU capacity is read from each pool; capacity 1 is not assumed.

### Same-timestamp causal rule

For simulation time `t`:

1. process all completion and dependency-release consequences at `t` to causal closure;
2. only then perform admission and resource-start decisions;
3. if newly started zero-duration tasks complete at `t`, process a new same-time causal round.

This prevents scheduler decisions from depending on the accidental insertion order of equal-time causal events.

## Output semantics

### Events

- `task_ready`
- `task_throttled`
- `task_queued`
- `task_started`
- `task_completed`
- `communication_started`
- `communication_completed`

Events have monotonically increasing `seq` in deterministic simulation order.

### Task/resource intervals

All intervals are half-open: **`[startS, endS)`**.

Task interval states:

- `ready`
- `queued`
- `running`

Completion is represented authoritatively by `task_completed`; there is no zero-width `complete` task interval.

Resource interval states remain:

- `active`
- `allocated-idle`
- `released`

### Metrics

The repaired v1 result includes:

- `makespanS`
- `utilizationByPool`
- `activeResourceSecondsByPool`
- `allocatedResourceSecondsByPool`
- `idleAllocatedResourceSecondsByPool`
- `releasedResourceSecondsByPool`
- `queueWaitSecondsByPool`
- `admissionWaitSecondsByPool`
- `aggregateCommunicationSeconds`
- `costByPool`
- `totalCost`

`queueWaitSecondsByPool` measures queued -> running.  
`admissionWaitSecondsByPool` measures ready -> queued, including policy throttle.

## Repaired acceptance cases

### Minimal reference

`CPU prep -> two serialized QPU branches -> CPU join`

Expected:
- makespan = 9.25 s;
- second QPU task resource-queue wait = 3 s;
- aggregate modeled communication = 1.5 s.

### E4 bounded quantum in-flight

Six independent 2 s QPU tasks, QPU capacity 1, in-flight limit 2.

Expected:
- makespan = 12 s;
- maximum QPU resource queue depth = 1;
- additional ready tasks remain in policy wait;
- aggregate queue wait = 10 s;
- aggregate admission wait = 20 s.

### E5 scaled IBM fixed-allocation accounting

Accepted synthetic fixture from Agent E.

Expected:
- makespan = 18 s;
- QPU active resource-seconds = 4;
- CPU active resource-seconds = 32;
- fixed 4-unit reservation: CPU allocated = 72, allocated-idle = 40;
- release-aware comparison: CPU allocated = 32, allocated-idle = 0.

## Validation

Canonical command:

```bash
node --test engine/tests/engine.test.mjs
```

Agent A repaired suite: **17/17 passed, 0 failed**.

## Requested Agent F decision

Freeze this repaired candidate as shared v1, then PORT/reimplement the compact engine and tests into the final application scaffold. Do not merge the entire lab branch wholesale.
