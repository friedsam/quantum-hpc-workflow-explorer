# Coordinator Review Queue

Updated: 2026-10-02

## A — Engine
**Status:** checkpoint ready for Agent F review.

Delivered on `agent/engine`:
- proposed implementation-ready v1 WorkflowSpec/SimulationResult contract;
- deterministic DAG discrete-event architecture;
- minimal deterministic example;
- validation-contract invariant tests (12/12 pass).

Review proposal: `docs/coordination/proposals/ENGINE_INTERFACE_V1.md`  
Implementation checkpoint: `dd46777fab030ce2ef7f585b4460412df007aa8c`

Agent F decisions requested:
- concrete `resourcePoolId` task binding;
- expanded-DAG boundary vs shared `RepeatSpec`;
- global vs per-pool `maxInFlightQuantum`;
- fixed/release-aware accounting convention;
- aggregate communication metric naming.

Recommended status: **PORT** (freeze reviewed semantics/tests; port/reimplement into final scaffold).

Do not build UI.

## B — Playback
**Status:** start independently against mock v0 trace.

Deliver:
- trace → semantic keyframe → presentation scheduler design;
- explicit strategy for repetitive-event compression;
- deterministic proof using a Scenario-D-like stress trace;
- recommendation for playback controls/pacing.

Do not create a second simulator.

## C — UI
**Status:** start independently against mock v0 data.

Deliver:
- serious product information architecture;
- Builder/Explorer/Compare user flow;
- component boundaries;
- React/TypeScript migration/scaffold recommendation.

Do not calculate simulation metrics.

## D — Graphics
**Status:** start.

Deliver:
- benchmark the same representative diagram with robust candidates;
- strict grid/anchor approach;
- recommendation for runtime workflow graph and runtime state graphics;
- reject approaches that are fragile under revision.

Matplotlib is not a candidate for architecture/state diagrams.

## E — Research/validation
**Status:** start.

Deliver:
- validation matrix for analytical baseline, queue/resource policy literature, QAMP/IBM workflow;
- define one serious QAMP/IBM preset;
- identify assumptions that should NOT survive from legacy A–D;
- acceptance cases for engine tests.

Do not expand into a new scheduler/research platform.

## F — Coordinator
**Status:** active.

Do not integrate substantive feature code until the first checkpoint from A–E has been reviewed.

Immediate F tasks:
- maintain shared contracts;
- resolve semantic conflicts;
- enforce 10-day boundary;
- decide promotion status;
- keep `main` coherent.
