# Coordinator Review Queue

Updated: 2026-10-02

## A — Engine
**Status:** start.

Deliver:
- proposed implementation-ready v1 WorkflowSpec/SimulationResult contract;
- discrete-event architecture;
- minimal deterministic example;
- invariant-test plan.

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
**Status:** checkpoint 1 ready for review.

Delivered on `agent/research`:
- `docs/research/VALIDATION_MATRIX.md`;
- serious IBM/QAMP Fe4S4 SQD structural preset;
- legacy A–D assumption disposition;
- deterministic acceptance cases E1–E6.

Requested Agent A/F decisions:
- define workflow-level fixed reservation quantity/scope separately from task active usage;
- define `maxInFlightQuantum` as running + resource-queued admitted jobs, with policy wait separate;
- keep external/provider queue delay explicit/user-supplied or defer it rather than inventing a provider scheduler.

Research recommendation: **PORT** validated semantics/fixtures, not wholesale prose.

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
