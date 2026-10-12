# Coordinator Review Queue

Updated: 2026-10-02

## A — Engine
**Status:** Round 4G indexed actor-projection checkpoint complete; ready for Agent F review.

Delivered:
- pre-indexed actor participation/wait intervals and event-time index;
- WeakMap-cached backward-compatible detail/count APIs;
- optional direct group-summary / transition-time APIs;
- exact semantic equivalence against pre-index reference;
- 1,000-actor / 200-quantum Scenario-B stress fixture;
- real Node-22 benchmark of precompute, per-cursor, full signature sweep and memory;
- precise Scenario-D admission-trigger gap analysis.

Validation:
- B-200 precompute p95: **15.639 ms**;
- current playback-style signature p95: **0.454 ms/cursor**;
- direct summary p95: **0.00378 ms/cursor**;
- old reference B-200 summary: ~**0.94 s/snapshot**;
- semantic equivalence covers 4-rank A/B, 1,000-rank A, B-200, transition boundaries and blocked reasons.

Scenario-D gap:
- current ready/started/completed actor-wait triggers cannot express exactly 50 admitted Blocked vs ~950 policy-held Idle;
- minimum proposed future above-DES trigger: actor wait activation on existing DES `task_queued`;
- **not implemented pending Agent F decision**.

Review artifact: `docs/coordination/proposals/ROUND4G_ACTOR_PROJECTOR.md`

Recommended: **PORT indexed projector + stress/test; DEFER queued-trigger extension. STOP for Agent F review.**

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
