# Agent D — Graphics / Diagram Toolchain

Branch: `agent/graphics`

## Mission

Resolve the project's persistent technical-graphics failure mode: revisions must not destroy layout/alignment or require rebuilding a frame from scratch.

## Initial assignment

Benchmark robust ways to represent the same representative Explorer diagram.

Required candidates:
- structured SVG with fixed logical grid/anchors;
- graph layout suitable for runtime DAGs (for example ELK with a graph renderer);
- Figma-assisted/native editable design workflow if tool access permits;
- D2 or another text/graph-layout approach if it adds distinct value.

Required edits:
1. reproduce representative old system/workflow diagram;
2. move QPU block;
3. add GPU lane;
4. change serial flow to fork/join.

Evaluate edit robustness, determinism, runtime suitability, agent editability, text/accessibility, dependency cost and exportability.

## Rule

Matplotlib is appropriate for quantitative plots, not architecture/state/UI diagrams.

Prefer named anchors/grid/components over pixel-by-pixel redrawing.

## Boundaries

Do not:
- define simulation semantics;
- introduce multiple production graphics frameworks;
- promote a tool merely because the first drawing looks good.

## Current status

Checkpoint complete. Evidence: `docs/coordination/graphics/GRAPHICS_BENCHMARK.md`.

## Verified result

- Structured inline SVG + named anchors survived all four required revisions and produced deterministic repeat output in the benchmark test.
- ELK-style auto-layout handled GPU insertion/fork-join, but the cyclic legacy HPC↔QPU state panel reordered the intended spatial convention; auto-layout should own the DAG, not the fixed runtime state panel.
- Figma native is suitable for static polishing; scripted fork/join exposed coordinate/routing fragility for runtime topology edits.
- D2 was evaluated against current docs; strong export/browser support does not outweigh missing user-specified ports and stack duplication here.

## Recommendation

1. **Workflow DAG:** React Flow + ELK layered, explicit non-zero seed, stable node/edge/port IDs.
2. **Runtime resource/state graphics:** structured inline SVG on a strict logical grid with named anchors; presentation only.
3. **Static polished figures:** Figma-assisted authoring/export after product visuals stabilize.
4. **D2:** do not add to production stack.

No shared interface change is requested.

## Handoff fields

- Candidates: structured SVG/grid; ELK + React Flow fit; Figma native; D2.
- Artifacts: `docs/coordination/graphics/GRAPHICS_BENCHMARK.md`, `structured-svg-benchmark.mjs`, `test-structured-svg.mjs`; external Figma links are recorded in the benchmark.
- Dependencies added: none.
- Known failures: ELK cycle ordering for fixed state panel; Figma fork/join coordinate/routing fragility; raster-frame approach rejected.
- Production files proposed now: none; implementation should follow Agent F's toolchain review and Agent C's accepted scaffold.
- Investigation-only: Figma/FigJam benchmark files and benchmark renderer/test.
- Substantive checkpoint commits: `0d1d12035ec8dc6f8ff730c96fa9dd9faaef5daa` (benchmark/code) and `50aa223c653d3aeb76f02bf904ae3939e8fca8a8` (benchmark text-encoding repair).
- Coordinator heartbeat: inspected `agent/integration@c562c0d2a126a62cc5067e0b3d3299ea2d45eed6`; shared interface remains v0 provisional and Agent D is marked active/ready for review.
- Promotion recommendation: **PORT** the visual grammar/tool split; reimplement production components in the accepted scaffold rather than merging benchmark code wholesale.


## Coordinator review — 2026-10-02

**Agent F decision:** **PORT — checkpoint accepted. No further graphics research is required before UI integration.**

### Independently checked

- React Flow's official ELK example supports stable handle/port IDs and fixed port ordering for multi-handle layouts.
- ELK Layered supports orthogonal routing and port constraints; ELK exposes an explicit randomization seed, and seed 0 may be pseudo-random. Using a fixed non-zero seed is therefore appropriate for reproducible application layouts.
- Current D2 documentation still states that user-specified ports are not supported, which is a material limitation for this application.
- Current Figma MCP tooling can create/edit native frames, components, variables, and auto-layout content. This supports Figma as an editable design/polish surface, but it does not make Figma an appropriate runtime graph/state renderer.

### Accepted production split

1. **Workflow DAG:** React Flow + ELK layered, provided Agent C's accepted scaffold is React-based.
2. **Runtime resource/state view:** structured inline SVG with a stable logical viewBox, named anchors/ports, semantic IDs, and geometry independent of runtime state.
3. **Static polished tutorial/presentation figures:** Figma-assisted authoring after the runtime visual grammar stabilizes.
4. **D2:** do not add to the production dependency stack.
5. **Raster frame sequences / pixel-redraw workflows:** rejected for the rebuilt product.

### Visual grammar requirements carried into integration

- graph/state geometry must be derived from structure, not hand-maintained frame coordinates;
- runtime state changes modify state/text/style, not card geometry;
- stable task/resource/dependency IDs become stable node/edge/port IDs where applicable;
- auto-layout runs on topology/size changes, not on playback state updates;
- color cannot be the sole state encoding;
- SVG/state-heavy views need accessible text/DOM equivalents;
- quantitative plots remain separate from architecture/state graphics.

### Promotion scope

**PORT the decisions/grammar, not the benchmark implementation wholesale.**

The benchmark renderer/tests remain reference evidence on `agent/graphics`. Production SVG/React Flow components should be implemented in the accepted Agent-C scaffold after its coordinator review.

No new graphics framework investigation is requested. Agent D can pause until Agent F/C request a concrete production visual component or Figma polishing pass.


## Round 2B task — full-system visual language

**Status:** REOPENED for one bounded graphics workup.

The purpose is no longer to benchmark graphics libraries. The toolchain decision is already made.

### Product goal

Design a visual language for the Explorer as a **human-readable hybrid workflow simulator/debugger**.

Users should be able to:
- see the whole HPC/QPU system state at a selected simulation time;
- slow/step through semantic execution;
- identify where non-working capacity accumulates;
- distinguish queueing, dependency waiting, synchronization, communication, policy throttling, idle allocation, and released capacity where the underlying model supports those distinctions;
- correlate the current state with the workflow DAG and later with analytical time-series plots.

### Inputs

Use:
- accepted QAMP A-D scenario semantics from Round 2;
- frozen-v1 engine vocabulary;
- the current React Flow + ELK DAG and structured-SVG runtime approach;
- Agent B's existing semantic playback concept.

Do **not** assume that old Working/Blocked/Idle labels are automatically valid engine states. Agent B is separately testing causal-state derivability. Where a visual requires a causal state that is not yet guaranteed, mark it as dependent on B/F resolution.

### Required concepts to work through

1. Whole-system runtime panel:
   - HPC allocation/capacity;
   - working/active;
   - dependency-wait / synchronization-wait if supportable;
   - policy-held if supportable;
   - allocated-idle;
   - released;
   - QPU run + queue;
   - active communication.

2. Playback/debugger coupling:
   - selected simulation time;
   - semantic step/event;
   - DAG highlighting;
   - state changes without moving geometry;
   - compressed repeated activity without blinking.

3. Analytical output concept:
   - time-series strip(s) for resource-state composition, QPU queue/utilization, and cumulative cost;
   - a movable time cursor linked to the runtime panel;
   - click/zoom into an interval for slow playback.

### Deliverable

Produce a **design specification plus concrete static prototypes** for at least:
- Scenario B synchronization wall;
- Scenario D throughput/throttling.

Prefer structured SVG/Figma/native components that remain editable. Do not integrate into the staging app yet.

Evaluate whether the current simple resource-card SVG is sufficient or should be replaced.

Stop after this checkpoint for Agent F review.


## Coordinator input from Agent B Round 2B — 2026-10-03

Agent B's causal-state derivation is accepted.

Design against a **two-layer runtime model**:

### Exact resource layer
- classical active/working units;
- allocated-idle units;
- released units;
- QPU active units;
- QPU resource queue.

### Causal explanation layer
- communication-active dependencies;
- QPU-gated classical continuations;
- structural joins / collective synchronization where preset metadata establishes that meaning;
- policy-held QPU work / admission control.

Do **not** design a generic stacked `Working + Blocked + Idle + Released = capacity` view with `Blocked` as resource units. The engine does not preserve task→rank affinity, and A-D produce concrete double-counting counterexamples.

The visualization should still make waiting highly visible; show it as a causal overlay/annotation linked to DAG tasks/dependencies rather than silently reclassifying resource capacity.

For Scenario B, for example, it is valid to show:
- CPU reservation: 4 allocated-idle;
- collective continuation: demand 4, gated by unresolved quantum results;
- semantic label: collective synchronization wait (preset-authored meaning).

This should inform the current prototypes before handoff.


## Agent D Round 2B checkpoint — 2026-10-03

**Status:** **COMPLETE — stop for Agent F review.**

### Deliverables

Artifact commit: `7813a0425b119d18089ef1708b16707f7b096149`

- `docs/coordination/graphics/round2b/FULL_SYSTEM_VISUAL_LANGUAGE.md`
- `docs/coordination/graphics/round2b/scenario-b-sync-wall.svg`
- `docs/coordination/graphics/round2b/scenario-d-throughput-throttling.svg`

No staging/application code was changed.

### Visual-language result

[verified] Agent B/F's accepted two-layer model is sufficient for the requested debugger composition without changing frozen engine v1:

1. **Exact resource layer** — active, allocated-idle and released classical units; QPU active units; QPU resource queue.
2. **Causal explanation layer** — dependency gating, accepted preset synchronization/join meaning, active communication, and policy-held QPU tasks.

The runtime board is synchronized with:
- a fixed-geometry React Flow/ELK DAG lens whose topology does not move during playback;
- Agent-B semantic keyframe time/event provenance;
- linked analytical strips using one movable simulation-time cursor.

### Simple resource-card evaluation

**Replace as the primary full-system debugger; retain as a primitive.**

The old `Working / Idle / Blocked` card is not a valid top-level state decomposition under frozen v1. It conflates resource-unit accounting with task/dependency/policy waits and can double-count or invent rank affinity.

The structured-SVG primitive itself remains useful for exact resource bars/cards because its stable viewBox, named semantic IDs, real SVG text and fixed geometry satisfy the accepted graphics contract.

### Scenario B prototype

Selected `t = 4.0 s`:
- CPU reservation/capacity 4;
- CPU active 0;
- CPU allocated-idle 4;
- CPU released 0;
- QPU `quantum-b` running;
- QPU resource queue 0 after same-time causal handoff;
- active communication 0;
- collective continuation has one unresolved quantum predecessor;
- preset-authored causal label: **collective synchronization wait**.

The prototype deliberately does **not** show “4 blocked CPU units.”

### Scenario D prototype

Selected `t = 4.5 s`:
- CPU capacity 6, release-aware;
- CPU active 1 (`consumer-2`);
- CPU allocated-idle 0;
- CPU released 5;
- QPU `quantum-3` running;
- QPU resource queue 1 (`quantum-4`);
- policy-held QPU work 2 tasks (`quantum-5`, `quantum-6`);
- continuations 3–6 dependency-gated on their own paths;
- no global barrier.

The prototype labels policy-held and dependency-gated quantities explicitly as **tasks**, never CPU resource units/ranks.

### Analytical-output decision

- Resource composition and QPU run/queue strips can be sourced from frozen-v1 intervals/queue samples.
- A single cursor should drive runtime state, DAG highlighting and semantic playback.
- Click/zoom should select an interval for slow semantic playback rather than create another simulation timeline.
- **Cumulative cost time series is not authoritative in frozen v1.** The static prototypes therefore disable that strip instead of constructing a curve from final metrics. Agent F must choose a validated analysis adapter or later producer-owned series before enabling it.

### Validation

- Scenario B committed SVG: 12,860 bytes; local SHA-256 prefix `76607670b61e8c71`.
- Scenario D committed SVG: 7,743 bytes; local SHA-256 prefix `bdc74868c70f0a7a`.
- Both SVGs include `role="img"`, `<title>`, and `<desc>`.
- Both contain the runtime, DAG and analytical-strip planes.
- Both were rasterized with CairoSVG and visually inspected.
- Neither prototype uses legacy `Blocked` as a runtime state.
- Color is accompanied by labels/border/pattern semantics.
- No production dependency was added.

### Handoff

- **Production change proposed now:** none; this is a design checkpoint only.
- **Proposed for PORT/REIMPLEMENT:** two-layer visual ontology, full-system board composition, shared-time-cursor coupling, stable DAG highlighting rules, and exact-vs-causal provenance treatment.
- **Investigation/reference only:** the two static SVG prototypes.
- **Interface changes requested:** none.
- **Remaining decisions for Agent F:** ownership/API for selected-time causal-explanation derivation, and producer ownership for authoritative cumulative-cost time series.
- **Known rejected approach:** generic `Working + Blocked + Idle + Released = capacity` stacked view.
- **Recommended promotion status:** **PORT / REIMPLEMENT** the specification into the accepted React/TypeScript scaffold; do not merge static prototypes as runtime implementation.

**Stop here pending Agent F review.**
