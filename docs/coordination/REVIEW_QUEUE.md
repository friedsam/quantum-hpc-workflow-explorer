# Coordinator Review Queue

Updated: 2026-10-02

## A — Engine
**Status:** active.

Deliver:
- proposed implementation-ready v1 WorkflowSpec/SimulationResult contract;
- discrete-event architecture;
- minimal deterministic example;
- invariant-test plan.

Additional integration question from B review:
- define interval-boundary semantics for ResourceInterval/TaskInterval snapshots (B currently assumes half-open intervals, start <= t < end);
- show whether steady repetitive engine traces use one semantic signature or a repeated multi-signature cycle.

Do not build UI.

## B — Playback
**Status:** **checkpoint accepted — conditional PORT; waiting for Agent A v1 compatibility check.**

Verified branch checkpoint:
- head reviewed: `900676e41a02404459cc9e7a89159bbbc454b845`;
- coordinator review added on B branch at `f927cfe3d7f9fcd2ab0fc473c74e7987e72c5320`;
- 3005-event synthetic stress trace -> 1005 semantic groups -> 10 visual keyframes;
- 9/9 reported playback tests passing;
- no production dependencies;
- source trace is preserved; presentation timing is separate from simulation timing.

Decision:
- **PORT**, not wholesale merge;
- hold code integration until Agent A freezes v1 `SimulationResult`;
- then run one compatibility pass and add repeated-pattern compression only if real traces require it.

No further B work is required until Agent F requests that compatibility pass.

## C — UI
**Status:** start independently against mock v0 data.

Deliver:
- serious product information architecture;
- Builder/Explorer/Compare user flow;
- component boundaries;
- React/TypeScript migration/scaffold recommendation.

Integration note from B:
- no autoplay;
- playback exposes semantic keyframes, source event ranges, 0.5x/1x/2x controls;
- reduced-motion/animation-disable behavior should be handled with B during integration.

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
**Status:** active.

Deliver:
- validation matrix for analytical baseline, queue/resource policy literature, QAMP/IBM workflow;
- define one serious QAMP/IBM preset;
- identify assumptions that should NOT survive from legacy A–D;
- acceptance cases for engine tests.

Do not expand into a new scheduler/research platform.

## F — Coordinator
**Status:** active.

Immediate F tasks:
- review A/E when ready;
- maintain shared contracts;
- resolve semantic conflicts;
- enforce 10-day boundary;
- decide promotion status;
- keep `main` coherent.
