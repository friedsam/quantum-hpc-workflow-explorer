# Coordinator Review Queue

Updated: 2026-10-02

## A — Engine
**Status:** Round 4F tutorial-scale Scenario-A checkpoint complete; ready for Agent F review.

Delivered:
- compact symbolic `range(start,end)` and `all-except(actorOrdinals)` selectors;
- selector validation + symbolic manifest preservation;
- 4-rank baseline critical-path correction (background 10 s, local branch 8 s);
- separate compact 1,000-rank Scenario-A producer with four DES tasks;
- exact actor snapshots 1000/0/0 -> 999/1/0 -> 1000/0/0;
- zero QPU queue/admission wait and no global synchronization;
- 1,000-actor performance benchmark and scaling analysis.

Validation:
- exact-blob 1,000-rank suite: **5/5 PASS**;
- Round 4D: **7/7 PASS**;
- Round 4A actor: **6/6 PASS**;
- Round 2C compiler: **7/7 PASS**;
- branch CI run `38118493908`: **SUCCESS, 47/47 engine tests PASS**.

Measured Node-22 benchmark:
- compile mean 0.099 ms;
- simulate mean 0.046 ms;
- four actor snapshots mean 2.592 ms/batch (~0.648 ms/snapshot).

Scaling finding:
- current actor × task/wait scan is fine for compact 1,000-rank A;
- indicative 200-job B / 1,000-request C-D expansions likely require future actor-index/cache optimization.

Review artifact: `docs/coordination/proposals/ROUND4F_TUTORIAL_SCALE_A.md`

Recommended: **PORT selector/model/demo/test changes; DEFER actor-state optimization. STOP for Agent F review.**

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
