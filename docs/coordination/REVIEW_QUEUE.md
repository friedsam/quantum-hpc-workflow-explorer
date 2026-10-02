# Coordinator Review Queue

Updated: 2026-10-02

## A — Engine
**Status:** **v1 FROZEN — PORT accepted; Agent A can pause.**

R1-R5 completed and reviewed. Canonical contract is now `docs/coordination/INTERFACE_CONTRACTS.md` on `agent/integration`.

## B — Playback
**Status:** **ready for one v1 compatibility pass.**

Use the frozen `SimulationResult` contract and one real engine trace. Confirm snapshot interval behavior and whether repeated multi-signature-cycle compression is needed. No new playback features.

## C — UI
**Status:** **checkpoint accepted — PORT shell/architecture; v0 model/map must be replaced during integration.**

Accepted:
- React + TypeScript + Vite production direction;
- Builder → Explore → Compare shell;
- stale-result invalidation;
- authoritative result consumption;
- accessibility/responsive principles;
- no autoplay / reduced-motion behavior.

Do not promote unchanged:
- duplicated v0 `app/src/model.ts` contract;
- temporary linear WorkflowMap;
- monolithic integration layout.

C now gets one bounded integration pass against frozen v1 for:
- frozen shared types/validator;
- React Flow + ELK **editable DAG**;
- creation/deletion/editing of supported tasks and dependencies, not only preset parameter editing;
- resource-pool and supported policy editing needed to define a custom WorkflowSpec;
- component split;
- real engine adapter seam;
- simulate → Explore/animate → Compare flow for user-created workflows.

A–D should ship as loadable presets/templates, but users must not be confined to them.

## D — Graphics
**Status:** checkpoint accepted — PORT visual grammar/tool split.

## E — Research/validation
**Status:** **CLOSED/IDLE — PORT accepted after Rao verification.**

Accepted:
- IBM/QAMP Fe4S4 structural preset;
- E1-E6 engine acceptance cases;
- legacy assumption corrections;
- fixed reservation / policy-wait semantics;
- Rao equations (1)-(5), R1 synthetic fixture, R2 SQD reproduction;
- real-time/QEC boundary documented out of v1 scope.

No further E work unless targeted source verification is requested.

## F — Coordinator
**Status:** active.

Immediate F tasks:
- wait for A R1-R5 repair and freeze v1;
- then request one B compatibility pass;
- then coordinate one C integration pass with accepted D graphics split;
- port E evidence/presets into integration methodology/fixtures.
