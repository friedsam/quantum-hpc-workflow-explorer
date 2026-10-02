# Product UI architecture — Agent C checkpoint

Date: 2026-10-02
Branch: agent/ui

## Scope

[verified] The current main product surface is a static web application with separate bespoke scenario pages, a placeholder Builder, and a Runner that owns an independent additive accounting model.

[verified] Shared contract v0 requires the UI to consume WorkflowSpec and SimulationResult, while the engine remains the sole source of execution semantics and metrics.

[opinion] The product should move to one application shell with three primary workspaces: Builder, Explore, and Compare.

## User flow

1. Builder
   - load a supported preset;
   - inspect the workflow graph structure;
   - select a task;
   - edit supported task or policy fields;
   - receive explicit structural validation;
   - submit the resulting WorkflowSpec to an engine adapter.

2. Explore
   - display the exact SimulationResult returned for the current WorkflowSpec;
   - show workflow context, metrics, task/resource timeline, queue evidence and assumptions;
   - never infer missing queue/resource/task state.

3. Compare
   - choose two explicit configuration/result pairs;
   - show each engine metric side by side;
   - show B minus A as a presentation-only derived difference;
   - do not label a universal winner because policy suitability depends on workload assumptions.

## Information architecture

Global shell:
- product identity;
- current preset/draft status;
- Builder / Explore / Compare navigation;
- explicit source-of-truth status.

Builder:
- workflow structure preview;
- task inspector;
- policy editor;
- validation panel;
- simulation request boundary.

Explore:
- authoritative metrics;
- task timeline;
- resource intervals;
- queue samples;
- assumptions.

Compare:
- A selector;
- B selector;
- side-by-side metrics;
- explicit configuration summaries;
- assumptions for both results.

Legacy scenario animations are not required for core navigation. They may later survive as presets, regression fixtures or educational links if they map cleanly onto accepted engine semantics.

## Component boundaries

App
- owns selected view, draft WorkflowSpec and currently attached SimulationResult;
- invalidates the result when the draft changes.

AppShell
- navigation and current state labels only.

WorkflowMap
- reads tasks and dependencies;
- presents structure;
- does not schedule or infer state.

TaskInspector
- edits supported TaskSpec fields;
- emits an explicit new WorkflowSpec.

PolicyEditor
- edits PolicySpec fields;
- does not predict effects.

ValidationPanel
- performs structural input validation only: identifiers, endpoint references, positive capacities/counts and DAG cycle rejection;
- never normalizes invalid semantic input silently.

MetricsGrid
- reads SimulationResult.metrics directly.

Timeline
- positions intervals using result timestamps and makespan for rendering only;
- does not reconstruct missing events or metrics.

CompareView
- reads two fixture/result pairs;
- may calculate display deltas from two already-authoritative metrics.

## Mock contract strategy

[verified] Interface contract v0 leaves TimeModel exact fields provisional.

[opinion] The UI fixture uses a minimal local constant-time representation solely to exercise forms. It is not proposed as shared interface v1.

The two fixture pairs are:
- fixed-allocation baseline;
- release-aware + batched alternative.

Both are synthetic and are labeled non-measured. Editing either fixture detaches its SimulationResult. No new result is calculated in the UI.

## Scaffold recommendation

[opinion] React + TypeScript + Vite is appropriate for the product shell because:
- the UI has shared state across editing, exploration and comparison;
- contract types can be explicit at the engine boundary;
- Vite provides a minimal modern development/build layer;
- the initial scaffold needs no routing or state-management dependency.

As of 2026-10-02, current public package/documentation checks show React 19.3, Vite 8.3.x, the official React plugin 6.1.x, and TypeScript 7.0.x. Vite 8 requires Node.js 20.19+ or 22.12+.

Sources:
- https://vite.dev/guide/
- https://vite.dev/
- https://www.npmjs.com/package/react
- https://www.npmjs.com/package/@vitejs/plugin-react
- https://www.npmjs.com/package/typescript

## Graphics dependency

No graph library is added. The scaffold uses basic structured HTML/CSS only so Agent D can still determine the production DAG/state-graphics stack without migration pressure.

## Accessibility

- semantic buttons, labels and form controls;
- keyboard-visible focus;
- color is supplemented by text/state labels;
- validation uses an aria-live region;
- no drag-only interaction is required in the first product version;
- timeline rows retain text labels even when compact.

## Responsive behavior

Desktop: workflow + inspector split pane.

Medium: graph above inspector.

Small: single-column shell; primary nav remains directly reachable; metrics and comparison tables stack without horizontal dependence.

## Migration path

1. Keep legacy web/ untouched during first-track experiments.
2. Validate the app/ shell against v0 fixture pairs.
3. Replace local provisional types with Agent-F-approved v1 shared types.
4. Add an engine adapter returning SimulationResult.
5. Incorporate Agent B playback artifacts and Agent D graphics recommendation behind existing component boundaries.
6. Only after integration review decide whether app/ becomes the production root or is ported into another scaffold.

## Known risks

- The engine v1 type contract may require field-name adaptation.
- Final graph editing interaction depends on Agent D.
- The fixture results are not engine-validation evidence and must not be used as performance claims.
- Package installation/build cannot be proven from repository source alone; canonical CI/build commands should be frozen by Agent F after scaffold selection.

## Promotion recommendation

PORT.

The information architecture, data-boundary behavior and component split should be preserved. Agent F should decide whether the exact app/ scaffold becomes the production root after reviewing Agents A, B and D.
