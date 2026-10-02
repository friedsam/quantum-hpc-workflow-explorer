# Coordinator Review Queue

Updated: 2026-10-02

## A — Engine
**Status:** CLOSED/IDLE — v1 frozen and production runtime staged under `app/src/engine/`.

## B — Playback
**Status:** CLOSED/IDLE — frozen-v1 compatible production playback staged under `app/src/playback/`.

Integration wording constraint remains: periodic event-pattern compression is not semantic loop identity unless workflow metadata proves it.

## C — UI
**Status:** CLOSED/IDLE — final integration checkpoint accepted and promoted to staging.

Promoted into `agent/integration`:
- React/TypeScript/Vite app shell;
- editable custom DAG authoring;
- resource/policy authoring;
- frozen-v1 simulation;
- A-D + IBM/QAMP presets;
- Explore/playback/resource-state views;
- saved-run Compare;
- React Flow + ELK graph renderer;
- app tests.

Known deferred product gap:
- user-facing bounded-repeat/template authoring above the expanded-DAG engine.

## D — Graphics
**Status:** CLOSED/IDLE — accepted visual grammar now implemented in staging.

## E — Research/validation
**Status:** CLOSED/IDLE — accepted evidence/presets/methodology available for later documentation.

## F — Coordinator / Integration
**Status:** **active — first coherent staging build created.**

Current staging commit:
- `6fdb7954d1aeed4ddf82ea94ae81e9fe1830cd35`

Next gates:
1. staging CI on `agent/integration`;
2. browser-level E2E/visual smoke tests;
3. verify A-D behavior as engine-derived acceptance scenarios;
4. test custom workflow authoring → simulate → playback → modify → compare;
5. resolve deployment root from legacy `web/` to new `app/`;
6. only then consider promotion to `main`.
