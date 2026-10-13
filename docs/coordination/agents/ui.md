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


## Round 4C task — implement the simple actor-aware Explorer

**Status:** REOPENED for the production integration pass.

### Accepted inputs

Read from `agent/integration`:
- `docs/coordination/ROUND4_ACTOR_MODEL.md`
- `docs/coordination/ACTOR_AWARE_PLAYBACK.md`
- `docs/coordination/SIMPLE_EXPLORER_VISUAL.md`

Read accepted producer implementations from:
- `agent/engine` — Round-4 logical multiplicity, actor participation/waits, actor-state derivation;
- `agent/playback` — Round-4B actor-aware playback/projection and neutral repeated-activity wording.

### Product correction

The Round-3 app exposed compiled DES fixtures and diagnostics as the primary product. Round 4C must invert that hierarchy.

The **default user experience** is based on the authored logical model.
The expanded WorkflowSpec/DES graph and dense diagnostic panels remain available under **Advanced / Diagnostics**.

### Required implementation

#### 1. Port the accepted logical/actor model

Port/rehome into `app/src/design/**`:
- logical task `multiplicity` (default 1);
- actor groups/counts;
- actor participation;
- actor wait/gate claims;
- dependency instance mapping;
- manifest actor assignments/waits;
- actor-state derivation.

Frozen DES runtime remains unchanged.

#### 2. Builder: show/edit the logical DAG

For design-backed workflows, the Builder DAG must render `WorkflowDesign.tasks`, not compiled `WorkflowSpec.tasks`.

Each logical task node must clearly separate:
- label;
- multiplicity `×N`;
- resource demand `N units / instance`;
- resource type/pool.

Task inspector:
- expose editable `Multiplicity` with default 1;
- keep `Resource units / instance` separate;
- keep service time/system-profile assumption editable through the existing design/profile path or a minimal equivalent;
- do not render one node per instance/rank.

Dependency editing must preserve supported mapping semantics:
- pairwise for equal multiplicity by default;
- explicit all-to-all where required;
- if a user creates an unsupported/ambiguous unequal-multiplicity dependency, surface validation rather than invent semantics.

Preserve direct WorkflowSpec compatibility only as a fallback/advanced path. Prefer the logical design layer for the normal custom starter so multiplicity is available to ordinary users.

#### 3. Replace A-D user-facing presets with logical presets

Do not show the old scaled DES fixture nodes as the scenario DAG.

Scenario B default authored DAG:
- Preparation ×2;
- Quantum evaluation ×2;
- Collective ×1;
- persistent rank group count 4;
- accepted actor waits/gates;
- compile internally to the accepted Round-4 Scenario-B WorkflowSpec/trace.

Scale values remain synthetic acceptance values, clearly labeled.

A/C/D should likewise use compact logical authored nodes and multiplicity where appropriate rather than exposing every compiled task instance. Preserve their accepted behavioral mechanisms.

#### 4. Explorer default surface

Implement the accepted D hierarchy:

1. **What is happening now?** plain-language banner.
2. Actor-group Working / Blocked / Idle when authored actor semantics exist.
3. Otherwise compact generic path/system progress; never invent actor counts.
4. Compact QPU state:
   - running;
   - resource queued;
   - policy held;
   - sync/no-sync callout when supported.
5. Logical authored DAG with `×N` badges and per-instance resource tags.
6. Simple Previous / Play-Pause / Next + shared simulation-time rail.

Keep geometry fixed while playback state changes.

Scenario B default must show the actor-aware sequence:
- 2W / 0B / 2I;
- 0W / 2B / 2I;
- 0W / 4B / 0I with global synchronization;
- 4W / 0B / 0I.

Do not present Scenario B's internal admission hold as its visible bottleneck.

Scenario D must continue to distinguish:
- QPU running;
- resource queued;
- policy held;
- no global synchronization.

#### 5. Advanced / Diagnostics

Move the existing Round-3 diagnostic stack behind one disclosure/tab:
- MetricsGrid;
- CompilationProvenance;
- FullSystemDebugger;
- AnalyticalStrips;
- TaskTimeline;
- ResourceTimeline;
- QueueEvidence;
- Assumptions;
- expanded compiled DES graph;
- source-event/keyframe/provenance details.

Do not delete this functionality.

#### 6. Actor-aware playback

Port/rehome B's accepted actor-aware projection:
- actor summaries;
- overlapping blocked-reason counts;
- semantic keyframe protection when actor composition/reasons change;
- generic actor-less fallback;
- neutral `Repeated N-step activity ×M` wording.

One shared time cursor must drive:
- default actor/path state;
- logical DAG status;
- advanced diagnostics;
- playback.

### Explicit non-goals

- no optimizer;
- no calibrated rank-scaling model;
- no provider scheduler;
- no new graphics framework;
- no one-node-per-rank rendering;
- no DES rewrite;
- no broad marketing/landing-page redesign;
- no deployment/main promotion yet.

### Validation

Add/adjust tests for:
- multiplicity compiler behavior;
- actor wait/state derivation;
- Scenario-B actor sequence;
- Scenario-D queue vs policy-held fallback;
- logical-vs-compiled DAG separation;
- task multiplicity editing and validation;
- direct custom workflow simulation;
- existing Compare/save-run behavior;
- playback regressions including neutral repeated-activity wording;
- TypeScript;
- Vite build.

Stop after a green checkpoint for Agent F review. Browser visual testing follows on `agent/integration`.


## Round 4C completion — 2026-10-10

**Status: GREEN CHECKPOINT — STOPPED FOR AGENT F REVIEW.**

Green code head before handoff documentation:
`1129ef3041d95d7c50b92058c9deaabd8e2d843a`

Validated GitHub Actions run:
`38028979455` — **success**

### Product correction delivered

Round 4C inverts the Round-3 hierarchy as requested:

- normal Builder works on authored `WorkflowDesign`, not expanded DES tasks;
- normal Explore shows the logical workflow and simple human-readable state;
- expanded `WorkflowSpec` / DES graph and dense diagnostics are behind **Advanced / Diagnostics**;
- direct `WorkflowSpec` remains an advanced compatibility path.

No DES rewrite or new graphics framework was introduced.

### Accepted Round-4 producers ported

Canonical app producer hashes at the green checkpoint:

- frozen DES: `app/src/engine/runtime.mjs` = `4023b3daf8ae7e50c6e7b7be8a886e2ea392dc84`
- Round-4 compiler: `app/src/design/compiler.mjs` = `bb487feede9ca0eb2b9f499aea44a21d7fbdb83b`
- actor-state derivation: `app/src/design/actor-state.mjs` = `72d62283115faf63ab941ba643d06771feb81c9d`
- actor-aware trace playback: `app/src/playback/trace-playback.mjs` = `6fd71816ab071e35f43830957fd99afdbafc8965`
- actor-aware projection: `app/src/playback/actor-aware-view.mjs` = `eacb5add590136c5c586ffb3b341a537b9542bd9`

The frozen DES blob is unchanged.

### Builder

Design-backed workflows now render the logical authored DAG.

Logical node presentation separates:
- task label;
- multiplicity `×N`;
- resource type/pool;
- `N units / instance`;
- service-time assumption per instance.

Logical task inspector edits:
- label;
- Multiplicity (default 1);
- resource pool;
- resource units / instance;
- constant service-time/profile assumption.

These remain independent from actor-group count.

Logical resource/config editing preserves:
- CPU/GPU/QPU pools;
- capacity;
- modeled cost assumption;
- fixed/release-aware policy;
- fixed reservation;
- QPU max-in-flight;
- actor-group counts where an actor model exists.

Logical dependency editing supports:
- default pairwise mapping for equal multiplicity;
- explicit pairwise;
- explicit all-to-all;
- communication assumptions in the SystemProfile.

Unequal multiplicity with no explicit mapping remains an invalid logical draft and is surfaced through compiler validation instead of guessed.

The normal custom starter is now logical/design-backed.

Direct `WorkflowSpec` editing is preserved only in the advanced compatibility path.

### Logical A-D presets

User-facing presets now use compact authored models:

- A: local classical overlap plus local quantum path;
- B: accepted Round-4 actor fixture — Preparation ×2 → Quantum ×2 → Collective ×1, 4 persistent MPI ranks;
- C: Producer ×3 → Quantum ×3 → Consumer ×3 with communication-dominated pairwise paths and no global sync;
- D: Preparation ×6 → Quantum ×6 → Continuation ×6, QPU capacity 1, max-in-flight 2, no global sync.

A/C/D are actor-less by design and use the generic fallback; no actor/rank counts are invented.

Scenario B uses the accepted actor participation/wait model:
- result wait for each submitting actor;
- all-actor global-result gate;
- all actors participate in the collective continuation.

All scale/timing values remain explicitly synthetic acceptance assumptions.

### Default Explorer hierarchy

The normal Explore view now shows, in order:

1. **What is happening now?** plain-language banner.
2. Actor Working / Blocked / Idle when authored actor semantics exist.
3. Otherwise compact generic workflow/path progress.
4. Compact QPU state: running / resource queued / policy held plus sync/no-sync callout.
5. Logical authored DAG with multiplicity badges and resource-per-instance tags.
6. Previous / Play-Pause / Next plus one shared simulation-time rail.

Scenario C's banner explicitly reports active data movement/communication.

Scenario B's actor model is the visible explanatory layer; its internal QPU admission serialization remains secondary QPU state, not the primary bottleneck explanation.

Scenario D remains generic and visibly separates QPU running, resource queue and policy-held work while stating no global synchronization.

### Actor-aware playback

The app now uses one actor-aware playback controller for both the simple view and diagnostics.

Accepted behavior retained:
- actor summaries;
- Working / Blocked / Idle projection;
- blocked-reason counts that may overlap;
- actor composition/reason changes protected as semantic boundaries;
- generic actor-less fallback;
- neutral repeated-activity wording;
- no raw-event autoplay.

One selected simulation time drives:
- actor/generic summary;
- QPU summary;
- logical DAG runtime state;
- simple playback rail;
- advanced debugger;
- analytical strips;
- expanded DES DAG;
- playback diagnostics.

Playback changes state styling only; ELK geometry remains topology/content driven.

### Advanced / Diagnostics

The following Round-3 surfaces remain available behind one disclosure:

- MetricsGrid;
- CompilationProvenance;
- expanded compiled DES graph;
- playback source-event/keyframe/provenance details;
- FullSystemDebugger;
- AnalyticalStrips;
- TaskTimeline;
- ResourceTimeline;
- QueueEvidence;
- Assumptions.

No Round-3 diagnostic functionality was removed.

### Validation

Green run `38028979455`:

- frozen engine: **17/17**
- design/compiler: **7/7**
- actor model/state: **6/6**
- QAMP behavioral suite: **5/5**
- causal derivation: **4/4**
- trace playback: **14/14**
- actor-aware playback/projection: **7/7**
- Round-4C product acceptance: **6/6**
- architecture: **11/11**

Total Node tests: **77/77**.

Also green:
- TypeScript `tsc --noEmit`;
- Vite 8.3.4 production build;
- 220 modules transformed.

Build output:
- CSS ~40.98 kB / 8.23 kB gzip;
- JS ~1.975 MB / 605.90 kB gzip;
- existing non-fatal large-chunk warning remains.

### Round-4C failures corrected

1. Agent-A declarations were initially copied verbatim from `.d.ts` into `types.ts`; TypeScript rejected declaration-only functions in a runtime TS module. Function declarations now live only in the existing `.d.mts` adapters; the shared TS file contains types/interfaces only.
2. A self-imposed App line-count assertion was too tight for the bounded logical-design orchestration; the guard was adjusted without refactoring unrelated product code.
3. TypeScript did not preserve a selected-task null narrowing inside nested editor callbacks; the selected task is now captured after the guard.
4. Generic Scenario-C simple-state wording initially reported only idle compute during transfers; the banner now explicitly reports active communication/data movement.
5. User-facing logical preset objects were moved to importable producer data so the exact A/C/D presets loaded by the UI are compiled/simulated in tests.

### Files proposed for promotion

Round-4C product implementation:
- `app/src/design/types.ts`
- `app/src/design/compiler.mjs`
- `app/src/design/actor-state.*`
- `app/src/playback/trace-playback.*`
- `app/src/playback/actor-aware-view.*`
- `app/src/presets/qamp-b-actor.*`
- `app/src/presets/logical-presets.*`
- updated `app/src/presets/presets.ts`
- updated `app/src/App.tsx`
- updated `app/src/uiTypes.ts`
- logical Builder components under `app/src/components/builder/`
- logical graph projection/runtime components under `app/src/components/graph/`
- simple Explorer/playback/state components under `app/src/components/explore/`
- updated `app/src/styles.css`
- Round-4 actor/playback/product tests and package scripts.

### Dependencies

No new production framework/dependency added.

Production remains:
- React / React DOM;
- `@xyflow/react`;
- `elkjs`.

### Interface changes requested

None.

Round-4 model/compiler/actor additions remain above the frozen DES.

### Explicitly deferred

- generalized actor participation/wait authoring UI beyond the accepted/preset model;
- optimizer;
- calibrated rank scaling;
- provider scheduler;
- persistent actor state inside DES;
- one-node-per-rank rendering;
- browser visual/E2E testing (Agent F next gate);
- deployment/main promotion;
- bundle/code-splitting optimization.

### Promotion recommendation

**PROMOTE/PORT Round 4C to `agent/integration` for browser/visual review.**

Stop at this checkpoint. Further Agent-C work should be driven only by Agent-F browser/E2E findings or a new bounded assignment.


## Coordinator Round 4C final review — 2026-10-10

**Agent F decision:** **PROMOTE/PORT accepted; Agent C CLOSED/IDLE.**

Verified:
- Round-4C code head `1129ef3041d95d7c50b92058c9deaabd8e2d843a` passed Agent-C CI run `38028979455`;
- final documentation head also passed CI run `38029083301`;
- staged integration commit `17e868fafa1c120a6c54182a2844f45f84e5ffb5` passed integration CI run `38029254083`;
- integration CI completed install, full app tests, TypeScript and Vite build successfully.

Producer integrity independently verified:
- frozen DES app copy exactly matches Agent-A frozen DES;
- Round-4 compiler exactly matches Agent-A accepted compiler;
- actor-state derivation exactly matches Agent-A accepted producer;
- trace playback and actor-aware projection exactly match Agent-B accepted producers.

Accepted product behavior:
- logical WorkflowDesign is the normal Builder surface;
- multiplicity, resource units/instance and actor count remain distinct;
- custom starter is design-backed;
- A-D use compact logical presets;
- Scenario B uses the accepted persistent-actor model;
- default Explore is simple/logical/actor-aware;
- expanded DES and dense diagnostics are retained under Advanced / Diagnostics;
- one shared simulation cursor drives default and advanced state;
- Scenario D preserves resource queue vs policy-held distinction;
- direct WorkflowSpec remains an advanced compatibility path.

No additional model/UI defect was found in source review.

Remaining gate is browser visual/E2E behavior on the staged integration app. No further Agent-C work is requested unless that browser review exposes a concrete defect.


## Round 4D parallel UI task — deadline-safe Builder clarity pass

**Status:** REOPENED in parallel with Agent A. Do not depend on Agent A's Scenario-A model repair.

### Deadline context

A browser-demonstrable prototype of the tutorial scenarios is needed within approximately 3 days.

### Goal

Improve the current logical Builder's immediate comprehensibility without changing model semantics.

### Required changes

1. Add a compact **system topology strip** near the logical DAG:
   - one card per resource pool;
   - make parallel capacity explicit, e.g. `HPC / CPU pool · 4 parallel units`;
   - make QPU capacity explicit, e.g. `QPU · 1 execution lane`;
   - use current RunConfiguration only; do not infer hardware not represented by the model.

2. Change user-facing timing wording from `service time / instance` to **`modeled wall time / instance`**.
   - Add concise help text: this is a simulation assumption for one task instance, not CPU clock speed.
   - If communication is modeled explicitly on dependencies, keep it separate.

3. Explain multiplicity directly in the Builder:
   - `×N = N logical task instances represented by this node`;
   - do not imply instances must have persistent actor identity.

4. Remove redundant node metadata where possible:
   - avoid labels such as `CPU · 1 unit / instance · cpu` when pool ID adds no useful information;
   - preserve pool ID in inspector/advanced detail if needed.

5. Fix the visible kinked/awkward edge routing in the simple three-node Scenario-B DAG if this can be done by a bounded ELK/React Flow layout/port adjustment without introducing hand-coded coordinates or playback-dependent geometry.

6. Keep Advanced / Diagnostics unchanged.

### Boundaries

- no actor/schema changes;
- do not change A-D semantics or timings;
- do not wait for Agent A;
- no new framework;
- no redesign of the landing page;
- no optimizer/Slurm code;
- no one-node-per-instance expansion.

### Validation

Run existing full app tests, TypeScript and Vite build.
Add only focused assertions needed for topology strip / terminology if useful.

Stop for Agent F browser review.


## Round 4D parallel UI completion — 2026-10-10

**Status: GREEN CHECKPOINT — STOPPED FOR AGENT F BROWSER REVIEW.**

Green code head before this handoff:
`046ee9b462788bda9bdcbcdedc40c4d12e363030`

Validated GitHub Actions run:
`38088263060` — **success**

### Bounded changes delivered

#### System-topology strip

Added `app/src/components/builder/SystemTopologyStrip.tsx` immediately above the logical DAG.

It renders exactly one card per current `RunConfiguration.resources` entry:
- CPU/GPU pools show configured capacity as parallel units;
- QPU pools show configured capacity as execution lanes;
- fixed reservation or QPU max-in-flight is shown only when present in current policy;
- nonredundant pool IDs are retained;
- no hardware outside RunConfiguration is inferred.

The strip also gives the two Builder definitions needed for deadline clarity:
- `×N = N logical task instances represented by one node`; multiplicity does not imply actor count or resource demand;
- `modeled wall time / instance` is a simulation assumption for one task instance, not CPU clock speed; dependency communication remains separate.

#### Timing terminology

Logical Builder/default logical-DAG wording now uses:
- **Modeled wall time / instance (s)** in the task inspector;
- **modeled wall time / instance · N s** on logical nodes.

The inspector includes the explicit CPU-clock-speed clarification.

Internal model fields and frozen DES `serviceTime` semantics were not changed.

#### Multiplicity explanation

The logical task inspector now states directly:

`×N = N logical task instances represented by this node.`

It also states that multiplicity does not imply persistent actor identity.

#### Redundant node metadata cleanup

Logical node resource tags no longer repeat a pool ID when it is semantically identical to the resource kind.

Example:
- before: `CPU · 1 unit / instance · cpu`
- after: `CPU · 1 unit / instance`

A distinct/nonredundant pool ID remains visible as `pool <id>`.
The inspector still exposes the exact pool ID.

#### Bounded Scenario-B edge routing polish

Simple **linear logical DAGs only** now use React Flow's built-in `straight` edge type.

- Scenario B's three-node authored chain therefore avoids the visible smooth-step kink.
- branching logical DAGs remain `smoothstep`;
- compiled/Advanced graphs remain `smoothstep`;
- ELK still owns node layout;
- no coordinates are hand-coded;
- playback/runtime state does not affect routing or geometry.

### Advanced / Diagnostics

Unchanged.

Verified current hash:
- `app/src/components/explore/ExploreView.tsx` = `a519cbd107035429c9729011d00412baaef76b45`

### Model/producer integrity

Unchanged:
- frozen DES = `4023b3daf8ae7e50c6e7b7be8a886e2ea392dc84`
- Round-4 compiler = `bb487feede9ca0eb2b9f499aea44a21d7fbdb83b`
- actor-state derivation = `72d62283115faf63ab941ba643d06771feb81c9d`
- logical A-D preset producer = `54df751c0632fb846486922f4469640e7341cd9d`

No model semantics, scenario timings, actor schema, DES, or preset producer values changed.

### Exact code diff from Round-4D start

Only:
- `app/src/components/builder/BuilderView.tsx`
- `app/src/components/builder/LogicalTaskInspector.tsx`
- `app/src/components/builder/SystemTopologyStrip.tsx`
- `app/src/components/graph/WorkflowDag.tsx`
- `app/src/components/graph/projectDesign.ts`
- `app/src/styles.css`
- `app/tests/architecture.test.mjs`

### Validation

Green run `38088263060`:

- engine: **17/17**
- design/compiler: **7/7**
- actor model/state: **6/6**
- QAMP behavior: **5/5**
- causal derivation: **4/4**
- trace playback: **14/14**
- actor-aware playback: **7/7**
- Round-4C product acceptance: **6/6**
- architecture/UI: **12/12**

Total Node tests: **78/78**.

Also green:
- TypeScript `tsc --noEmit`;
- Vite 8.3.4 production build;
- 221 modules transformed.

Build output:
- CSS ~42.06 kB / 8.41 kB gzip;
- JS ~1.978 MB / 606.65 kB gzip;
- existing non-blocking large-chunk warning remains.

### Corrected failure

First Round-4D CI run failed only because one architecture assertion still expected the removed phrase `service time / instance`. The assertion was updated to the new user-facing terminology; no product behavior changed in that fix.

### Dependencies

No dependency change. No new framework.

### Interface changes requested

None.

### Remaining review item

Browser review should confirm:
- topology strip is immediately readable at normal viewport widths;
- Scenario-B straight logical edges remove the visible kink without harming other logical layouts;
- wording density is appropriate.

### Promotion recommendation

**PROMOTE/PORT** this bounded clarity pass to `agent/integration` after Agent-F browser review.

Stop here; Scenario-A fidelity remains Agent A's independent Round-4D repair track.


## Coordinator Round 4D UI review — 2026-10-10

**Agent F decision:** **PORT accepted; Agent C CLOSED/IDLE pending browser review.**

Accepted:
- system-topology strip from current RunConfiguration;
- explicit classical pool parallel capacity and QPU execution-lane capacity;
- user-facing "modeled wall time / instance" terminology;
- direct multiplicity explanation;
- redundant pool-ID cleanup;
- bounded straight-edge routing for simple linear logical DAGs only;
- Advanced / Diagnostics unchanged;
- no model or scenario semantic changes.

Agent-C CI:
- code head `046ee9b462788bda9bdcbcdedc40c4d12e363030`: run `38088263060` success;
- handoff head `5437e3d2e1dd0f7456daf82ef4a1f9d5641f8479`: run `38088326153` success.

Port only the seven bounded Round-4D app/test files; do not replace the whole app tree because integration contains later browser-runtime fixes.

Remaining gate: browser visual check of topology-strip readability and straight-edge appearance.


## Round 4E task — integrate accepted actor-aware Scenario A

**Status:** REOPENED for one bounded integration pass. Prototype deadline remains ~3 days.

Use the latest accepted `agent/engine` Round-4D producer, including ordinal actor selection and the latest Scenario-A fixture after Agent-F review.

Required:
1. Port ordinal actor selection into app design types/declarations, compiler and actor-state derivation. Frozen DES stays unchanged.
2. Replace the current actor-less Scenario-A user preset with the accepted actor-aware scaled fixture:
   - 4 persistent HPC ranks;
   - rank 1 local preparation/submission -> one QPU request -> resumed local classical work;
   - ranks 2-4 independent classical work;
   - QPU capacity 1;
   - no global synchronization;
   - no baseline max-in-flight/admission policy;
   - queue wait = 0 and admission wait = 0;
   - after result return and until baseline completion: 4 Working / 0 Blocked / 0 Idle, QPU idle.
3. Keep the logical DAG compact; do not create one node per rank.
4. Preserve the accepted Round-4D Builder clarity work and the browser-safe Scenario-B module guard.
5. Add regression coverage for ordinal selection, Scenario-A actor frames, no baseline admission policy, no QPU queue/admission wait, restored-equilibrium frame, and unchanged B/C/D behavior.

Do not add generalized range/complement actor editing, per-instance timing tables, optimizer/Slurm export, DES changes, or landing-page redesign.

Run full app tests, TypeScript and Vite build. Stop for Agent F review/browser testing.


## Round 4E completion — 2026-10-10

**Status: GREEN CHECKPOINT — STOPPED FOR AGENT F BROWSER REVIEW.**

Green code head before this handoff:
`c77f2c96fce59cae569f64e8d31c64dc2084c1e5`

Validated GitHub Actions run:
`38089337263` — **success**

### Accepted Scenario-A producer integrated

Ported Agent A's accepted Round-4D/4E producer above the frozen DES:

- latest ordinal-aware design types;
- latest pure design compiler;
- latest actor-state derivation;
- accepted `qamp-a-actor-regimes.mjs` baseline/regime fixture.

Frozen DES remains unchanged:
- `app/src/engine/runtime.mjs` = `4023b3daf8ae7e50c6e7b7be8a886e2ea392dc84`.

Accepted producer hashes now used by the app:
- compiler = `57e17471fbb84b1fc7ec1a617046ab045121e494`;
- actor-state = `b864ef22743d661ce629f137e758f1a7575497ac`;
- Agent-A Scenario-A source = `862fff3bb74a5a732a05b64e9368d9566295306e`;
- app Scenario-A blob differs only by app-local compiler import path: `734fa79e8b7cc28de28d8db4f4d3f3d3a65e967c`.

### Ordinal actor selection

The app design/type/compiler path now accepts explicit ordinal actor selection:

`{ kind: "ordinals", actorOrdinals: [...] }`.

Compiler validation rejects:
- empty ordinal lists;
- duplicates;
- non-positive ordinals;
- ordinals above the configured persistent actor-group count.

No generalized ranges/complements were added.

### Scenario A user preset

The prior actor-less logical Scenario A was replaced with the accepted actor-aware scaled fixture:

- **4 persistent HPC ranks**;
- ranks **2–4** perform independent classical work;
- rank **1** performs local preparation/submission;
- one local QPU request on **QPU capacity 1**;
- rank 1 has an authored `quantum-result` wait after submission;
- rank 1 resumes local classical work after result return;
- no global synchronization gate;
- no baseline `maxInFlightQuantumByPool` admission policy.

Baseline accepted behavior:
- rank state at t=0.5: **4 Working / 0 Blocked / 0 Idle**;
- t=1.5: **3 Working / 1 Blocked / 0 Idle**;
- t=4: **4 Working / 0 Blocked / 0 Idle**, QPU idle;
- t=7: **4 Working / 0 Blocked / 0 Idle**, QPU idle;
- local resumed work starts at t=3 and continues to t=8;
- independent background work continues to t=8;
- QPU queue wait = **0**;
- QPU admission wait = **0**;
- quantum branch remains off the baseline critical path.

The accepted longer-QPU and fixed-topology offered-load regime fixtures are also present for regression evidence; the user-facing baseline remains the one-request Scenario A above.

### Scenario B browser safety preserved

Ported the already-accepted integration guard verbatim:

`if (typeof process !== "undefined" && import.meta.url === ...)`

Current app Scenario-B producer hash:
`d8343e544ff693160af9f2bcae84fec3be66e703`.

This prevents the Node-only direct-execution hook from referencing `process` during browser module loading.

Scenario-B model semantics/timing were not changed.

### Round-4D Builder clarity preserved

Verified unchanged from the accepted Round-4D pass:

- `SystemTopologyStrip.tsx` = `c37b826d6ee78b4330100f06de7474da3ec329f0`;
- `LogicalTaskInspector.tsx` = `0caf1e89b045e0cd7648ddf6c767007a4ce983bc`;
- logical projection `projectDesign.ts` = `59aff6673374aad249fd30a806843e6f7bebc655`;
- bounded linear logical routing `WorkflowDag.tsx` = `ccd50e7356853ef4039c228faa28dfcc4016f71f`.

Therefore Round-4D:
- topology strip;
- modeled-wall-time wording;
- ×N explanation;
- redundant-label cleanup;
- straight routing for simple linear logical DAGs

remain intact.

### Explore / Advanced preserved

No Explore product code changed in Round 4E.

Verified:
- `app/src/components/explore/ExploreView.tsx` = `a519cbd107035429c9729011d00412baaef76b45`.

Actor-aware Scenario A automatically flows through the already-accepted Round-4C actor-aware Explorer/playback path because its manifest now contains authored actor groups, ordinal participation and actor waits.

### Regression coverage

Added the accepted Agent-A Scenario-A/regime suite to the app canonical test matrix.

Round-4E assertions include:
- explicit ordinal selection compiles to exact actor assignments;
- ordinal out-of-range validation;
- Scenario-A 4-rank actor frames;
- no baseline admission policy;
- QPU queue wait = 0;
- QPU admission wait = 0;
- restored-equilibrium t=4 and t=7 frames;
- QPU idle after result return;
- resumed local work through baseline completion;
- longer QPU timing extends only local submitter blocking;
- A-like multi-request topology can transition to queue pressure from timing/load parameters alone;
- B-like global synchronization still requires explicit authored topology;
- B/C/D user-facing preset behavior remains covered by the existing A-D product suite.

### Validation

Green run `38089337263`:

- engine: **17/17**
- design/compiler: **7/7**
- actor model/state: **6/6**
- Scenario-A/regime suite: **7/7**
- QAMP behavior: **5/5**
- causal derivation: **4/4**
- trace playback: **14/14**
- actor-aware playback: **7/7**
- Round-4C product acceptance: **6/6**
- architecture/UI: **12/12**

Total Node tests: **85/85**.

Also green:
- TypeScript `tsc --noEmit`;
- Vite 8.3.4 production build;
- 222 modules transformed.

Build output:
- CSS ~42.06 kB / 8.41 kB gzip;
- JS ~1.983 MB / 607.75 kB gzip;
- existing non-blocking large-chunk warning remains.

### Exact Round-4E code diff

Only:
- `app/package.json`;
- `app/src/design/types.ts`;
- `app/src/design/compiler.mjs`;
- `app/src/design/actor-state.mjs`;
- `app/src/presets/qamp-a-actor-regimes.mjs`;
- `app/src/presets/qamp-a-actor-regimes.d.mts`;
- `app/src/presets/qamp-b-actor.mjs` (browser guard only);
- `app/src/presets/logical-presets.mjs` (Scenario A replacement only);
- `app/tests/scenario-a-regimes.test.mjs`;
- `app/tests/round4c-ui.test.mjs` (stale Scenario-A assertions updated).

### Dependencies

No dependency change. No new framework.

### Interface changes requested

None.

Ordinal actor selection was already accepted by Agent F as an additive design-layer extension above the frozen DES.

### Explicitly not added

- generalized actor range/complement selection;
- actor-authoring UI;
- per-instance timing tables;
- optimizer;
- Slurm export;
- DES changes;
- Scenario B/C/D semantic changes;
- landing-page redesign.

### Remaining review

Agent F browser review should verify:
- Scenario A Builder shows the compact actor-aware logical design without one node per rank;
- Scenario A playback visibly transitions 4W/0B/0I → 3W/1B/0I → restored 4W/0B/0I;
- QPU is idle in restored equilibrium;
- Round-4D topology strip/terminology/routing remain visually intact;
- Scenario B still loads safely in browser.

### Promotion recommendation

**PROMOTE/PORT Round 4E to `agent/integration` for final A-D browser acceptance.**

Stop here. Further Agent-C work should be driven only by Agent-F browser findings or a new bounded assignment.


## Coordinator Round 4E final review — 2026-10-10

**Agent F decision:** **PROMOTE/PORT accepted; Agent C CLOSED/IDLE.**

Verified:
- Agent-C code head `c77f2c96fce59cae569f64e8d31c64dc2084c1e5` passed CI run `38089337263`;
- final handoff head `7903a172f5de3b9f85796551bab5d5e607c19cd7` passed CI run `38089419185`;
- staged integration commit `65277404c9cc0000e8170567874456a2ccdd6c20` passed integration CI run `38089988964`.

Producer integrity:
- app compiler exactly matches latest accepted Agent-A compiler;
- app actor-state derivation exactly matches latest accepted Agent-A producer;
- Scenario-A fixture differs from Agent-A source only by the app-local compiler import path;
- frozen DES remains unchanged;
- Scenario-B browser process guard is preserved.

Accepted product behavior:
- Scenario A is now actor-aware and compact;
- baseline actor sequence includes local submitter blocking and restored full-rank classical work;
- baseline QPU queue/admission waits are zero;
- no baseline admission-control policy is present;
- Scenario A remains off the overall critical path;
- ordinal actor selection is supported in the design/compiler layer;
- B/C/D behavior and prior Builder clarity work remain intact.

Remaining gate is browser acceptance only.
No further Agent-C work is requested unless browser testing finds a concrete defect.


## Coordinator Round 4E final review — 2026-10-10

**Agent F decision:** **PROMOTE/PORT accepted; Agent C CLOSED/IDLE.**

Verified:
- code head `c77f2c96fce59cae569f64e8d31c64dc2084c1e5` passed CI run `38089337263`;
- handoff head `7903a172f5de3b9f85796551bab5d5e607c19cd7` passed CI run `38089419185`;
- staged integration commit `65277404c9cc0000e8170567874456a2ccdd6c20` passed integration CI run `38089988964`.

Producer integrity:
- compiler and actor-state producer exactly match accepted Agent-A files;
- Scenario-A fixture differs from Agent-A source only by the app-local compiler import path;
- frozen DES is unchanged;
- Scenario-B browser guard remains present.

Accepted:
- actor-aware compact Scenario A;
- restored-equilibrium actor frames;
- zero baseline QPU queue/admission wait;
- no baseline admission policy;
- prior B/C/D behavior and Round-4D Builder clarity remain intact.

No further Agent-C work unless browser acceptance finds a concrete defect.


## Coordinator Round 4G assignment — 2026-10-11

**Status: ACTIVE** for public-scale A–D demo conversion, with bounded checkpoints. Fetch `origin/agent/integration` at/after `f8766ce63a37947b20d96d83d4728c70a9c19bbd`; read `AGENTS.md`, the current integration `PROJECT_STATE.md`, `REVIEW_QUEUE.md` (Round 4G), `INTERFACE_CONTRACTS.md`, and D013/D014. **Do not wholesale merge lab/integration branches.** Selectively port the accepted new A producer + selector semantics from integration onto `agent/ui` to continue your self-contained app lab.

**Checkpoint 1 (do now):** public Scenario A -> dedicated `qamp-a-1000-demo.mjs` design/run/profile (four logical tasks, 1,000 persistent ranks; rank 1 waits locally; others continue; local path 8 s, critical background 10 s). Keep small fixtures as regression. Verify exact actor frames 1000/0/0 -> 999/1/0 -> 1000/0/0 and QPU no queue/hold; retain stable logical DAG and one cursor, correct timing/provenance/units. Bound lengthy default task-ID strings. Test Builder+Explore, custom parameter edit, Compare; preserve the older Scenario-B browser `process` guard.

**Checkpoint 2:** compact, source-grounded B with 1,000 ranks / ~200 submitters, serial QPU, no queue-wall explanation, explicit complete-result global sync, and full collective continuation. Preserve small B regression. Measure *full* frame/keyframe construction and cursor updates, not only DES runtime. A separate Agent-A scalability task is active; if performance is not acceptable, report a precise blocker rather than silently shrinking the demo.

**Checkpoint 3 (feasibility first):** C latency/data wall and D throughput/throttle pipeline at tutorial-like scale. Identify exact missing representational or performance constraints before implementing; no hand-coded counters, invented provider queues, or fabricated B/C/D ranks. In D target ~50 admitted jobs (QPU 1 run +49 resource queued) distinct from policy-held demand; if actor Waiting/Blocked from admission is unrepresentable under current actorWait event vocabulary, raise the issue for F/A rather than labeling policy-held actors Blocked. C should not create a QPU queue wall when modeling communication-only delay.

**Deliverable each checkpoint:** exact paths/commit, tests/CI, synthetic assumptions, performance evidence, unresolved defects, recommended PORT/REIMPLEMENT/DEFER and STOP for F review. Frozen DES, GitHub Actions, Advanced diagnostics, custom authoring and Compare must survive. Do not add UI-heavy actor authoring or post-prototype features.


## Round 4G Checkpoint 1 completion — public 1,000-actor Scenario A

**Status: GREEN CHECKPOINT — STOPPED FOR AGENT F REVIEW.**

Green code head before this handoff:
`5f68a9337c7d898f5c70ebb732a220327f59e677`

Validated GitHub Actions run:
`38310612630` — **success**

### Public Scenario A conversion

The public `scenario-a` preset now uses the accepted Round-4F producer:

- `app/src/presets/qamp-a-1000-demo.mjs`
- accepted integration blob: `a945de6e7aea9fb8c86dbcd3317737d9e5092731`

The public bundle retains the existing preset key/identity in the preset registry while using the accepted design/config/profile:

- 1,000 persistent HPC-rank actors;
- 4 logical tasks;
- 4 compiled DES tasks;
- one aggregate independent-classical task covering ranks 2–1000;
- rank 1 local submission → one QPU request → local resumed work;
- CPU capacity 1,000;
- QPU capacity 1;
- no baseline max-in-flight/admission control;
- no global synchronization gate;
- all numeric times explicitly synthetic.

Default UI remains compact because actor scale is represented in actor counts, not DOM/DAG node count.

### Accepted symbolic selectors ported selectively

Selectively ported from accepted `agent/integration` rather than merging the branch:

- `app/src/design/types.ts` = `dcee438a3069789f69b847054d92c03e426a5e14`
- `app/src/design/compiler.mjs` = `9da33034e8416772fb6f8c62a655cc7a1f469155`
- `app/src/design/actor-state.mjs` = `1562ee2fd5d6065b7f7c71249f2df8aef7f746f1`

Public A uses:
- `range(1..1)` for rank 1;
- `all-except [1]` for ranks 2–1000.

No frozen-DES change.

### Four-rank regression fixture preserved

The small actor-aware A fixture remains in the repository and test matrix:

- `app/src/presets/qamp-a-actor-regimes.mjs` = `19db68047aeb183046736bfb59dc5f5d635b7eb8`
- `app/tests/scenario-a-regimes.test.mjs` retained.

This remains the compact regression fixture; it is no longer the public A preset.

### Public A behavioral acceptance

Verified:

- actor count = **1,000**;
- logical tasks = **4**;
- compiled DES tasks = **4**;
- at t=0.5: **1000 Working / 0 Blocked / 0 Idle**;
- at t=1.5: **999 Working / 1 Blocked / 0 Idle**;
- at t=4 and t=7: **1000 Working / 0 Blocked / 0 Idle**;
- QPU idle in restored equilibrium;
- QPU queue wait = **0**;
- QPU admission wait = **0**;
- local branch completes at t=8;
- independent background completes at t=10;
- makespan = t=10;
- local quantum branch therefore remains **strictly off the critical path**.

### Builder / edit / re-simulate / Compare evidence

Added `app/tests/round4g-a-ui.test.mjs`.

It verifies:

- public A is the accepted compact 1,000-actor producer;
- the Builder-style design/profile path remains compilable;
- a modeled-wall-time edit re-simulates deterministically;
- baseline makespan 10 → edited background-wall-time makespan 12;
- saved RunRecord envelopes retain design/config/profile/manifest/result;
- baseline and edited runs remain directly comparable through authoritative result metrics;
- user-entered edit provenance is preserved.

Existing Compare component/source path is unchanged.

### Synthetic provenance

The public A profile explicitly retains:

- provenance kind `synthetic`;
- source `Round 4F Scenario A 1000-rank demo`;
- profile assumption that all numeric times are synthetic and illustrative.

Public preset description also identifies the 1,000-rank scale as synthetic.

### Playback / visible-state acceptance

Actor-aware playback uses the existing accepted Round-4C playback path unchanged.

Verified:

- restored-equilibrium frames exist with 1,000 Working / 0 Blocked / 0 Idle;
- logical DAG remains 4 nodes;
- default Explore shows aggregate actor counts and QPU state;
- expanded DES remains under Advanced / Diagnostics;
- no one-node-per-rank expansion;
- no raw-event blinking;
- one synchronized time cursor remains unchanged.

### Measured Checkpoint-1 performance

Measured on GitHub Actions CI using the current accepted baseline actor projection (not Agent-A's still-unreviewed Round-4G optimization):

Compile, 7 repeats:
- min **0.071 ms**
- median **0.295 ms**
- max **0.837 ms**

Frozen-DES simulation, 7 repeats:
- min **0.062 ms**
- median **0.151 ms**
- max **7.004 ms**

Four actor snapshots (t=0.5, 1.5, 4, 7), 7 repeats:
- min **4.938 ms**
- median **5.608 ms**
- max **13.938 ms**
- median per queried snapshot ≈ **1.402 ms**

Full actor-aware keyframe construction, 5 repeats:
- keyframes: **5**
- min **5.136 ms**
- median **13.975 ms**
- max **21.972 ms**

Process-memory observation across the benchmark test:
- RSS: 50,970,624 → 73,392,128 bytes; delta **22,421,504 bytes**
- heap used: 5,812,752 → 6,908,512 bytes; delta **1,095,760 bytes**

These are CI-process observations, not isolated browser peak-memory measurements.

Conclusion for Checkpoint 1:
- A-1000 is comfortably usable under the current projection in CI.
- **No claim is made about B-200 or D-1000 scalability.**
- Agent A's separate Round-4G optimization is still pending Agent-F review and was deliberately not imported.

### Round-4D / browser-safe preservation

Verified unchanged:

- frozen DES `app/src/engine/runtime.mjs` = `4023b3daf8ae7e50c6e7b7be8a886e2ea392dc84`;
- browser-safe Scenario-B module = `d8343e544ff693160af9f2bcae84fec3be66e703`;
- `ExploreView.tsx` = `a519cbd107035429c9729011d00412baaef76b45`;
- Round-4D topology strip = `c37b826d6ee78b4330100f06de7474da3ec329f0`;
- Round-4D bounded logical routing = `ccd50e7356853ef4039c228faa28dfcc4016f71f`.

No B/C/D public conversion was started.

### Validation

Green run `38310612630`:

- engine: **17/17**
- design/compiler: **7/7**
- actor model/state: **6/6**
- 4-rank Scenario A/regimes: **7/7**
- 1,000-rank Scenario A: **5/5**
- QAMP A-D regression fixtures: **5/5**
- causal derivation: **4/4**
- trace playback: **14/14**
- actor-aware playback: **7/7**
- Round-4C product acceptance: **6/6**
- Round-4G public-A UI/data path: **4/4**
- Round-4G A-1000 performance evidence: **1/1**
- architecture/UI: **14/14**

Total Node tests: **97/97**.

Also green:

- TypeScript `tsc --noEmit`;
- Vite 8.3.4 production build;
- 222 modules transformed.

Build output:

- CSS ~42.06 kB / 8.41 kB gzip;
- JS ~1.981 MB / 607.47 kB gzip;
- existing non-blocking large-chunk warning remains.

### Exact Checkpoint-1 production changes

From the Round-4G assignment head, only A/selectors/tests changed:

- `app/src/design/types.ts`
- `app/src/design/compiler.mjs`
- `app/src/design/actor-state.mjs`
- `app/src/presets/qamp-a-1000-demo.mjs`
- `app/src/presets/qamp-a-actor-regimes.mjs` (latest accepted small regression fixture)
- `app/src/presets/logical-presets.mjs` (A bundle switch only)
- `app/src/presets/presets.ts` (A description only)
- A-focused test/package/architecture files.

### Failures corrected during checkpoint

Two intermediate CI failures were expected migration mismatches:

1. producer was ported before the latest 4-rank regression test, so the old test briefly expected the prior critical-path timing;
2. the Round-4C public A-D test still referenced the old public A task ID / makespan assumptions.

Both were corrected by porting/updating accepted regression expectations. No DES or public model behavior was changed to satisfy the tests.

### Dependencies / workflows

No dependency change.

GitHub Actions workflow semantics unchanged.

### Proposal

**PORT Checkpoint 1.**

Do not begin public-scale B on this branch until Agent F reviews/promotes this checkpoint and separately decides whether to port Agent A's Round-4G actor-projection optimization.

STOP here for Agent F review.

## Coordinator Round 4H assignment — 2026-10-12

**ACTIVE — public Scenario B / Checkpoint 2 only, STOP for F review.** F accepted/staged your public 1,000-rank A checkpoint (`d57abf5`, integration CI `38313789867`). Fetch/read `origin/agent/integration` at/after **`f59849ea58ca5f123821ed470814802a5fdb0371`**, D016/D017, `REVIEW_QUEUE.md` Round 4H, `PROJECT_STATE.md`, `INTERFACE_CONTRACTS.md`, and `AGENTS.md`. Do not wholesale merge branches; port accepted actor-state index from F staging into your lab so C does not benchmark old scan code.

**Build public B200:** 1,000 persistent ranks, ~200 submitters/results, one QPU service lane, complete-result global synchronization and 1,000-rank collective recovery. Keep only a few logical DAG nodes; small B stays regression. Separate QPU resource queued from policy-held and make synchronization/dependency, not policy admission, the explanation of the collective wall. Use `app/tests/fixtures/qamp-b-200-stress.mjs` in integration as test/reference, but author a clearly labeled synthetic public preset separately.

**Performance gate:** measure actual full `buildActorAwareVisualKeyframes` + time-cursor snapshot, React Explorer/Builder interactions, not just A actor index microbenchmark; verify expanded ~401-task compiled DAG does NOT mount/render/layout while Advanced is closed (lazy disclosure or equivalent). Ensure no raw blinking, maintain single cursor, preserve QPU labels, Scenario B browser `process` guard, custom edit and Compare, and no new libraries. CI tests + typecheck/build, and browser smoke if accessible.

**Deliverable:** exact commits/paths, numeric performance, proof of public B actor transitions and DAG compactness, failures, PORT recommendation. STOP before C/D implementation; A's separate D queued-trigger repair is pending F review.


## Round 4H Checkpoint 2 completion — public B200

**Status: GREEN CHECKPOINT — STOPPED FOR AGENT F REVIEW.**

Green code head before this handoff:
`d5af9ea637139a04325e046645f0f7a29daf1ffe`

Validated GitHub Actions run:
`38321799519` — **success**

### Accepted indexed actor projection ported

Selectively ported from accepted integration D016; no whole-branch merge:

- `app/src/design/actor-state-index.mjs` = `dc87341ba6eedf789774e7d10ae5c5d86c3b0af1`
- `app/src/design/actor-state.mjs` = accepted cached-projector wrapper
- projector types/declarations
- semantic-oracle helper/tests
- accepted 1,000-actor/200-QPU stress fixture

The existing detail/count APIs remain backward compatible.

Production actor-aware playback now also passes the indexed group-summary provider, so default actor composition/signatures do not rescan 1,000 actors for every visual state.

Frozen DES remains unchanged:
`app/src/engine/runtime.mjs` = `4023b3daf8ae7e50c6e7b7be8a886e2ea392dc84`.

### Public Scenario B200

Added dedicated production preset:

- `app/src/presets/qamp-b-200-demo.mjs`
- `app/src/presets/qamp-b-200-demo.d.mts`

Public B now uses:

- 1,000 persistent MPI-rank actors;
- 200 submitting/preparation instances;
- 200 quantum evaluations;
- one collective continuation;
- **3 logical DAG nodes**;
- **401 compiled DES tasks**;
- CPU capacity/reservation 1,000;
- QPU capacity 1;
- QPU max-in-flight 1;
- one-per-instance submitter result waits;
- explicit all-rank complete-result global gate;
- all 1,000 ranks return to collective useful work after all results complete.

All numeric times and scale choices are explicitly synthetic.

The accepted B200 stress fixture remains test/reference data and is not reused as the production preset object.

### Bottleneck semantics

Verified public B:

- makespan = **202 s** synthetic model time;
- QPU resource-queue wait = **0**;
- QPU admission/service-serialization wait > 0;
- t=0.5: **200 Working / 0 Blocked / 800 Idle**;
- t=1: **0 Working / 200 Blocked / 800 Idle**;
- t=2: **0 Working / 1,000 Blocked / 0 Idle**;
- at t=2 blocked-reason counts:
  - global synchronization = **1,000**
  - quantum-result = **199**
- t=201.5: **1,000 Working / 0 Blocked / 0 Idle**.

At t=1:
- QPU running = 1;
- resource queue depth = 0;
- policy-held quantum tasks = 199.

Therefore policy admission serializes QPU service, but the explanatory full-group wall is the authored complete-result dependency/global synchronization. Resource queue is not misrepresented as the cause.

### Logical/default UI remains compact

Public B default DAG:
- Preparation ×200
- Quantum ×200
- Collective ×1

No one-node-per-rank or one-node-per-compiled-task default rendering.

Default QPU task-ID text is bounded to the first 3 IDs plus a `+N more` summary, preventing 199 policy-held IDs from flooding the screen.

Small 4-rank Scenario B remains as regression/browser-safety fixture:
`app/src/presets/qamp-b-actor.mjs` = `d8343e544ff693160af9f2bcae84fec3be66e703`.

Its `typeof process !== "undefined"` browser import guard is unchanged.

### Advanced compiled graph is now truly lazy

Both collapsed Advanced disclosures now conditionally mount their contents only when opened:

- Explorer `Advanced / Diagnostics`
- Builder `Advanced · compiled DES preview`

Therefore B200's 401-node compiled React Flow graph is not mounted and ELK layout is not invoked while Advanced is closed.

Advanced content itself is preserved; this is mounting/lifecycle behavior only.

### Builder edit / recompile / rerun / Compare evidence

Focused B200 acceptance verifies a Builder-style quantum modeled-wall-time edit:

- baseline quantum wall time = 1 s;
- edited quantum wall time = 1.5 s;
- baseline makespan = 202 s;
- edited makespan = 302 s;
- resource queue remains zero;
- admission serialization remains positive.

Saved RunRecord envelopes retain design/config/profile/manifest/result, and user-entered provenance is preserved for comparison.

### Measured Checkpoint-2 performance

Measured in GitHub Actions CI using the accepted indexed projection and the production B200 bundle.

Logical compile / Builder-recompile proxy:
- median **11.762 ms**

Frozen-DES simulation:
- median **22.491 ms**

Full `buildActorAwareVisualKeyframes`:
- produced **203 keyframes**
- median **35.451 ms**
- max **92.083 ms**

Explorer time-cursor sweep:
- **405 cursor positions** (0 to 202 s in 0.5-s increments)
- each position derives generic system state + indexed actor-aware summary
- median **0.411 ms**
- p95 **0.988 ms**
- max **4.467 ms**
- total sweep **208.641 ms**

Process-memory observation across the performance test:
- RSS delta **44,425,216 bytes**
- heap-used delta **8,721,656 bytes**

These are CI-process observations, not isolated browser peak-memory measurements.

Assessment:
- data/state path is comfortably interactive for B200;
- full keyframe construction is a one-time tens-of-ms cost and acceptable for prototype review;
- actual browser React render/click latency was not measurable with the available Agent-C tool environment, so Agent-F browser acceptance remains required.

### Validation

Green run `38321799519`:

- engine: **17/17**
- design/compiler: **7/7**
- small actor model: **6/6**
- indexed actor projector/oracle: **9/9**
- 4-rank Scenario A: **7/7**
- public A1000: **5/5**
- QAMP regression fixtures: **5/5**
- causal derivation: **4/4**
- trace playback: **14/14**
- actor-aware playback: **7/7**
- Round-4C product acceptance: **6/6**
- Round-4G A UI/data path: **4/4**
- Round-4G A performance: **1/1**
- Round-4H B state/synchronization: **2/2**
- Round-4H B edit/provenance: **2/2**
- Round-4H B performance: **1/1**
- architecture/UI: **18/18**

Total Node tests: **115/115**.

Also green:
- TypeScript `tsc --noEmit`;
- Vite 8.3.4 production build;
- 223 modules transformed.

Build output:
- CSS ~42.06 kB / 8.41 kB gzip;
- JS ~1.987 MB / 609.19 kB gzip;
- existing non-blocking large-chunk warning remains.

### Known costs / limitations

1. The reference-oracle indexed-actor test suite itself takes roughly 30 s in CI because it intentionally compares optimized and naïve semantics across B200; this is test cost, not product cursor cost.
2. Actual browser interaction timing is still pending Agent-F smoke/acceptance.
3. Opening Advanced on B200 intentionally mounts the 401-task diagnostic graph; only the collapsed default path is guaranteed not to mount/layout it.
4. Scenario D queued actor-wait repair is a separate Agent-A/F track and was not consumed here.
5. Public C/D were not started.

### Exact production areas changed

- indexed actor projection files under `app/src/design/`;
- actor-aware playback summary adapter;
- dedicated `qamp-b-200-demo.*`;
- public B bundle/description;
- Explorer indexed-summary wiring;
- lazy Advanced mounting in Explore and Builder;
- bounded QPU task-ID display;
- focused tests/package scripts.

### Preservation audit

Unchanged:
- frozen DES;
- public 1,000-rank Scenario A;
- small A/B fixtures;
- Scenario-B browser `process` guard;
- Round-4D system-topology strip;
- Round-4D modeled-wall-time wording;
- bounded logical routing;
- custom authoring;
- Compare;
- one synchronized cursor;
- no raw-event blinking;
- no new UI framework/dependency.

### Dependencies

No new dependency.

### Recommendation

**PORT Round 4H Checkpoint 2.**

The public B200 data/state path is performant enough for prototype browser review. Browser smoke remains an integration-stage acceptance item, not a reason to shrink the public model.

STOP before public C/D implementation.

## Coordinator Round 4H acceptance / Round 4I assignment — 2026-10-12

**PORT ACCEPTED:** public B200, indexed actor summaries, lazy Advanced graphs, bounded QPU identifiers. Source `c80de454`, CI `38321963530` SUCCESS; selective integration `39a8a628`, CI `38322560759` SUCCESS (122/122 tests, typecheck/build). Browser visual interaction remains unverified.

**ACTIVE — Round 4I Scenario C only.** Fetch/read `origin/agent/integration` at/after `dbfc00eb8dd9b57e90613619f0fe8a7288e43af3` and Round 4I in `docs/coordination/REVIEW_QUEUE.md`, D018/D019 and `AGENTS.md`. Read source `HPC-Quantum/Documentation-website:scenario-c.md`. Preserve integrated D018 `queued` wait, A1000 and B200; do not wholesale merge.

Build compact public Scenario C over approximately 1,000 persistent HPC actors: positive transfer dependencies dominate short QPU/classical service; QPU can be idle while actors Blocked waiting on returned data; independent result consumers resume without global synchronization or meaningful backend queue/admission pressure. Do not inject 1,000 simultaneous requests into a capacity-1 QPU; use explicit, accurately labeled staggered/cohort aggregation. Do not invent per-rank counts, network resources, provider delay, or a new DES. Actor result waits should release no earlier than consumer readiness after modeled return transfer.

Validate source-faithful metrics/states, transfer parameter edit and Compare, actor half-open boundaries, playback/keyframe and default lazy view. Run Node tests/typecheck/build/CI; supply files/SHAs, perf evidence, limitations. **STOP for F review before public D.** FTQC remains documentation-only.


## Round 4I completion — public transfer-dominated Scenario C

**Status: GREEN CHECKPOINT — STOPPED FOR AGENT F REVIEW.**

Green code head before this handoff:
`f539b22a4a4bdbd260b1259b987b99b9ac6cb6be`

Validated GitHub Actions run:
`38326092092` — **success**

### Source basis

Public C was authored from:
- `HPC-Quantum/Documentation-website/scenario-c.md`;
- accepted D018 queued-wait contract;
- D019 public-B acceptance / Round-4I coordinator constraints.

Source-faithful mechanism retained:
- transfer/data movement dominates short classical/QPU service;
- no global synchronization;
- no provider/backend queue invention;
- QPU can be idle while actors remain Blocked waiting for results;
- independent consumers resume as their own result transfer completes;
- QPU capacity remains 1;
- no meaningful QPU resource queue or admission backlog.

### Actor/grouping choice

Public C uses **1,000 persistent MPI-rank actors** represented by **five explicitly labeled 200-rank cohorts**.

This is an authored aggregation, not an inference that each cohort is one physical rank or one exact real request stream.

Each cohort has a compact chain:

`classical preparation → positive outbound transfer → short aggregate QPU request → positive return transfer → independent classical continuation`

Production logical model:
- 5 preparation tasks;
- 5 aggregate QPU tasks;
- 5 independent continuation tasks;
- **15 logical tasks total**;
- **15 compiled DES tasks**;
- no per-rank nodes;
- no 1,000 simultaneous QPU-ready tasks.

The five cohort preparation wall times are staggered synthetically:
- 0.2 s;
- 1.2 s;
- 2.2 s;
- 3.2 s;
- 4.2 s.

Synthetic profile:
- outbound dependency latency = **5 s**;
- QPU service = **0.1 s**;
- return dependency latency = **3 s**;
- continuation = **0.5 s**.

All numeric values are explicitly synthetic/illustrative.

### Actor waiting semantics

Each 200-rank cohort:
- is Working during its authored preparation;
- becomes Blocked after preparation completes;
- remains Blocked across outbound transfer, QPU service, and positive return transfer;
- releases only when its own consumer becomes ready/starts after the return-transfer dependency completes;
- resumes independently, without a global gate.

Wait reason:
- `quantum-result`.

No `global-synchronization` wait is authored.

Half-open boundary acceptance:
- immediately before cohort-1 consumer start at t≈8.3, all 1,000 actors remain Blocked;
- at consumer start/ready after return-transfer completion, cohort 1 releases and 200 actors become Working.

### Source-visible C states

Verified representative states:

- **t=3.5:** 200 Working / 800 Blocked / 0 Idle, QPU idle.
- **t=4.5:** 0 Working / 1,000 Blocked / 0 Idle, QPU idle, five modeled communications active, QPU queue depth 0.
- **t=5.25:** 0 Working / 1,000 Blocked / 0 Idle, QPU Run=1, queue 0.
- **t=8.5:** 200 Working / 800 Blocked / 0 Idle, QPU idle while transfer remains active.

Independent continuation:
- first consumer starts at t≈8.3;
- final QPU result completes at t≈9.3;
- therefore an independent cohort resumes before the final QPU result is complete.

This reproduces the tutorial's transfer-wall pattern without a global barrier or backend saturation.

### Metrics / anti-D acceptance

Verified public C:
- makespan ≈ **12.8 s**;
- QPU resource queue wait = **0**;
- QPU admission wait = **0**;
- QPU utilization < **0.05**;
- aggregate modeled communication duration > summed task service time;
- no `maxInFlightQuantumByPool` policy;
- no global synchronization metadata.

At the full-stall t=4.5 state:
- QPU active units = 0;
- resource queue depth = 0;
- policy-held quantum tasks = 0;
- active modeled communications = 5;
- actors Blocked = 1,000.

This is explicitly Scenario C rather than Scenario D.

### Transfer parameter edit / Compare evidence

Focused test lowers transfer assumptions while preserving authored topology:
- outbound latency 5 → **2.5 s**;
- return latency 3 → **1.5 s**.

Results:
- baseline makespan ≈ **12.8 s**;
- edited makespan ≈ **8.8 s**;
- reduction ≈ **4.0 s**;
- QPU queue/admission wait remain 0;
- baseline at t=5: 1,000 Blocked;
- edited at t=5: 800 Blocked / 200 Idle.

Saved RunRecord comparison preserves:
- identical design topology;
- distinct profile assumptions;
- user-entered transfer provenance;
- authoritative result metrics.

### D018 selectively ported and preserved

Before implementing C, Agent C selectively ported F-accepted D018 support:
- actor wait event `queued` → existing DES `task_queued`;
- no frozen-DES changes.

Regression retained:
- `app/tests/fixtures/qamp-d-1000-stress.mjs`;
- `app/tests/scenario-d-admission.test.mjs`.

D1000 tests remain green, including:
- 1 running +49 resource-queued +950 policy-held at the accepted boundary;
- queued actor waits;
- immediate queued→started boundary;
- actor-state semantic-oracle equivalence.

Public D was **not** implemented.

### Playback / source-event mapping

Public C actor-aware playback:
- uses the accepted indexed actor projector;
- preserves one synchronized simulation-time cursor;
- keeps semantic source-event sequence ranges;
- produces fewer keyframes than raw events;
- preserves blocked actor compositions;
- no raw-event blinking;
- collapsed Advanced remains lazily mounted.

### Performance evidence

GitHub Actions CI, current accepted indexed projection:

Full `buildActorAwareVisualKeyframes`, 5 repeats:
- keyframes = **23**
- median = **1.291 ms**
- max = **14.432 ms**

Explorer-style cursor sweep:
- **257 positions** from 0 through makespan;
- each derives generic system state + indexed actor-aware projection;
- median = **0.063 ms**
- p95 = **0.160 ms**
- max = **1.657 ms**
- total = **20.635 ms**

Process-memory observation across the performance test:
- RSS delta = **11,849,728 bytes**
- heap-used delta = **6,404,944 bytes**

These are CI Node process measurements, not isolated browser paint/click/peak-memory measurements.

### Validation

Green run `38326092092`:

- engine: **17/17**
- design/compiler: **7/7**
- small actor model: **6/6**
- indexed actor projector/oracle: **9/9**
- 4-rank Scenario A: **7/7**
- public A1000: **5/5**
- accepted D018/D1000: **7/7**
- QAMP regression fixtures: **5/5**
- causal derivation: **4/4**
- trace playback: **14/14**
- actor-aware playback: **7/7**
- Round-4C product acceptance: **6/6**
- Round-4G A UI/data path: **4/4**
- Round-4G A performance: **1/1**
- Round-4H B state: **2/2**
- Round-4H B edit/provenance: **2/2**
- Round-4H B performance: **1/1**
- Round-4I C state/semantics: **5/5**
- Round-4I C edit/Compare/provenance: **3/3**
- Round-4I C playback/performance: **2/2**
- architecture/UI: **21/21**

Total Node tests: **135/135**.

Also green:
- TypeScript `tsc --noEmit`;
- Vite 8.3.4 production build;
- 224 modules transformed.

Build output:
- CSS ~42.06 kB / 8.41 kB gzip;
- JS ~1.990 MB / 609.95 kB gzip;
- existing non-blocking large-chunk warning remains.

### Failures corrected during Round 4I

1. First C compile attempt omitted the required actor-wait `instance` field for range-selected actors. Corrected to explicit `any-instance` activation/release; no timing/topology/resource values changed.
2. Exact decimal assertions exposed binary floating-point values such as 9.299999999999999 / 12.799999999999999. Tests now use bounded tolerance; model values unchanged.
3. Initial tolerance-helper patch accidentally wrote literal escaped-newline text into two test files; test source was repaired.
4. One remaining makespan-delta assertion used strict equality and was converted to the same tolerance helper.

No product semantics were changed to satisfy these test-source fixes.

### Exact Round-4I production changes

From the accepted Round-4H head:
- `app/src/design/types.ts` — D018 additive queued wait union;
- `app/src/design/compiler.mjs` — D018 queued→task_queued mapping;
- `app/src/presets/qamp-c-1000-demo.mjs`;
- `app/src/presets/qamp-c-1000-demo.d.mts`;
- `app/src/presets/logical-presets.mjs` — public C bundle switch;
- `app/src/presets/presets.ts` — public C description;
- focused C/D018 tests and package/architecture scripts.

Unchanged:
- frozen DES;
- public A1000;
- public B200;
- small A/B fixtures;
- B browser guard;
- indexed actor projector;
- Round-4D Builder clarity;
- Round-4H lazy Advanced behavior;
- Compare/custom authoring;
- no new dependency/framework.

### Known limitations

1. Five 200-rank cohorts are an explicit synthetic aggregation chosen to preserve the transfer-wall mechanism without creating a false QPU-saturation regime. They are not a measured per-rank arrival model.
2. Transfer is represented as dependency communication cost, not a network resource or topology model.
3. No provider queue, bandwidth contention between simultaneous transfers, or stochastic latency is modeled.
4. The current public C is one iteration; repeated iterative behavior would require explicit authored repeats/new work.
5. Browser paint/click/playback remains an Agent-F integration acceptance item; this checkpoint measures data/state/keyframe computation in CI.

### Source provenance

Primary conceptual source:
`HPC-Quantum/Documentation-website/scenario-c.md` — *Scenario C / Latency Wall (Transfer-Dominated Workflow)*.

The model preserves the source distinctions:
- transfer dominates;
- QPU can be idle while HPC actors wait;
- no global barrier;
- queue/throttling is not the cause;
- independent continuation resumes as results return.

### Recommendation

**PORT Round 4I public Scenario C.**

STOP here for Agent F review. Do not begin public D.

## Coordinator Round 4I acceptance / Round 4J assignment — 2026-10-12

**Decision: PORT ACCEPTED.** Your source `e25d21b8c85b263efc4e8947dbf261632d4b28e7`, CI `38326263206` SUCCESS. Selective integration `53248bf1a2c7488d52982a77191919f5ff4b0b0e`, CI `38326633662` SUCCESS (135 tests, TS/build). Public C models five explicitly synthetic 200-rank cohorts (=1,000 logical actors) and **five aggregate quantum evaluations**, not 1,000 independent provider jobs. C transfer-wall and queue-free/actor-state semantics accepted; browser acceptance still pending.

**ACTIVE — Round 4J public Scenario D ONLY.** Fetch/read `origin/agent/integration` at/after `63a52eba31ae47878690cbe69c55a6267148b504`, `AGENTS.md`, D018-D020, latest `PROJECT_STATE.md`, `INTERFACE_CONTRACTS.md`, and **Round 4J** in `REVIEW_QUEUE.md`. Ground in `HPC-Quantum/Documentation-website:scenario-d.md`; do not wholesale merge. Preserve accepted A/B/C1000, indexed actor projection, C editor/provenance tests and D018 `queued→task_queued` wait contract.

Build a dedicated *public* 1,000-rank Scenario D asynchronous QPU throughput demo: actual modeled 1,000 independent quantum requests, one QPU running, max-in-flight 50 (running + up to49 resource-queued), excess ready tasks policy-held, no global result barrier. QPU admission event begins each corresponding actor's Blocked wait; policy-held non-working ranks stay Idle; each completed result releases one rank into explicit useful classical continuation. `app/tests/fixtures/qamp-d-1000-stress.mjs` is the accepted reference, not automatically a public preset.

**No fake restored-Working frame:** The current reference ends with 1,000 Idle after one-shot drain. If useful classical continuation/repeat is authored, prove its timing and Working claims from real DES events. Do not claim 1,000 Working at the last quantum result or exact historical D6 off-load state without an actual task/transfer/wait mechanism; document any representational gap instead of inventing script counters or synchronization. Exclude provider queue and hidden transfer state-machine.

Test exactly preserved QPU resource queue vs policy hold, local progress, queue bound and capacity-limited utilization. Parameter edit/recompile/simulate/Compare must change authoritative metrics/provenance. Default logical DAG stays compact; Advanced with thousands of tasks stays lazily unmounted while closed and cannot catastrophically freeze when opened. Measure full keyframes, cursor/scrub and memory at 1,000 requests, preserve first/last semantic moments and compress sustained middle cycles; no raw blinking. No frozen DES, new framework, or FTQC.

**Handoff:** exact SHA/paths, tests/CI/typecheck/build, measured performance, source assumptions, limitations, PORT/DEFER recommendation. STOP for F review before further release work. F will handle browser acceptance and deployment.


## Round 4J completion — public Scenario D (2026-10-12)

**GREEN / STOP FOR AGENT F REVIEW.**

Code head: `f2127b04d769b35f62f4ffd7aee539a317faf025`  
CI: `38328657367` — SUCCESS.

### Public D1000

Added dedicated production preset `app/src/presets/qamp-d-1000-demo.mjs` (blob `ad319ddc896b967044b1b338f40821f321a70a81`), derived from accepted D018 stress semantics but with separate public identity/provenance.

Model:
- 1,000 persistent MPI-rank actors;
- logical DAG = Preparation ×1000 → Quantum ×1000 → Useful local continuation ×1000;
- 3 logical / 3,000 compiled DES tasks;
- CPU capacity 1,000; QPU capacity 1;
- `maxInFlightQuantumByPool.qpu = 50`;
- matching actor wait activates on accepted `quantum task_queued` admission and releases on matching quantum completion;
- no global gate, provider queue, hidden transfer or fabricated activity counters;
- synthetic task times: prep 1 s, QPU 1 s, local continuation 0.5 s.

Verified states:
- t=0.5: 1000 W / 0 B / 0 I.
- t=1: 0 W / 50 B / 950 I; QPU Run=1, resource Queue=49, policy-held=950.
- t=2: 1 W / 50 B / 949 I; first completed rank is in explicit local continuation and a new request has been admitted.
- max resource queue depth = 49; QPU utilization >0.99 during demand.
- first continuation starts t=2; last quantum completes t=1001.
- t=1001: 1 W / 0 B / 999 I.
- t=1001.5 makespan: 0 W / 0 B / 1000 I.

**No fake restored-Working frame:** this one-shot drain truthfully ends Idle. The historical recurring-loop / final 1000-Working frame requires explicitly authored next work and is not generated by UI counters.

### Queue versus policy-hold comparison

Same topology:
- max-in-flight 50: makespan 1001.5; QPU resource-queue wait 47,775; admission/policy wait 451,725.
- max-in-flight 20: makespan 1001.5; QPU resource-queue wait 18,810; admission/policy wait 480,690.

Thus a tighter bound moves waiting from admitted resource queue to policy-held state without changing single-lane throughput.

QPU modeled-wall-time edit 1.0 → 0.5 s:
- makespan 1001.5 → 501.5;
- saved RunRecords preserve identical design identity, authoritative result metrics and user-entered timing provenance.

### High-scale UI safety

D compiles to 3,000 tasks. Advanced remains lazy while closed and now has a second scale guard:
- above 500 compiled tasks, Explorer does not mount the expanded React Flow/ELK graph, task-level debugger, analytical strips or task/resource timelines;
- raw QueueEvidence table is also omitted at that scale;
- metrics, compilation provenance, playback diagnostics and assumptions remain available.
Builder likewise omits compiled React Flow/ELK preview above 500 tasks while keeping compilation provenance.

Default D remains only 3 logical nodes; no per-rank/default compiled-node rendering.

### Playback/performance

CI `ROUND4J_D1000_PERF`:
- 3,000 compiled tasks;
- 107 semantic keyframes;
- full actor-aware keyframe construction median **65.335 ms**, max **135.455 ms**;
- sustained middle drain includes compressed repeated keyframes with source-event sequence provenance;
- 201-position cursor sweep: median **2.496 ms**, p95 **4.347 ms**, max **10.382 ms**;
- process RSS delta **48,066,560 B**; heap-used delta **38,164,720 B**.

Browser paint/click performance remains Agent-F acceptance; these are Node/CI state-path measurements.

### Validation

Run `38328657367`:
- total Node tests **143/143**;
- D018 + public D aggregated suite **15/15**;
- architecture/UI **21/21**;
- all A/B/C and prior suites green;
- `tsc --noEmit` green;
- Vite 8.3.4 build green, 225 modules;
- JS ~1.992 MB / 610.60 kB gzip; existing large-chunk warning remains.

Preserved unchanged:
- frozen DES `4023b3daf8ae7e50c6e7b7be8a886e2ea392dc84`;
- public A1000 `a945de6e7aea9fb8c86dbcd3317737d9e5092731`;
- public B200 `5aadd43b0d71cd7bfda367c8ec1ced03da04ba4a`;
- public C1000 `e5d85b74221b9bdb87ff1cdf083a802d4464d478`;
- D018 compiler `3b2e0055fe3b852ede34661ee50cd2ed0d4fb681`;
- indexed actor projector `dc87341ba6eedf789774e7d10ae5c5d86c3b0af1`;
- logical routing `ccd50e7356853ef4039c228faa28dfcc4016f71f`.
No new dependency/framework/GitHub Actions change.

Known limitation: the contract does not naturally produce the legacy D6 transient two-Working off-load state or a final 1000-Working loop state without explicit additional authored work. Those states are deliberately not fabricated.

Source: `HPC-Quantum/Documentation-website/scenario-d.md`.

**Recommendation: PORT Round 4J public D. STOP.**

## Coordinator Round 4K release-support assignment — 2026-10-12

**Round 4J public D1000 PORT ACCEPTED.** Source `806459aeebc2bac22e8acc5fdd86c3c1309eba40`, CI `38328951941` SUCCESS; integration `e49954bc9caf5f3e18472b3d229c96b9ebdd2c70`, CI `38332756103` SUCCESS (143/143 Node tests, TS/build). All A–D features are integrated. Frozen DES remains unchanged.

**ACTIVE — bounded release support ONLY, STOP for F review.** Fetch `origin/agent/integration` at/after `f3f49f30d6dbf3d71d684f8454cb48f975ebda66`. Read `AGENTS.md`, policy, `PROJECT_STATE.md`, `REVIEW_QUEUE.md`, `INTERFACE_CONTRACTS.md`, D021/D022 and `docs/coordination/RELEASE_ACCEPTANCE.md`. No more simulator features or wholesale merge.

**1. Reproducible install:** Generate `app/package-lock.json` under Node 22 for the existing accepted dependencies. Run `cd app && npm ci --no-audit --no-fund && npm test && npm run build` in a fresh installation. Preserve current GitHub Actions workflows/triggers. Propose/test only the smallest `npm install` to `npm ci` validation-step change once the lock is verified. Do not bump dependencies or add libraries.

**2. Browser smoke where possible:** Test A/B/C/D in actual browser, Builder/Explore/Compare, Play/Pause/scrub, actor/queue/policy/transfer state at checkpoints in RELEASE_ACCEPTANCE.md, B401 Advanced open, D3000 Advanced omitted, custom edit/rerun/Compare, invalid-input messages. Record browser/version/SHA and real screenshots, logs or reproducible measurement. If no browser tool exists, report **unverified** and provide precise manual steps; never claim browser acceptance from Node tests.

**3. Deployment diagnosis only:** Identify app-root/Vercel build/output configuration and risks, but do not deploy, alter credentials or touch `main` or legacy `web/`.

**Deliverable:** exact commits/files, Node/npm versions, lockfile + clean npm-ci/CI evidence, browser proof versus missing evidence, deployment notes and PORT recommendation. Update your role file, then STOP for F. F owns selective staging, deployment and release promotion. FTQC future only.


## Round 4K completion — reproducible installation + actual Chromium smoke (2026-10-12/13)

**GREEN LAB CHECKPOINT — STOP FOR F REVIEW.** Product code remains F-accepted public A-D source 806459aeebc2bac22e8acc5fdd86c3c1309eba40; integration app staging is e49954bc9caf5f3e18472b3d229c96b9ebdd2c70. No DES/producer/actor/playback semantics or package-manifest change.

### Exact code/CI handoff

- **PORT:** app/package-lock.json, only changed file in bot commit df76022e5d7e9a1a12caea1fb6568a4aba0a7438. Generated on Actions Node 22 for existing accepted dependencies, no dependency bump. Bootstrap run 38333574146 **SUCCESS**: clean npm ci --no-audit --no-fund, all Node tests, TypeScript and Vite production build.
- **PORT to F's integration workflow:** equivalent one-line npm install to npm ci change; C lab .github/workflows/agent-ui-validation.yml at 48c576502fe5341b4ed685f7cfbe052ddbddcd8c, CI 38334748083 **SUCCESS**. Existing triggers and all other validation steps preserved.
- Browser clean-install runner Node v22.23.3, npm 10.9.9. Test-only Playwright driver installed ephemerally with --no-save --package-lock=false; no new production/dev library in package.json.
- **Investigation-only:** app/tests/round4k-browser-smoke.mjs, test-only revision de733c930be15e0cea7b207c87326a17897758bc. Not part of canonical npm test because Playwright remains ephemeral.
- Temporary lock-bootstrap and Chromium workflow files were deleted after evidence collection (352ec0f795bac5597a1a15dac68dbfb75c1be6f3, adc098942c9277ece68d54045fa72a6225bc8c83). Current agent/ui has only its original validation workflow with npm ci install.

### Real-browser results

- **SUCCESS** Chromium 141.0.7390.37, run 38334619801 on agent/ui@de733c9; 19 recorded checkpoints, zero browser page errors and zero console errors. Screen/log artifact ID 11783928804: https://github.com/friedsam/quantum-hpc-workflow-explorer/actions/runs/38334619801/artifacts/11783928804
- A: t0.5 Working/Blocked/Idle 1000/0/0; t1.5 999/1/0 with QPU running; t4 restored 1000/0/0 and idle QPU. Play/Pause worked.
- B: t1.01 0/200/800, QPU Run/Queue/PolicyHold 1/0/199; t2.02 0/1000/0, QPU 1/0/198; semantic frame t201 1000/0/0. B401 Advanced opened/rendered 401 React Flow nodes in about 3 seconds. Preparation logical node showed 200 complete.
- C: t4.48 0/1000/0 and QPU Run/Queue/PolicyHold 0/0/0; t8.51 200/800/0 and QPU 0/0/0. This verifies independent actor return in browser, not the transfer-count implementation independently.
- D: t1 0/50/950 with QPU 1/49/950; t2 1/50/949 with QPU 1/49/949; t1001.5 0/0/1000 and QPU idle. D3000 Advanced correctly omitted the compiled graph. Step/keyframe transitions remained usable.
- D browser edit quantum wall time 1.0 to 0.5 s reran and Compare displayed baseline 16.69 min vs edited 8.36 min, B-A minus 500.00 s (engine exact makespan 1001.5 to 501.5). Invalid multiplicity blocked Simulate; adding a consumer-to-prepare cycle produced the error 'workflow dependencies must form a DAG' and blocked Simulate.
- Actual reduced-motion browser preference disabled Play but left manual Next enabled.
- Earlier failed browser trial 38334133648 was a **test expectation error**: semantic frames reached B recovery at t201 rather than providing a separate exact t201.5 keyframe. Corrected runs 38334405211 and 38334619801 passed.

### Known limitations / release risks

1. **[verified]** The default range slider uses step max(makespan/200,0.01), about 1.01 s for B and 5.01 s for D, so exact interior times B201.5/D1/D2 require semantic stepping or another selection mechanism; this is a UI precision limit, not a DES defect.
2. **[verified]** 1440x900 screenshots show some long logical DAG nodes or status text clipped to the graph viewport; zoom/pan remains possible. **[likely]** Async ELK fit/width behavior may merit narrowly scoped polish, but root cause was not established. B Advanced first open takes around 3 seconds on CI Chromium; not an actual deployed-browser performance guarantee.
3. **[verified]** Browser checks ran on C's laboratory SHA, NOT integration staging SHA. F must perform staging/deployed browser acceptance separately.
4. **[verified]** No root vercel.json is tracked. The repository has both historical web/ and new app/. app/vite.config.ts uses relative base './'. Candidate Vercel configuration: Root Directory app; Node 22; install npm ci; build npm run build; output dist (repo-relative app/dist). Actual Vercel settings/routing could not be verified. No deploy, credential, main, or legacy web changes were made.
5. Existing large JS-chunk warning remains. No FTQC, scheduler, provider-queue or network-resource feature work.

**Recommendation: PORT** lockfile and single CI install-step update; keep browser script as investigation-only unless F chooses a future browser CI; archive screenshots as bounded evidence. **STOP for F review.**

## Coordinator Round 4K final review — 2026-10-12

**Decision: PORT ACCEPTED; Agent C CLOSED/IDLE.** Your lab `c0f597c401c519053e54097cc4b8290157053184` CI `38334927602` SUCCESS. Accepted npm-v3 lockfile `app/package-lock.json` (Node22/npm10, no dependency manifest changes) and the one-line `npm install`→`npm ci` integration-workflow update; port `agent/integration@736e0968ea6e49b24109726acd6697aae8b054d8`, staging CI `38337192791` SUCCESS (143/143 Node tests, TS/Vite). Frozen DES/actor/trace/UI production sources unchanged.

**Browser evidence ACCEPTED, correctly scoped:** Chromium141 C lab smoke `38334619801` passed 19 checkpoints; evidence artifact `11783928804`. Browser-run lab SHA `de733c930be15e0cea7b207c87326a17897758bc` and staging share exact `app/src` tree `6158a42b341583db4a60bbac4e7b898e32bbcef7`, `vite.config.ts` and `index.html`. This establishes a same-source functional/browser smoke, **not** a verified deployed staging URL or provider configuration. Playwright script remains investigation-only on your lab; no new production dependency/CI workflow retained.

**Documented usability limits:** B/D interior slider step coarse; long graph text clips at 1440×900; B401 Advanced initial open ~3s in CI Chromium. These did not fail the targeted smoke, but F may authorize a minimal targeted UI repair after deployed preview review. D3000 Advanced guard, A–D actor/QPU snapshots, editing/Compare and validation passed.

**Handoff state:** feature and release-support tracks complete. Agent C should make no further commits unless F creates a concrete bounded defect assignment. F owns provider root `app/`, deployed preview acceptance, final docs and `main` decision (D023, Round 4L). FTQC remains future work.
