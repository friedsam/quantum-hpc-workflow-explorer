# Coordinator Review Queue

Updated: 2026-10-02

## A — Engine
**Status:** Round 2C design/configuration layer complete; ready for Agent F review.

Delivered:
- `engine/design/types.d.ts`
- `engine/design/compile.mjs`
- `engine/examples/qamp-a-design-compile.mjs`
- `engine/tests/design-compile.test.mjs`
- `docs/coordination/proposals/DESIGN_CONFIGURATION_LAYER.md`

Result:
- frozen DES/v1 unchanged;
- design/config/profile compile cleanly to existing `WorkflowSpec`;
- bounded repeat expansion remains pre-DES;
- actor/rank identity is optional metadata only;
- provenance retained in exact `RunRecord`;
- no optimizer/stochastic/rank-scaling inference added;
- **5/5 exact branch-content runtime checks pass**.

Recommended status: **PORT above frozen v1**. Stop after Agent F review.

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
