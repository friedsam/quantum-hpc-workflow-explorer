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


## Coordinator final review — 2026-10-02

**Agent F decision:** **PROMOTE/PORT accepted. Agent C integration checkpoint is accepted for staging.**

### Verified by coordinator

- Final branch head `3843b7c60c9a828dae60b8a4483e712616163af9` has a successful GitHub Actions run `37070602061`.
- Current production dependencies exist at the declared versions: `@xyflow/react 12.12.0` and `elkjs 0.12.0`.
- Vite 8 requires Node 20.19+ or 22.12+; branch CI uses Node 22.
- React Flow's current handle/ELK guidance supports the stable handle/port approach used by this implementation.

### Accepted for staging substantially intact

- React/TypeScript/Vite product shell.
- Custom workflow authoring: add/delete/edit tasks, dependencies and resource pools.
- Frozen-v1 resource/policy editing.
- Authoritative engine validation/simulation seam.
- React Flow + ELK editable DAG.
- A-D + custom + IBM/QAMP presets.
- Explore metrics/timelines/queue evidence.
- Structured SVG runtime resource view.
- Agent-B playback integration and controls.
- Saved real-run comparison.
- Componentized layout and architecture tests.

### Canonical subsystem decision

During staging, the accepted copies under:
- `app/src/engine/runtime.mjs`
- `app/src/playback/trace-playback.mjs`

become the canonical **production** engine/playback locations. Agent A/B branches remain provenance and development history; do not create duplicate production copies elsewhere.

### Remaining staging gaps

1. Browser-level E2E/visual smoke testing still required.
2. Deployment root must move from the legacy `web/` product to the new `app/` build when staging is approved.
3. Bundle size warning (~1.9 MB minified JS) is non-blocking but should be measured after initial browser testing.
4. User-facing bounded-repeat/template authoring is not yet implemented. This is a Builder/preprocessor feature above the frozen expanded-DAG engine and is not required to validate the first staging build, but remains part of the intended generic workflow product.
5. Dependency lockfile/reproducible install should be addressed before final main release if not produced by the staging integration workflow.

### Promotion

PROMOTE the `app/` implementation substantially intact to `agent/integration`.
PORT the UI architecture documentation.
REPLACE the branch-specific CI workflow with an integration/main app-validation workflow.

Agent C can pause after this review. Future C work should be driven by browser/E2E findings or the bounded-repeat authoring task.


## Round 3 task — integrate accepted model, scenarios, causal debugger

Status: REOPENED for the main product integration pass.

### Inputs now frozen/accepted

Read from `agent/integration`:
- `docs/coordination/INTERFACE_CONTRACTS.md`
- `docs/coordination/QAMP_SCENARIO_ACCEPTANCE.md`
- `docs/coordination/CAUSAL_SYSTEM_STATE.md`
- `docs/coordination/DESIGN_CONFIGURATION_LAYER.md`
- `docs/coordination/FULL_SYSTEM_VISUAL_LANGUAGE.md`

Read Agent A's accepted compiler implementation from `agent/engine` Round 2C.

### Required integration

1. **Design/config/profile layer**
   - port/rehome the accepted versioned WorkflowDesign / RunConfiguration / SystemProfile / RunRecord types and pure compiler into the app;
   - use CompilationManifest for authored-to-compiled provenance;
   - keep frozen DES runtime unchanged;
   - keep direct WorkflowSpec import/compatibility path if useful.

2. **A-D presets**
   - replace the approximate current A-D presets with the accepted Round-2 scenario fixtures/semantics;
   - preserve synthetic/provenance labels;
   - validate expected A-D behavioral assertions in app tests.

3. **Causal explanation adapter**
   - implement the accepted derived SystemStateSnapshot/explanation layer from WorkflowSpec + SimulationResult;
   - keep exact resource state separate from causal task/dependency explanations;
   - do not invent generic blocked-rank counts;
   - preserve hooks for optional actor/rank groups without claiming exact actor accounting yet.

4. **Full-system debugger view**
   - replace/upgrade the current simple runtime card using the accepted Agent-D visual language;
   - exact resource plane + causal explanation plane + DAG lens + linked analytical strips;
   - one simulation-time cursor drives runtime state, DAG highlighting and semantic playback;
   - keep geometry stable; no raw-event blinking;
   - Scenario B and D should visibly demonstrate their distinct bottlenecks.

5. **Current functionality must remain**
   - custom DAG authoring;
   - simulate;
   - semantic playback;
   - save run;
   - compare real runs.

### Explicit non-goals for this pass

- no optimizer;
- no broad landing-page/UI redesign;
- no calibrated rank-scaling model;
- no persistent actor-state engine;
- no provider scheduler;
- no deployment/main merge yet.

### Validation

Add/adjust tests so the branch verifies:
- compiler/schema/manifest integration;
- A-D behavioral acceptance;
- causal explanation derivation;
- existing engine/playback/architecture tests;
- TypeScript;
- Vite production build.

Stop after a green checkpoint for Agent F review.

## Round 3 completion — 2026-10-03

**Status: GREEN CHECKPOINT — STOPPED FOR AGENT F REVIEW.**

Code head before this handoff documentation:
`299923914aaf564712ce674551ff17e2bdefec6f`

Validated GitHub Actions run:
`37092997663` — **success**

### Delivered

#### 1. Design / configuration / profile layer

Ported Agent A's accepted Round-2C producer contract above frozen DES v1:

- `app/src/design/types.ts`
- `app/src/design/compiler.mjs`
- `app/src/design/compiler.d.mts`
- `app/src/design/bundle.ts`
- `app/src/design/detach.ts`

The pure compiler produces the existing frozen `WorkflowSpec`; the DES runtime was not modified.

Design-backed runs retain WorkflowDesign, RunConfiguration, SystemProfile, compiled WorkflowSpec, CompilationManifest, and SimulationResult.

`createRunRecord` is used for design-backed simulations. The direct `WorkflowSpec` compatibility path remains available for custom/edited workflows.

Manual editing of a compiled design-backed preset deliberately detaches its manifest/profile context and removes compiler-only task metadata before continuing as a direct `WorkflowSpec`, preventing stale provenance from being presented as current.

#### 2. Accepted QAMP A–D presets

Replaced the prior approximate A–D UI presets with the exact accepted Agent-A fixture producer:
- source/production blob: `5c4e64f58d5e0be4e8db5cc1697736b254f12482`
- app path: `app/src/presets/qamp-scenarios.mjs`

A–D are wrapped in design/config/profile bundles with explicit synthetic provenance and optional actor-group/semantic metadata.

Visible distinctions:
- A: local overlap / QPU off critical path;
- B: fixed-reservation synchronization wall, no policy throttling;
- C: communication/data-movement wall;
- D: QPU throughput + resource queue + separate bounded-admission policy hold.

#### 3. Causal explanation adapter

Added `app/src/causal/systemState.mjs` plus typed declaration.

Derived SystemStateSnapshot keeps exact resource state separate from causal explanation.

Exact resource state:
- active;
- allocated-idle;
- released;
- explicit queued task IDs / queue depth.

Causal explanation:
- active communication;
- resource queue;
- policy-held QPU tasks;
- immediate dependency-gated classical work;
- stronger collective-synchronization label only when accepted metadata supports it.

No generic blocked-rank/resource count is generated. Actor-group IDs remain hooks/provenance only; they are not persistent rank ownership.

#### 4. Full-system debugger

Replaced the prior simple runtime card with:
- exact resource-capacity plane;
- separate causal-explanation plane;
- fixed-geometry React Flow DAG lens;
- linked analytical strips.

One simulation-time cursor drives runtime/causal state, DAG highlighting, semantic playback, and analytical-strip cursor.

DAG runtime labels: RUN, QUEUE, POLICY HELD, DEPENDENCY GATE, complete, plus active transfer edges.

Analytical strips show resource composition, QPU running intervals, resource queue, and policy-held task count. Cumulative cost is explicitly disabled because frozen v1 exposes final cost only, not an authoritative cost time series.

No raw-event blinking and no playback-driven relayout.

#### 5. Existing product functionality preserved

Custom DAG authoring, task/dependency/resource/policy editing, frozen-v1 validation, deterministic simulation, semantic playback, saved runs, real-run comparison, and direct WorkflowSpec compatibility remain present.

### Producer integrity

Verified unchanged at the green code checkpoint:
- frozen DES runtime blob: `4023b3daf8ae7e50c6e7b7be8a886e2ea392dc84`
- accepted playback blob: `c77ad95054aaa5315d9d62c7a3309a0b73c3e3a0`
- accepted design compiler blob: `83522cc99720e976de9b6e6482b9b1f7b66f8e1e`
- accepted QAMP fixture blob: `5c4e64f58d5e0be4e8db5cc1697736b254f12482`

No frozen-v1 interface or DES semantic change was requested.

### Validation

Green run `37092997663`:
- engine: **17/17**
- design/compiler/schema/manifest: **7/7**
- QAMP A–D behavioral acceptance: **5/5**
- causal derivation: **4/4**
- playback: **13/13**
- architecture: **10/10**

Total Node tests: **56/56**.

Also green: TypeScript `tsc --noEmit`; Vite 8.3.2 production build; 208 modules transformed.

Build output:
- CSS: ~35.70 kB / 7.28 kB gzip;
- JS: ~1.934 MB / 596.18 kB gzip;
- existing non-fatal large-chunk warning remains.

### Corrected failures during Round 3

1. Architecture-test follow-up edits briefly contained literal escaped-newline text; producer/product tests preceding that test remained green. Test source was repaired.
2. Static review found that direct editing after design compilation could retain stale compiler timing/actor metadata; `detachCompilationProvenance` now removes it before converting to the direct-WorkflowSpec path.
3. Causal-plane review found that resource-queued work needed its own explicit card rather than appearing only as queue depth; it is now separate from policy-held work.

### Files proposed for Round-3 promotion

Promote/port substantially intact:
- `app/src/design/**`
- `app/src/causal/**`
- `app/src/presets/qamp-scenarios.*`
- updated `app/src/presets/presets.ts`
- updated App / run-envelope / Builder / Explore / Compare code
- `FullSystemDebugger.tsx`
- `AnalyticalStrips.tsx`
- `CompilationProvenance.tsx`
- updated DAG runtime styling
- Round-3 tests
- updated CSS/package scripts.

Canonical production producer locations remain `app/src/engine/runtime.mjs` and `app/src/playback/trace-playback.mjs`.

### Explicitly deferred / outside this pass

Optimizer; calibrated rank-scaling/accounting; persistent actor/rank-state engine; provider scheduler; authoritative cumulative-cost time series; broad landing-page redesign; deployment/main promotion; browser E2E/visual smoke; bundle/code-splitting optimization.

### Promotion recommendation

**PROMOTE/PORT Round 3 to `agent/integration` for Agent F review.**

The requested Agent-C Round-3 scope is complete at a green checkpoint. No further Agent-C work should proceed until coordinator/browser review identifies a concrete defect.


## Coordinator Round 3 final review — 2026-10-03

**Agent F decision:** **PROMOTE/PORT accepted; Agent C CLOSED/IDLE.**

Verified:
- Agent-C head `ed5c0cb6119a980328a9d57c0aca8c3a92830438` passed branch CI run `37093207783`.
- Staged integration commit `e4a617be212055c0364d57124db300961810b2e0` passed integration CI run `37093643908`.
- Integration CI completed install, app tests, TypeScript, and Vite build successfully.
- Round-3 Node suite covers engine, design/compiler/schema/manifest, QAMP A-D, causal state, playback, and architecture.
- Frozen DES and accepted playback producer blobs remain unchanged.
- React Flow + ELK implementation remains aligned with the current official fixed-port/FIXED_ORDER pattern.

Accepted product behavior:
- design/config/profile + compilation-manifest provenance;
- accepted A-D scenario semantics;
- causal explanation adapter with no invented blocked-rank counts;
- full-system debugger with exact capacity + causal plane;
- fixed DAG geometry with runtime highlighting;
- shared simulation cursor with analytical strips/playback;
- custom DAG authoring, simulation, saved runs and Compare preserved.

Non-blocking risks/deferred:
- no browser E2E/visual smoke yet;
- no package lockfile / reproducible `npm ci` path yet;
- bundle remains large (~1.9 MB minified JS);
- derived analytical strips may need performance optimization for very large traces;
- no authoritative cumulative-cost time series;
- no exact actor/rank Working/Blocked/Idle accounting yet;
- no broad landing-page redesign.

No further Agent-C work is requested until browser/E2E review identifies a concrete defect.
