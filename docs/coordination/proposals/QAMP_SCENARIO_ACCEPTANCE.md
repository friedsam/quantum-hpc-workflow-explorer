# QAMP Scenarios A–D — frozen-v1 semantic acceptance suite

Status: Agent A Round 2 checkpoint candidate  
Branch: `agent/engine`  
Engine contract: frozen v1; **no engine changes requested or made**

## Purpose

The legacy A–D animations used hand-authored frame/counter state. This suite preserves the **workflow mechanisms**, not literal frame counts or legacy `Working / Idle / Blocked` ontology.

All service/communication times below are synthetic and intentionally small. They are acceptance fixtures, not measured HPC/QPU predictions.

Source basis:
- Scenario B legacy page explicitly frames a global barrier/blocking cascade and a serialized quantum segment.
- Scenario D legacy page explicitly frames a serial QPU bottleneck with throttling and no global barrier.
- Legacy A/C pages are primarily frame players without equivalent explanatory prose; Agent F's Round 2 instructions define the acceptance semantics used here.

Executable fixtures: `engine/fixtures/qamp-scenarios.mjs`  
Regression suite: `engine/tests/qamp-scenarios.test.mjs`

## Scenario A — loosely coupled overlap

### QAMP concept

A local quantum dependency does not stop unrelated classical progress.

### Scaled fixture

- CPU capacity 2; QPU capacity 1.
- Independent classical task: 10 s.
- Local quantum path:
  - CPU prep 1 s
  - QPU evaluation 4 s
  - local CPU consumer 1 s
- No global join.
- No admission limit or provider queue delay.

### Assertions

- independent classical interval overlaps QPU execution;
- QPU runs `[1,5)`;
- local quantum consumer completes at 6 s;
- independent classical work completes at 10 s and defines makespan;
- QPU queue wait = 0;
- QPU admission wait = 0;
- no throttling; no meaningful queue buildup.

Interpretation: quantum work is off the critical path even though it is a true dependency for one local continuation.

## Scenario B — synchronization wall

### QAMP concept

A subset performs quantum preparation, but a later collective classical phase cannot continue until the complete required quantum result set is available.

### Scaled fixture

- Fixed CPU pool: capacity/reservation 4.
- Two 1-unit preparation tasks run for 1 s.
- QPU capacity 1.
- Two quantum evaluations: 3 s and 2 s.
- Both quantum tasks are admitted immediately (`maxInFlightQuantumByPool.qpu = 2`).
- Collective continuation uses all 4 CPU units for 1 s and depends on both quantum tasks.

### Assertions

- quantum completions occur at 4 s and 6 s;
- collective continuation starts exactly at 6 s, never after only the first result;
- makespan = 7 s;
- QPU admission wait = 0 and no `task_throttled` event occurs;
- QPU resource queue wait = 3 s from serialization;
- fixed CPU active resource-seconds = 6;
- fixed CPU allocated resource-seconds = 28;
- fixed CPU allocated-idle resource-seconds = 22.

Interpretation: the wall is dependency/synchronization-driven, not admission-control-driven. Fixed classical reservation remains allocated while quantum work gates the collective continuation.

## Scenario C — latency/data-movement wall

### QAMP concept

Independent paths are limited by communication/data-movement delay rather than a global barrier or QPU throughput backlog.

### Scaled fixture

Three independent paths:

`CPU producer -> delayed dependency -> QPU -> delayed dependency -> local CPU consumer`

- CPU producers: 1 s each.
- Producer-to-QPU modeled communication: 4 s, 8 s, 12 s.
- QPU service: 0.5 s each.
- QPU-to-consumer modeled communication: 4 s each.
- Consumers: 0.5 s each.
- QPU capacity 1; no admission throttling.
- No external/provider queue delay.

### Assertions

- quantum starts at 5 s, 9 s, 13 s;
- makespan = 18 s;
- `aggregateCommunicationSeconds = 36` s;
- aggregate modeled communication exceeds total task service time (6 s);
- QPU queue wait = 0 and admission wait = 0;
- maximum QPU queue depth <= 1 transiently;
- QPU utilization < 10%;
- consumer 1 starts at 9.5 s before quantum task 3 starts at 13 s.

Interpretation: the QPU is frequently idle waiting for arrivals; communication dominates while consumers remain independent.

## Scenario D — throughput-limited asynchronous workflow

### QAMP concept

Many independent paths share a serial QPU. Throughput is QPU-limited, but bounded admission prevents unbounded queue growth and completed paths resume independently.

### Scaled fixture

Six independent paths:

`CPU prep -> QPU -> local CPU continuation`

- CPU capacity 6.
- All preparations: 0.5 s.
- QPU capacity 1.
- Each QPU task: 2 s.
- `maxInFlightQuantumByPool.qpu = 2`.
- Each local continuation: 0.5 s.
- No global join and no provider queue delay.

### Assertions

- makespan = 13 s;
- maximum QPU resource queue depth = 1;
- QPU queue wait = 10 s;
- policy/admission wait = 20 s and is strictly positive;
- all observed QPU in-flight counts <= 2;
- QPU utilization > 90%;
- first consumer starts at 2.5 s while the last QPU task completes at 12.5 s;
- first three consumers start at 2.5 s, 4.5 s, 6.5 s;
- four tasks are initially held by admission control.

Interpretation: policy wait and resource queueing are distinct, while local completions drain independently without a global barrier.

## Validation result

Round 2 test command:

```bash
node --test engine/tests/qamp-scenarios.test.mjs
```

Result: **5/5 tests passed, 0 failed** against frozen v1 engine behavior.

The frozen engine implementation itself was not modified for Round 2.

## Representational-gap check

**No v1 gap found.**

All four QAMP mechanisms can be expressed using frozen v1 primitives:
- DAG dependencies;
- explicit CPU/QPU pools and capacity;
- fixed classical reservation;
- dependency communication delay;
- per-QPU admission bounds;
- queue/admission/resource-time metrics.

No legacy `Working / Idle / Blocked` state or screenshot-count semantics are required.

## Promotion recommendation

**PORT**:
- `engine/fixtures/qamp-scenarios.mjs`
- `engine/tests/qamp-scenarios.test.mjs`
- this acceptance specification

Do not port or reintroduce legacy frame-state logic as engine semantics.
