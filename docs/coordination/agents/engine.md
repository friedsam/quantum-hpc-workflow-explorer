# Agent A — Engine

Branch: `agent/engine`

## Mission

Own the technically authoritative workflow model, discrete-event execution semantics, metrics, and engine tests.

## Initial assignment

Produce:
1. an implementation-ready proposal for shared interface v1;
2. minimal event-queue/state-transition architecture;
3. one deterministic workflow run;
4. tests/invariants from `VALIDATION_CONTRACT.md`.

Start from the smallest primitives required by the 10-day product. Do not build a generalized workflow runtime.

## Boundaries

Do not:
- implement product UI;
- implement animation/presentation timing;
- encode legacy A–D visual states as engine semantics;
- assume QPU capacity is always 1;
- add arbitrary branching/dynamic loops unless a current acceptance case requires them.

## Current status

**Checkpoint 1 complete; pending Agent F contract/promotion review.**

### Verified implementation/result

- Deterministic, dependency-free discrete-event engine over an already-expanded DAG.
- Dependency completion gates task readiness and includes fixed latency plus optional data/bandwidth delay.
- Explicit per-pool capacity with deterministic strict FIFO queues and stable task-order tie breaking.
- QPU capacity is configurable; capacity 1 is only an example preset.
- `maxInFlightQuantum` separates admission throttle delay from resource-queue delay.
- Fixed vs release-aware CPU/GPU allocation changes allocation/cost accounting without changing execution ordering.
- Minimal acceptance workflow: CPU prep -> two QPU branches -> CPU join.
- Minimal result: makespan 9.25 s; second QPU task queue wait 3.0 s; aggregate communication duration 1.5 s.
- No external dependencies added.

### Proposed interface changes

See `docs/coordination/proposals/ENGINE_INTERFACE_V1.md`.

Main deltas from v0:
- task binds to `resourcePoolId`, not only `resourceKind`;
- deterministic constant `TimeModel` only in v1;
- engine input is an already-expanded DAG; bounded-loop expansion happens before simulation;
- `queued` is an explicit task interval state;
- queue wait and admission wait are distinct;
- active/released resource-time and cost metrics are explicit.

### Unresolved semantics for Agent F

1. Accept `resourcePoolId` as the concrete task binding, or retain a kind + selector abstraction.
2. Freeze already-expanded DAG as the core input, or keep a shared `RepeatSpec` above the engine adapter.
3. Current implementation applies `maxInFlightQuantum` globally across all QPU pools; decide whether the public contract should make this global, per-pool, or both.
4. Current `fixed`/release-aware policy applies allocation accounting to CPU/GPU only; QPU idle capacity is on-demand/released. Confirm this cost/resource convention.
5. `communicationSeconds` is aggregate dependency-transfer duration and may exceed/overlap wall-clock communication time. Confirm naming before UI exposure.
6. Network contention, batching, and backfilling remain intentionally out of v1 until a validated acceptance case requires them.

### Exact checkpoint paths/commits

Implementation/proposal checkpoint before handoff metadata: `dd46777fab030ce2ef7f585b4460412df007aa8c`.

- `engine/index.mjs`
- `engine/types.d.ts`
- `engine/examples/minimal.mjs`
- `engine/tests/engine.test.mjs`
- `engine/README.md`
- `docs/coordination/proposals/ENGINE_INTERFACE_V1.md`

### Tests

Local validation against the exact checkpoint source:

```bash
node --test engine/tests/engine.test.mjs
```

Result: **12/12 passed, 0 failed**.

Coverage includes:
- dependency/data readiness;
- resource capacity;
- queue non-negativity and QPU saturation;
- deterministic output/event order;
- monotonic simulation time;
- interval/metric accounting consistency;
- makespan/completion consistency;
- zero-latency serial limiting case;
- QPU capacity >1;
- `maxInFlightQuantum` admission throttling;
- fixed vs release-aware allocation;
- cycle and over-capacity validation.

### Promotion intent

Proposed for promotion/reuse:
- v1 contract semantics in `ENGINE_INTERFACE_V1.md`;
- invariant tests/acceptance cases;
- deterministic engine behavior and event vocabulary;
- minimal example.

Investigation-only:
- none.

Implementation language/layout is not intended to force the final application scaffold.

### Recommended promotion status

**PORT** — promote/freeze the reviewed semantics and tests, then port or reimplement the compact engine into the final TypeScript/application scaffold selected by Agent F/C.
