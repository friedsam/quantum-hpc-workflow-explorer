# Agent A proposal — Engine interface v1

Status: proposed for Agent F review  
Branch: `agent/engine`

## Scope

This proposal defines the smallest executable contract needed for the 10-day product:

`expanded DAG -> deterministic discrete-event simulation -> trace + intervals + metrics`

It does not define UI, playback timing, a production scheduler, arbitrary control flow, stochastic prediction, or vendor-specific runtime behavior.

## Changes from provisional v0

### 1. Tasks bind to a concrete resource pool

**Current limitation:** `TaskSpec.resourceKind` is ambiguous when more than one pool has the same kind.

**Proposed change:** replace `resourceKind` with `resourcePoolId`.

**Affected producers/consumers:** Builder/presets must choose a pool ID; playback/UI read the resolved pool from the result rather than infer it by kind.

**Migration:** trivial for single-pool-per-kind fixtures; use `cpu`, `gpu`, `qpu` as stable IDs where appropriate.

### 2. Deterministic time model only in v1

**Current limitation:** `TimeModel` is undefined and could imply unsupported stochastic semantics.

**Proposed change:** initial engine supports only `{ kind: "constant", seconds: number }`.

**Migration:** synthetic or measured values remain explicit assumptions in the workflow/preset. A stochastic model can be added later without changing the DES state model.

### 3. Input is an already-expanded DAG

**Current limitation:** `RepeatSpec` is not defined, and a generic repeat language would add control-flow scope beyond the initial product.

**Proposed change:** remove `repeats` from engine v1. Bounded loops are represented by explicitly repeated/unrolled task nodes before simulation.

**Affected producers:** presets/Builder adapter may generate repeated nodes.  
**Affected consumers:** none; result semantics become simpler and explicit.

### 4. Communication stays on dependencies

Dependency completion time is:

`fixedLatencyS + dataBytes / bandwidthBytesPerS`

when data transfer is specified. Transfers can overlap because network contention is not modeled in v1. Communication emits start/complete events and delays target readiness; it is not encoded as task state.

### 5. Queue/admission distinction

`maxInFlightQuantum` bounds admitted QPU work (`queued + running`). A QPU task whose dependencies are satisfied but cannot yet be admitted remains in `ready` state.

This creates two distinct metrics:

- `queueWaitSecondsByPool`: queued -> running;
- `admissionWaitSecondsByPool`: ready -> queued, including QPU throttle delay.

This prevents throttling delay from being mislabeled as backend queue depth.

### 6. Task interval state uses `queued`, not generic `waiting`

`waiting` conflates dependency wait, policy throttle, and resource queue wait. Proposed task intervals are:

`ready | queued | running | complete`

Dependency wait is implicit before `ready`; communication has explicit events.

### 7. Resource accounting is explicit

New metrics:

- `activeResourceSecondsByPool`
- `releasedResourceSecondsByPool`
- `costByPool`
- `totalCost`

For the initial model:

- `fixed` allocation keeps inactive **CPU/GPU** capacity allocated-idle through makespan;
- `release-aware` releases inactive CPU/GPU capacity;
- QPU inactive capacity is treated as released/on-demand under both policies.

Allocation policy changes resource-time/cost accounting, not task ordering.

## Scheduler semantics

- DAG dependency/data safety is mandatory.
- Each pool has configured integer capacity.
- Pool queue discipline is strict FIFO; stable workflow task order breaks ties.
- No backfilling in v1.
- QPU capacity is read from the pool; capacity 1 is not assumed.
- Same deterministic input must produce byte-equivalent JSON output.

## Event vocabulary

- `task_ready`
- `task_throttled`
- `task_queued`
- `task_started`
- `task_completed`
- `communication_started`
- `communication_completed`

Events are emitted in deterministic simulation order with monotonically increasing `seq`.

## Acceptance case

The included minimal example has:

`CPU prep -> two independent QPU tasks -> CPU join`

with nonzero dependency latency and QPU capacity 1. Expected makespan is 9.25 s. The second QPU task waits 3.0 s in the QPU resource queue. This exercises DAG fan-out/fan-in, communication, queueing, QPU serialization, and classical idle allocation.

## Requested Agent F decision

Recommended status: **PROMOTE contract semantics after review; PORT/REIMPLEMENT implementation as needed for the final TypeScript scaffold.**

The implementation intentionally has zero external dependencies so Agent A does not pre-empt Agent C/F decisions about the eventual application scaffold.
