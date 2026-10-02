# Engine checkpoint

Dependency-free deterministic discrete-event core for Agent A's first checkpoint.

## Run

```bash
node engine/examples/minimal.mjs
node --test engine/tests/engine.test.mjs
```

Node's built-in test runner is the only test dependency.

## Current scope

- already-expanded DAG input;
- deterministic constant service times;
- dependency latency/data-transfer delay;
- explicit resource-pool capacity;
- deterministic FIFO resource queues;
- configurable QPU capacity;
- optional `maxInFlightQuantum` admission bound;
- fixed vs release-aware CPU/GPU allocation accounting;
- trace, task/resource intervals, queue samples, utilization/resource-time/cost metrics.

## Explicit non-scope

- production scheduling;
- stochastic prediction;
- external QPU queue prediction;
- network contention;
- backfilling;
- dynamic/unbounded control flow;
- UI/playback timing.

See `docs/coordination/proposals/ENGINE_INTERFACE_V1.md` for the proposed shared contract changes.
