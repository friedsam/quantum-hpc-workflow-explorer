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
