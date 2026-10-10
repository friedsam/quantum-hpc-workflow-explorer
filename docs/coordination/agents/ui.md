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
