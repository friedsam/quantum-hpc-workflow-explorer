# Coordinator Review Queue

Updated: 2026-10-02

## A — Engine
**Status:** bounded repair R1-R5 complete; ready for Agent F freeze review.

Delivered:
- explicit fixed classical reservation by pool + E5 fixture;
- per-QPU-pool in-flight admission + E4/multi-QPU fixtures;
- same-timestamp causal closure;
- zero-cost control dependencies without fake communication events;
- half-open intervals, event-authoritative completion, `aggregateCommunicationSeconds`;
- validator runtime/type consistency fix.

Validation: **17/17 local tests pass** against Git-blob-verified branch files.

Review candidate: `docs/coordination/proposals/ENGINE_INTERFACE_V1.md`

Recommended status: **PORT / FREEZE v1**. No additional engine features requested.

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
