# Agent C — Product UI / UX

Branch: `agent/ui`

## Mission

Design and validate the product UI around the frozen shared workflow/simulation contract.

## Current status

**Frozen-v1 integration checkpoint complete; ready for Agent F review.**

Current branch head before this status commit:
`882377be8b2c66184bcf8207abfe3cce1e35c312`

No legacy `web/` files were modified.

## Delivered user flow

1. Load a preset or start from a custom editable workflow.
2. Add/delete/edit tasks.
3. Add/delete/edit dependencies in the DAG or form editor.
4. Add/delete/edit CPU/GPU/QPU resource pools.
5. Edit fixed/release-aware allocation, fixed reservations and per-QPU in-flight limits.
6. Validate using the frozen-v1 authoritative engine validator.
7. Simulate using the accepted v1 engine.
8. Explore metrics, queues, task/resource intervals and semantic playback.
9. Save each successful config/result run automatically.
10. Compare saved real runs.

A–D are loadable templates, not product boundaries. IBM/QAMP Fe4S4 SQD is included as the serious reference preset.

## Files proposed for production promotion

- `app/src/App.tsx`
- `app/src/components/**`
- `app/src/domain/**`
- `app/src/presets/**`
- `app/src/services/engineAdapter.ts`
- `app/src/uiTypes.ts`
- `app/src/main.tsx`
- `app/src/styles.css`
- `app/index.html`
- `app/package.json`
- `app/tsconfig.json`
- `app/vite.config.ts`
- `app/tests/**`
- `app/README.md`
- `docs/ui/PRODUCT_UI_ARCHITECTURE.md`

## Files to PORT/rewire rather than duplicate in integration

- `app/src/engine/runtime.mjs` — exact accepted Agent-A runtime copied here only for self-contained branch validation.
- `app/src/engine/runtime.d.mts` — declaration adapter for the copied runtime.
- `app/src/playback/trace-playback.mjs` — exact accepted Agent-B module copied here only for self-contained branch validation.
- `app/src/playback/trace-playback.d.mts` — declaration adapter.

Agent F should keep one canonical engine and playback implementation and rewire UI imports if those tracks are ported separately.

## Investigation-only file

- `.github/workflows/agent-ui-validation.yml`

This branch-only workflow was added because the tool container could not resolve npm packages. It provided real install/test/typecheck/build evidence. Agent F may keep, replace or drop it.

## Dependencies

Production:
- React / React DOM
- `@xyflow/react`
- `elkjs`

Development:
- TypeScript
- Vite
- official Vite React plugin
- React type packages

Node runtime validated in CI: Node 22.

## Frozen-v1 integration verified

- local v0 `model.ts` removed;
- local v0 `contracts.ts` removed;
- UI validation delegates to the authoritative v1 validator;
- exact v1 engine runtime is the only simulation implementation in the app;
- tasks bind to `resourcePoolId`;
- fixed classical reservations exposed;
- per-QPU max-in-flight exposed;
- ready/policy wait and resource queue remain distinct;
- task intervals render ready/queued/running only;
- resource intervals render active/allocated-idle/released;
- `aggregateCommunicationSeconds` rendered directly;
- generic metrics iterate configured pools rather than assuming `hpc`/`qpu` IDs;
- Compare uses saved real SimulationResults.

## Graphics verified

Workflow DAG:
- React Flow + ELK layered;
- deterministic non-zero seed;
- explicit left/right React Flow handles;
- ELK fixed WEST/EAST ports;
- stable task/dependency IDs;
- selection/playback does not drive layout.

Runtime state:
- structured inline SVG;
- stable resource-card geometry;
- explicit interval/queue values only;
- accessible text/table equivalent.

## Playback verified

Ported accepted Agent-B frozen-v1-compatible playback.

UI:
- no autoplay;
- semantic keyframes;
- source-event provenance;
- Play/Pause/Restart/Prev/Next;
- bounded speed controls;
- neutral repeated-activity wording;
- reduced-motion defaults animation off;
- playback drives the same simulation-time boundary as runtime SVG inspection.

## Validation

Latest branch CI after ELK port correction:
- GitHub Actions run `37070389320`: **success**.

Fully logged preceding green run `37070157524`:
- engine: 17/17 Node tests pass;
- playback: 13/13 Node test cases pass;
- architecture: 7/7 pass;
- TypeScript `tsc --noEmit`: pass;
- Vite 8.3.2 production build: pass.

Build output:
- CSS ~30.91 kB / 6.33 kB gzip;
- JS ~1.90 MB / 586.32 kB gzip;
- non-fatal Vite large-chunk warning remains.

## Known failures corrected during integration

1. First CI run failed because the ported Agent-A fixture still referenced its old `../index.mjs`; import path corrected without changing fixture semantics.
2. Second CI run passed all tests but exposed a `CompareView.tsx` TypeScript syntax error; corrected.
3. ELK port metadata was aligned with the current React Flow ELK reference form (`FIXED_ORDER`, WEST/EAST port properties); subsequent CI green.

These are recorded rather than omitted.

## Interface changes requested

None.

The frozen v1 contract is sufficient for this UI pass.

## Unresolved / deferred

- Bundle/code splitting optimization.
- Browser-level E2E/visual smoke test in final integrated deployment.
- User-facing bounded-repeat/template authoring schema. The frozen DES consumes already-expanded DAGs; Agent C did not invent a second pre-engine workflow language.

## Promotion recommendation

**PROMOTE/PORT hybrid.**

PROMOTE the UI/product implementation substantially intact.

PORT engine/playback imports to their canonical Agent-A/B locations during integration rather than preserving duplicate subsystem copies.

DEFER the branch-only CI workflow unless Agent F wants it as the permanent product validation workflow.
