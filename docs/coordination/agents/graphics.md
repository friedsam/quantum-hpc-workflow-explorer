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

Ready to start benchmark.

## Handoff fields

Record:
- candidates tested;
- benchmark artifacts;
- modification cost/failures;
- recommended production split (workflow DAG vs runtime state vs static polished figures);
- exact commit/paths;
- promotion recommendation.
