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
