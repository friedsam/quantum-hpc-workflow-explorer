# Graphics / Diagram Toolchain Benchmark

Agent D · `agent/graphics` · 2026-10-02

## Benchmark

All candidates were evaluated against the same legacy Explorer graphic: HPC (`Working / Idle / Blocked`) ↔ QPU (`Queue / Run`) with transfer paths. Required edits: reproduce baseline, move QPU, add GPU lane, change serial flow to fork/join. Graphics remain presentation-only; no candidate may derive simulation state or metrics.

| Candidate | Revision robustness | Determinism | Runtime fit | Accessibility/text | Cost | Decision |
|---|---|---|---|---|---|---|
| Structured inline SVG + logical grid/anchors | High for fixed state/resource grammar | High; pure input→SVG | Excellent for state/resource view | Real SVG text + ARIA/title/desc | No runtime dependency | **Use for runtime state graphics** |
| React Flow + ELK layered | High for DAG topology changes | High with fixed inputs/options/order/seed | Excellent for interactive DAG | React Flow has keyboard + screen-reader support | `@xyflow/react` + `elkjs` if accepted | **Use for workflow DAG** |
| Figma native editable | Good for manual static polishing; weak for programmatic topology edits | Manual geometry stable | Poor runtime renderer | Editable source text | External authoring only | **Static figures only** |
| D2 | Good text-authored documentation | Layout-engine dependent | Browser/WASM possible but redundant here | Strong SVG export | Separate language/runtime | **Do not add to product stack** |

## Structured SVG result

Artifacts:
- `structured-svg-benchmark.mjs`
- `test-structured-svg.mjs`

[verified] All four required variants render without third-party JS dependencies. The test renders each variant twice and requires byte-identical output. It also checks SVG accessibility metadata and required GPU/fork/join semantic IDs.

[verified] Moving QPU changes the resource-card position; edge endpoints are recomputed from card anchors. GPU insertion reuses the same card primitive. Fork/join reuses existing cards and adds named fork/join anchors plus orthogonal route waypoints.

### Grid/anchor standard

- stable SVG `viewBox` coordinates;
- reusable resource-card primitive with stable semantic ID;
- card geometry derived from header/row metrics, not raster frames;
- named ports (`leftTop/rightTop`, `leftMid/rightMid`, `leftBottom/rightBottom`);
- edges reference port objects, never copied endpoint pixels;
- explicit orthogonal waypoints only when topology requires them;
- state updates change text/fill/badges/edge activity, not geometry;
- real SVG text; color is not the only state encoding;
- inline SVG carries `role="img"`, `<title>`, `<desc>`; state-heavy views should also expose a DOM/table equivalent.

[opinion] Do not extend this into a general graph-layout engine. Stable geometry is the reason to use it for bounded resource/state views.

## ELK + graph renderer result

Hands-on auto-layout board: https://www.figma.com/board/lon6gMDOKMUd05ltvjUQ0F

[verified] GPU insertion and fork/join were re-laid out without manual edge endpoint reconstruction.

[verified] The cyclic legacy HPC↔QPU baseline did not preserve the desired left-to-right HPC→QPU convention; automatic cycle breaking placed QPU left of HPC. This makes auto-layout unsuitable for the fixed resource-state panel, while it remains appropriate for the actual workflow DAG.

[verified] React Flow's official layout guide treats layout as an external concern and documents ELK as the most capable common option for dynamic node sizes, subflows, and edge routing. Its ELK multiple-handle example maps stable handles to ELK ports and uses fixed port ordering. React Flow also provides keyboard/screen-reader/ARIA support.

[verified] ELK exposes `org.eclipse.elk.randomSeed`; seed `0` may be pseudo-random, while ELK Layered documents default seed `1`. Set a non-zero seed explicitly.

Proposed workflow-DAG settings if Agent C/Agent F adopt React:
- React Flow owns interaction/rendering;
- `elkjs` / `org.eclipse.elk.layered` owns positions/routing;
- left-to-right + orthogonal routing;
- explicit non-zero random seed;
- stable task/dependency IDs map directly to node/edge IDs;
- stable handle IDs map to ELK ports; use port side + `FIXED_ORDER` for multi-handle nodes;
- run layout on topology/size changes, **not** on playback/state updates.

Sources:
- https://reactflow.dev/learn/layouting/layouting
- https://reactflow.dev/examples/layout/elkjs-multiple-handles
- https://reactflow.dev/learn/advanced-use/accessibility
- https://eclipse.dev/elk/reference/options/org-eclipse-elk-randomSeed.html
- https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html

## Figma result

Native editable comparison: https://www.figma.com/design/5vY49bhz5vhDgMUgjrjVuR

[verified] Baseline, QPU move, and GPU insertion are straightforward and visually clean with native editable shapes/text.

[verified] The first scripted fork/join revision exposed the relevant failure mode: coordinate-based connection geometry required reconstruction and produced clipping/misalignment. It remained editable but was not robust enough for runtime generation.

[opinion] Keep Figma for tutorial/poster/presentation figures after the runtime visual grammar stabilizes; never use Figma exports as runtime state truth.

## D2 result

[verified] Current D2 supports browser/Node execution via D2.js/WASM and exports SVG/PNG/PDF/PPTX/GIF/ASCII. Its current FAQ states that user-specified ports are not supported.

[opinion] D2 is useful for documentation, but port control is material here and a second diagram language/runtime duplicates the preferred stack. Do not add D2 to the 10-day product.

Sources:
- https://d2lang.com/tour/faq/
- https://d2lang.com/tour/exports/
- https://d2lang.com/releases/0.9.0/

## Recommendation

[opinion] Production split:
1. **Workflow topology:** React Flow + ELK.
2. **Runtime resource/state panel:** structured inline SVG/grid/anchors.
3. **Static polished figures:** Figma only.
4. **D2:** reject from production stack.

No shared interface change is required. Graphics consume `WorkflowSpec`, `SimulationResult`, and later Agent B's concrete `VisualKeyframe.snapshot`; they do not invent queue depth, task/resource state, metrics, communication time, or ordering.

## Validation / handoff

Structured-SVG test output:

```text
baseline: 3188 bytes sha256=6268c3799c5b1e61
move-qpu: 3211 bytes sha256=cf8f5a613d44bed9
add-gpu: 3521 bytes sha256=0e32896185acf41d
fork-join: 4185 bytes sha256=6b34062f07095ff2
```

SVGs were also rasterized with CairoSVG and visually inspected after correcting the baseline return route. No clipping/overlap remained in the four structured-SVG variants.

- Dependencies added: none.
- Interface changes requested: none.
- Production files proposed now: none; wait for Agent F toolchain review and Agent C scaffold decision.
- Evidence proposed for porting: this benchmark + grid/anchor grammar + renderer/test as reference.
- Investigation-only: Figma/FigJam benchmark files.
- Discarded: raster-frame redraws, Figma as runtime layout, D2 as additional production stack, ELK for the fixed cyclic state panel.
- Recommended promotion status: **PORT** the visual grammar/tool split; reimplement production components in the accepted scaffold instead of merging benchmark code wholesale.
