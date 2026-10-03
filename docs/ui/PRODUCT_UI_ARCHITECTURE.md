# Product UI architecture — Agent C frozen-v1 integration

Date: 2026-10-02  
Branch: `agent/ui`  
Current checkpoint head before documentation commit: `882377be8b2c66184bcf8207abfe3cce1e35c312`

## Scope

[verified] Agent F froze the v1 product boundary as:

`create/edit WorkflowSpec → validate → simulate → inspect/animate SimulationResult → compare alternatives`

[verified] The Agent-C branch now implements that flow against the frozen v1 types and the exact accepted Agent-A engine runtime.

[verified] The prior duplicated v0 `app/src/model.ts`, compatibility `contracts.ts`, linear workflow preview, and obsolete v0 policy editor have been removed.

## Information architecture

### Builder

The Builder owns draft authoring only.

Supported authoring:
- workflow name and assumptions;
- tasks;
- dependencies;
- constant task service time;
- CPU/GPU/QPU resource pools;
- pool capacity and optional cost rate;
- fixed vs release-aware allocation;
- fixed classical reservation by pool;
- max in-flight quantum work by QPU pool;
- dependency fixed latency, data bytes and bandwidth.

A mutation produces a new explicit `WorkflowSpec`, invalidates the currently attached result, and leaves prior completed run snapshots intact for comparison.

The authoritative engine validator gates simulation. The UI does not silently clamp or repair semantic errors.

### Explore

Explore consumes one exact `WorkflowSpec + SimulationResult` pair.

It displays:
- workflow DAG;
- makespan and per-pool engine metrics;
- task-state intervals;
- resource-allocation intervals;
- resource queue samples;
- assumptions/provenance;
- semantic playback;
- structured resource-state snapshots.

The UI does not infer policy wait into queue depth or reconstruct hidden resource state.

### Compare

Compare consumes saved real engine runs. It does not recalculate scheduling outcomes.

For matching metric keys it shows:
- Run A value;
- Run B value;
- presentation-only B − A.

It deliberately does not score or rank a universally preferred scheduling policy.

## Shared-contract integration

### Domain types

`app/src/domain/types.ts` is the frozen v1 type surface.

### Engine

`app/src/engine/runtime.mjs` is the canonical accepted Agent-A frozen-v1 runtime. Round 3 does not modify it.

`app/src/services/engineAdapter.ts` remains the UI execution seam.

### Playback

`app/src/playback/trace-playback.mjs` is the canonical accepted Agent-B v1-compatible playback module and is unchanged in Round 3.

Production UI wording neutralizes periodic-compression labels to descriptions such as “Repeated 4-step activity ×21”; it does not claim semantic loop identity without workflow metadata.

Integration rule: if Agent F ports Agent B into a canonical playback location, remove the duplicate app copy and rewire imports.

## Workflow graph

[verified] Runtime DAG stack follows Agent D's accepted split:
- React Flow interaction/rendering;
- ELK layered layout;
- stable task/dependency IDs → node/edge IDs;
- explicit source/target handles;
- deterministic non-zero ELK seed;
- fixed WEST/EAST ELK ports;
- layout driven by topology/content sizing, not playback state.

[verified] Current React Flow documentation defines `<Handle>` as the custom-node connection point and shows target-left/source-right for horizontal flow. Its ELK multiple-handles reference uses unique ports plus fixed port order and WEST/EAST sides.

Builder graph actions:
- select a task;
- connect source → target handles to add a dependency;
- select/delete an edge;
- add/delete tasks through explicit controls.

Cycle/structural errors are allowed as visible drafts but engine validation prevents simulation until corrected.

## Runtime state graphics

Runtime state uses structured inline SVG, not a second graph renderer.

Stable cards represent resource pools. At a selected simulation time, the view reads only:
- half-open `ResourceInterval` state;
- explicit `QueueSample` depth.

States:
- active;
- allocated-idle;
- released;
- resource-queue depth.

The SVG has a text/table equivalent so the information is not color-only or SVG-only.

## Playback

The playback surface exposes semantic keyframes rather than raw events:
- restart;
- previous/next keyframe;
- Play/Pause;
- 0.5× / 1× / 2×;
- presentation progress;
- source event sequence range;
- simulation-time range;
- repeat count for compressed regions.

No autoplay occurs.

With `prefers-reduced-motion: reduce`, animation defaults disabled and step controls remain usable.

Playback updates the same simulation-time boundary used by the resource-state SVG. It does not mutate DAG geometry or engine state.

## Presets

A–D are templates/acceptance cases, not product navigation constraints.

Included:
- custom starter;
- Scenario A handoff;
- Scenario B fork/join;
- Scenario C synthetic latency stress;
- Scenario D bounded QPU admission;
- IBM/QAMP Fe4S4 SQD structural reference.

The IBM preset uses the accepted synthetic scaled E5 timings and labels them as synthetic; provider queue delay is excluded.

## Component split

`App.tsx`
- view selection;
- draft/result attachment state;
- engine simulation request;
- run-history snapshots.

`components/builder/`
- preset bar;
- task inspector;
- resource/policy editor;
- dependency editor;
- workflow settings;
- validation.

`components/graph/`
- workflow → graph projection;
- custom node/handles;
- ELK layout;
- React Flow canvas.

`components/explore/`
- metrics;
- task/resource timelines;
- queue evidence;
- assumptions;
- playback;
- runtime SVG snapshot.

`components/compare/`
- run selectors and metric comparison.

No component except the engine runtime defines `simulateWorkflow`.

## Validation evidence

GitHub Actions run `37070389320` on `agent/ui` completed successfully after the ELK port alignment.

Previous fully logged green run `37070157524` established:
- 17 engine Node tests pass;
- 13 playback Node tests pass;
- 7 architecture tests pass;
- TypeScript `tsc --noEmit` passes;
- Vite 8.3.2 build passes;
- 200 modules transformed.

The subsequent ELK metadata-only correction also completed green.

Branch audit:
- no legacy `web/` files modified;
- rejected `app/src/model.ts` absent;
- rejected `app/src/contracts.ts` absent;
- obsolete `PolicyEditor.tsx` absent.

## Accessibility / responsiveness

Implemented:
- semantic form labels/buttons;
- keyboard-visible focus;
- textual state labels in addition to color;
- aria-live validation/status messages;
- DAG authoring also has form-based dependency editing, so connection creation is not drag-only;
- accessible textual resource-state equivalent;
- reduced-motion behavior;
- layouts collapse to one column on narrow screens;
- wide comparison tables use controlled horizontal overflow.

## Known non-blocking risks

1. Production build warns that the main JS chunk exceeds Vite's 500 kB warning threshold (~1.90 MB minified / 586 kB gzip). ELK/graph code splitting is deferred.
2. No browser-level E2E interaction suite is included; build/type/test validation is CI-backed, while visual interaction still needs final integration smoke testing.
3. The engine contract accepts already-expanded DAGs. A first-class user-facing bounded-repeat/template authoring schema is not frozen and is not invented here.
4. Engine/playback runtime copies exist only so the Agent-C lab branch validates end-to-end. Integration should retain one canonical copy of each subsystem.

## Promotion recommendation

**PROMOTE/PORT hybrid recommendation**

PROMOTE substantially intact:
- `app/src/components/`;
- Builder → Explore → Compare state model;
- frozen-v1 UI domain imports;
- presets;
- tests;
- CSS/accessibility behavior;
- React/TS/Vite scaffold.

PORT/rewire during integration:
- `app/src/engine/runtime.mjs` to the canonical Agent-A engine location;
- `app/src/playback/trace-playback.mjs` to the canonical Agent-B playback location.

DEFER:
- bundle-size optimization;
- bounded-repeat authoring UI until an authoring representation is explicitly accepted.

## Round 3 — integrated model/provenance/debugger layer

Date: 2026-10-03  
Green code head: `299923914aaf564712ce674551ff17e2bdefec6f`  
Green validation run: `37092997663`

### Model boundary

The accepted pre-DES layer is now integrated:

`WorkflowDesign + RunConfiguration + SystemProfile → pure compiler → WorkflowSpec + CompilationManifest → frozen DES`

Design-backed run evidence snapshots design, run configuration, system profile, compiled WorkflowSpec, CompilationManifest, and SimulationResult.

The direct WorkflowSpec path remains supported for custom authoring. Editing a design-backed compiled preset detaches manifest/profile provenance and compiler-only task metadata before treating the workflow as a direct spec.

### A-D semantics

The app imports the exact accepted QAMP fixture producer blob from Agent A and validates its behavioral acceptance suite.

- A: local overlap; independent classical work defines the critical path.
- B: fixed classical reservation remains allocated-idle behind complete-result synchronization; no policy hold.
- C: communication/data movement dominates while QPU utilization remains low.
- D: QPU capacity plus bounded admission creates both a resource queue and a distinct policy-held ready set; local consumers progress independently.

The UI wraps these fixtures in versioned design/config/profile inputs with synthetic provenance. Scenario B receives accepted `collective-synchronization` semantic metadata; D receives independent actor-group hooks. Actor groups are not interpreted as persistent rank ownership.

### Causal debugger contract

`deriveSystemStateSnapshot(WorkflowSpec, SimulationResult, t)` is presentation-only.

Exact resource plane:
- active units;
- allocated-idle units;
- released units;
- engine queue depth and queued task IDs.

Separate causal plane:
- active communication;
- resource queue;
- policy-held QPU work;
- immediate dependency-gated classical work;
- conditional collective synchronization when semantic metadata proves it.

It never generates a generic blocked-rank/resource partition.

### Synchronized visual debugger

Explore composes four linked lenses:
1. exact-capacity SVG;
2. causal explanation cards;
3. fixed-geometry React Flow DAG state lens;
4. whole-run analytical strips.

One selected simulation time drives all four and semantic playback.

Runtime DAG styling changes presentation only: RUN, QUEUE, POLICY HELD, DEPENDENCY GATE, complete, and active transfer.

ELK layout remains keyed only to topology/content geometry, never playback/debug time.

Analytical strips show resource composition, QPU active intervals, resource queue and derived policy-held task counts. Cumulative cost remains disabled because frozen v1 supplies final cost only, not a producer-owned cost time series.

### Round-3 validation

GitHub Actions run `37092997663`:
- engine: 17/17;
- design/compiler/schema/manifest: 7/7;
- QAMP A-D: 5/5;
- causal state: 4/4;
- playback: 13/13;
- architecture: 10/10.

Total: **56/56 Node tests**.

Also passes TypeScript `tsc --noEmit` and Vite 8.3.2 production build.

Build: 208 modules; CSS ~35.70 kB / 7.28 kB gzip; JS ~1.934 MB / 596.18 kB gzip; existing non-blocking large-chunk warning remains.

### Round-3 scope boundary

Still deferred: optimizer; calibrated rank-scaling; persistent actor/rank-state model; provider scheduler; authoritative cumulative-cost time series; browser E2E/visual smoke; deployment/main promotion.
