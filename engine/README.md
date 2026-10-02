# Engine checkpoint

Dependency-free deterministic discrete-event core for the Quantum–HPC Workflow Explorer.

## Run

```bash
node engine/examples/minimal.mjs
node --test engine/tests/engine.test.mjs
```

Node's built-in test runner is the only test dependency.

## v1 candidate scope

- already-expanded DAG input;
- deterministic constant service times;
- explicit resource-pool capacity;
- fixed CPU/GPU reservations via `fixedReservationByPool`;
- dependency latency/data-transfer delay;
- zero-cost DAG edges without fake communication events;
- deterministic strict FIFO resource queues, no backfilling;
- configurable QPU capacity;
- per-QPU-pool `maxInFlightQuantumByPool`;
- same-timestamp causal closure before scheduling;
- fixed vs release-aware allocation accounting;
- half-open task/resource intervals `[startS, endS)`;
- trace, queue samples, utilization/resource-time/cost metrics;
- `aggregateCommunicationSeconds` as aggregate modeled dependency-transfer duration.

## Explicit non-scope

- production scheduling;
- stochastic prediction;
- live external/provider queue prediction;
- network contention;
- backfilling;
- dynamic/unbounded control flow;
- UI/playback timing.

The reference values are synthetic/illustrative unless a preset explicitly cites measured evidence.

See `docs/coordination/proposals/ENGINE_INTERFACE_V1.md` for the repaired shared-contract candidate.
