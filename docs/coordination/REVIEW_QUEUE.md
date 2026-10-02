# Coordinator Review Queue

Updated: 2026-10-02

## A — Engine
**Status:** Round 2 QAMP A-D acceptance suite complete; ready for Agent F review.

Delivered:
- `engine/fixtures/qamp-scenarios.mjs`
- `engine/tests/qamp-scenarios.test.mjs`
- `docs/coordination/proposals/QAMP_SCENARIO_ACCEPTANCE.md`

Validation:
- frozen v1 engine unchanged;
- **5/5 Round 2 tests pass**;
- no representational gap found.

Concept coverage:
- A local overlap / off-critical-path quantum work;
- B dependency-driven synchronization wall with fixed reservation;
- C communication-dominated local paths with low QPU utilization;
- D throughput-limited bounded admission with independent consumer progress.

Recommended status: **PORT**. Stop after Agent F review unless a concrete acceptance defect is identified.

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
