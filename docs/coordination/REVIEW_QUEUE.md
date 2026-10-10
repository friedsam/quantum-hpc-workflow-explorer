# Coordinator Review Queue

Updated: 2026-10-02

## A — Engine
**Status:** Round 4D Scenario-A fidelity / regime task complete; ready for Agent F review.

Delivered:
- explicit deterministic actor ordinal-set selection;
- faithful four-rank Scenario-A actor fixture;
- one-rank local quantum wait with complementary ranks continuing classical work;
- baseline no QPU queue and no policy hold;
- local result consumption without full-allocation join;
- fixed-topology parameter regimes showing A-like no-queue -> D-like queue transition;
- explicit proof that B-like global synchronization requires a full-group authored gate/dependency;
- task service-time wall-time semantics documented.

Validation:
- Round 4D suite: **7/7 PASS**;
- repaired Round 4A actor suite: **6/6 PASS**;
- Round 2C compiler suite: **7/7 PASS**;
- total focused checks: **20/20 PASS**.

Frozen DES/v1 unchanged. No UI/optimizer/provider-queue/stochastic model added.

Review artifact: `docs/coordination/proposals/ROUND4D_SCENARIO_A_REGIMES.md`

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
