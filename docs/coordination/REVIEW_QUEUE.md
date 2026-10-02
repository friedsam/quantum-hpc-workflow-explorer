# Coordinator Review Queue

Updated: 2026-10-02

## A — Engine
**Status:** active.

Deliver:
- proposed implementation-ready v1 WorkflowSpec/SimulationResult contract;
- discrete-event architecture;
- minimal deterministic example;
- invariant-test plan.

Additional questions from E/B review:
- define workflow-level fixed reservation quantity/scope separately from instantaneous task active usage;
- define `maxInFlightQuantum` as admitted-but-not-complete quantum tasks (running + QPU-resource-queued), with policy-held ready tasks separate from resource queue depth;
- keep external/provider queue delay explicit synthetic/user input or omit it; do not implement a provider scheduler;
- define interval-boundary semantics for ResourceInterval/TaskInterval snapshots;
- show whether repetitive engine traces use one semantic signature or a repeated multi-signature cycle.

Do not build UI.

## B — Playback
**Status:** **checkpoint accepted — conditional PORT; waiting for Agent A v1 compatibility check.**

Verified branch checkpoint:
- head reviewed: `900676e41a02404459cc9e7a89159bbbc454b845`;
- coordinator review added on B branch at `f927cfe3d7f9fcd2ab0fc473c74e7987e72c5320`;
- 3005-event synthetic stress trace -> 1005 semantic groups -> 10 visual keyframes;
- 9/9 reported playback tests passing;
- no production dependencies.

Decision:
- **PORT**, not wholesale merge;
- hold code integration until Agent A freezes v1 `SimulationResult`;
- then run one compatibility pass.

No further B work is required until Agent F requests that pass.

## C — UI
**Status:** start independently against mock v0 data.

Deliver:
- serious product information architecture;
- Builder/Explorer/Compare user flow;
- component boundaries;
- React/TypeScript migration/scaffold recommendation.

Integration notes:
- no autoplay;
- playback exposes semantic keyframes and source event ranges;
- plan reduced-motion/animation-disable behavior;
- UI must distinguish policy wait, resource queue, active allocation, allocated-idle, and released states if v1 adopts E/A semantics.

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
**Status:** **checkpoint accepted — PORT; one bounded Rao addendum requested.**

Verified/accepted:
- current Qiskit C API role correction;
- IBM Fe4S4 SQD reference structure: rank-0 quantum integration, one sampling stage, then bounded recovery/SBD loop;
- QPU capacity remains configurable;
- provider queue delay is dynamic/external and must not become a fixed measured constant;
- IBM/QAMP preset topology;
- legacy A-D assumption removals/demotions;
- deterministic acceptance cases E1-E6.

Coordinator review written to `agent/research` at `9a9ec1f122525394db8a656aa0298939f4a9ea00`.

Required bounded follow-up:
- validate Rao et al. 2026 equations (1)-(5), especially `F` and `R_cc`;
- add the smallest reproducible analytical fixture/reference check;
- keep Rao as analytical baseline/diagnostic, not a replacement for event simulation.

After this addendum, E can stop unless a later source check is requested.

## F — Coordinator
**Status:** active.

Immediate F tasks:
- review A next;
- reconcile A v1 against E's R1-R3 and B snapshot/playback assumptions;
- maintain shared contracts;
- enforce 10-day boundary;
- decide promotion status;
- keep `main` coherent.
