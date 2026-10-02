# Coordinator Review Queue

Updated: 2026-10-02

## A — Engine
**Status:** **checkpoint reviewed — PORT after bounded repair R1-R5.**

Accepted:
- concrete `resourcePoolId` binding;
- deterministic constant service times;
- already-expanded DAG core input;
- communication cost on dependencies;
- strict deterministic FIFO/no backfilling;
- QPU inactive capacity on-demand/released for v1.

Required repair:
1. explicit fixed classical reservation by pool;
2. per-QPU-pool in-flight admission limit;
3. same-timestamp causal closure before admission/start;
4. suppress communication events for zero-cost dependencies;
5. freeze half-open interval semantics and rename aggregate communication metric.

Coordinator review written to `agent/engine` at `2a5e230ebdb45bfcd5c07d80b34aa3fd25ddc5a0`.

No additional engine features are requested in this pass.

## B — Playback
**Status:** checkpoint accepted — conditional PORT; waiting for Agent A v1 compatibility check.

## C — UI
**Status:** active/ready for review when reported by user.

## D — Graphics
**Status:** active/ready for review when reported by user.

## E — Research/validation
**Status:** checkpoint accepted — PORT; one bounded Rao addendum requested.

## F — Coordinator
**Status:** active.

Immediate F tasks:
- freeze v1 after A completes R1-R5;
- reconcile E Rao addendum;
- then run B compatibility and bind C to frozen types;
- keep main coherent.
