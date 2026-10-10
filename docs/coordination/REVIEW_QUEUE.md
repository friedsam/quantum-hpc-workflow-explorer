# Coordinator Review Queue

Updated: 2026-10-02

## A — Engine
**Status:** Round 4A logical multiplicity / actor-state model complete; ready for Agent F review.

Delivered:
- additive logical task multiplicity above frozen DES;
- persistent actor-group counts distinct from task multiplicity/resourceCount;
- explicit actor participation across CPU/QPU/CPU stages;
- pairwise/all-to-all logical dependency expansion;
- compact actor assignments in CompilationManifest;
- derived actor Working/Blocked/Idle state from manifest + SimulationResult;
- compact Scenario B acceptance model with four persistent ranks and five compiled tasks.

Validation:
- Round 4A actor suite: **4/4 PASS**;
- Round 2C compiler regressions: **7/7 PASS**;
- total focused checks: **11/11 PASS**.

Frozen DES/v1 unchanged. No UI/optimizer/provider-queue/rank-node work added.

Review artifact: `docs/coordination/proposals/ROUND4_ACTOR_MODEL.md`

Recommended status: **PORT**. Stop after Agent F review.

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
