# Coordinator Review Queue

Updated: 2026-10-02

## A — Engine
**Status:** Round 4H queued actor-wait admission repair complete; ready for Agent F review.

Delivered:
- additive authored actor-wait event `queued`;
- compile mapping `queued -> existing task_queued`;
- no DES event/scheduler/metric change;
- deterministic 1,000-actor Scenario-D stress fixture with QPU capacity 1 and max-in-flight 50;
- exact 1 running +49 resource-queued +950 policy-held distinction;
- actor state 50 Blocked /950 Idle at initial admission;
- first-result local progress + slot replenishment without Working/Blocked collision;
- immediate `task_queued` + `task_started` same-timestamp actor-wait acceptance;
- end-to-end return to Working/Idle;
- optimized projector/reference compatibility.

Validation:
- branch CI `38321518049`: **63/63 PASS**;
- D1000 simulation mean 268.27 ms;
- projector build mean 89.77 ms;
- 2,002-transition summary sweep total 3.239 ms.

Migration:
- `ActorWaitTaskEvent` adds `queued`;
- `CompiledActorWaitEventType` adds `task_queued`;
- app mirror types must receive same union additions when ported.

Review artifact: `docs/coordination/proposals/ROUND4H_QUEUED_ACTOR_WAIT.md`

Recommended: **PORT queued actor-wait union/compiler mapping + D acceptance tests. STOP for Agent F review.**

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
