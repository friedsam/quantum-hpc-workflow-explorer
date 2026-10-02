# Agent C — Product UI / UX

Branch: `agent/ui`

## Mission

Design a serious, coherent application surface around the shared workflow/simulation contracts.

## Initial assignment

Define:
- application information architecture;
- Builder → Run/Explore → Compare flow;
- graph editor/inspector surfaces;
- parameter editing/validation;
- timeline/metrics/comparison presentation;
- responsive layout;
- migration/scaffold recommendation for React + TypeScript + Vite (or a justified alternative).

Use mock `WorkflowSpec` and `SimulationResult` data initially.

## Boundaries

Do not:
- independently calculate metrics;
- create a second workflow model;
- make legacy animations the mandatory navigation model;
- lock final graphics tooling before Agent D's benchmark is reviewed.

## Current status

**Checkpoint ready for Agent F review.**

Implemented on `agent/ui`:
- `c063bcd32f7d22b80ea5bf4e2183b265153641a0` — React/TypeScript product scaffold + UI architecture document.
- `ab0ab4a1700fc2cdeaffcb95962bb47948c7a7fa` — coordinator-note follow-up exposing resource interval states directly.

No legacy `web/` files were modified.

## Verified result

- Builder, Explore and Compare are one application shell.
- Builder edits an explicit `WorkflowSpec`; task/policy edits immediately detach the old `SimulationResult`.
- The scaffold refuses to synthesize a replacement result when the engine adapter is absent.
- Displayed metrics are read directly from fixture `SimulationResult.metrics`.
- Compare shows explicit A/B result values plus presentation-only B−A deltas; it does not rank policies.
- Structural validation catches invalid identifiers/endpoints, resource over-capacity, invalid counts/times and dependency cycles without silently normalizing values.
- Explore separately renders task intervals, resource intervals, queue samples and assumptions from the returned result.
- Resource interval states `active`, `allocated-idle` and `released` are visually distinct.
- Policy-held wait is not inferred from v0 data.
- No autoplay exists.
- CSS includes `prefers-reduced-motion` behavior.
- Core use does not depend on legacy A–D animations.

## User flow

1. Load a preset fixture pair.
2. Inspect/edit the workflow in Builder.
3. Validate the explicit draft.
4. Request simulation through the future engine-adapter seam.
5. Explore the returned result.
6. Compare two explicit configuration/result pairs.

## Component boundaries

Documented in `docs/ui/PRODUCT_UI_ARCHITECTURE.md`.

Current scaffold components:
- App/AppShell — view + draft/result attachment state.
- WorkflowMap — structure only.
- TaskInspector / PolicyEditor — supported WorkflowSpec edits only.
- ValidationPanel — structural input validation only.
- MetricsGrid — direct SimulationResult metric rendering.
- Timeline — returned TaskInterval timestamps only.
- ResourceTimeline — returned ResourceInterval states only.
- QueueEvidence — returned queue samples only.
- CompareView — direct A/B values + display delta.

## Mock/prototype paths

- `app/` — isolated reversible React/TypeScript/Vite scaffold.
- `app/src/model.ts` — v0-shaped local types, structural validator, two synthetic fixture pairs.
- `app/src/App.tsx` — Builder / Explore / Compare product flow.
- `app/src/styles.css` — responsive/accessibility-oriented shell.
- `docs/ui/PRODUCT_UI_ARCHITECTURE.md` — architecture and migration rationale.

## Dependencies proposed

Production:
- React 19.3
- React DOM 19.3

Development:
- TypeScript 7.0
- Vite 8.3
- official Vite React plugin 6.1

No routing/state-management/graph-layout dependency is proposed at this checkpoint. Agent D still owns graphics-toolchain selection.

## Accessibility / responsive considerations

- semantic buttons, labels, inputs and selects;
- keyboard focus styling;
- state text accompanies color;
- aria-live validation/status messaging;
- no drag-only interaction;
- reduced-motion CSS;
- desktop split layout collapses to stacked medium/small layouts;
- comparison surface remains readable via explicit table overflow rather than content truncation.

## Validation

Local checks available in the current environment:
- TypeScript syntax/static check of `model.ts` and `App.tsx` using installed `tsc` plus a minimal local React declaration shim: pass.
- deterministic model checks:
  - fixture count and baseline result access: pass;
  - baseline structural validation: pass;
  - over-capacity request rejection: pass;
  - dependency-cycle rejection: pass.
- branch diff audit: only new `app/` and `docs/ui/PRODUCT_UI_ARCHITECTURE.md` files before this status update; no legacy product changes.

Not verified:
- `npm install` / real React typecheck / Vite build, because the execution container cannot resolve external package hosts. This must run in CI or a normal networked checkout before promotion.

## Coordinator heartbeat consumed

Agent F's latest UI notes were consumed:
- no autoplay;
- future playback provenance via semantic keyframes/source event ranges;
- reduced-motion/animation-disable behavior;
- separate policy wait, resource queue, active allocation, allocated-idle and released states if v1 adopts them.

Current scaffold satisfies all except policy-held wait/playback provenance, which cannot be represented honestly until v1 / Agent B integration exposes them.

## Interface changes requested

No new shared-contract change requested.

Pending v1 integration requirement: if policy-held ready/wait is adopted as a first-class state, it must be exposed explicitly rather than inferred by the UI.

## Known failures / discarded approaches

- Legacy `web/assets/site.js::compute()` was explicitly rejected as a source for the new UI because it independently calculates workflow metrics.
- `prototype-vqe-runner` interaction sharing was inspected, but its layer-list simulator was not ported.
- No final DAG renderer was selected before Agent D completes the benchmark.

## Unresolved risks

- Agent A v1 may rename/change provisional v0 fields.
- Agent B playback integration needs a compatibility pass after v1 freezes.
- Agent D may change the graph/state rendering implementation.
- Synthetic fixtures are UI integration evidence only, not performance/model validation evidence.

## Promotion recommendation

**PORT.**

Preserve the information architecture, strict engine/UI boundary, stale-result invalidation behavior, accessibility/responsive shell and component split. Agent F should decide whether the exact `app/` scaffold is promoted or reimplemented after A/B/D review.


## Coordinator review — 2026-10-02

**Agent F decision:** **PORT — React/TypeScript/Vite shell accepted as the production UI direction; temporary v0 model/rendering must not be promoted unchanged.**

### Accepted

- One coherent Builder → Explore → Compare application shell.
- Explicit stale-result invalidation: editing a WorkflowSpec detaches the previous SimulationResult rather than recomputing metrics in UI code.
- UI reads authoritative metrics/intervals/queue samples/assumptions from SimulationResult.
- Compare mode shows explicit A/B values and presentation-only B-A deltas without ranking a universal winner.
- Structural validation is explicit and does not silently normalize invalid input.
- No autoplay.
- Reduced-motion support and non-color-only state labeling.
- Responsive Builder/Explore/Compare information architecture.
- React + TypeScript + Vite is accepted for the production scaffold.

Current package/version check by Agent F:
- React 19.3 is current stable.
- TypeScript 7.0.2 is current stable.
- Vite current latest is 8.3.2; the scaffold's ^8.3.1 range is compatible with the current 8.3.x line.
- Vite 8 requires Node 20.19+ or 22.12+; freeze that runtime requirement in the production README/CI.

### Do not promote unchanged

1. **app/src/model.ts**
   - It intentionally duplicates provisional v0 types and is now stale relative to Agent A's accepted direction.
   - Production UI must import/use the Agent-F-frozen v1 contract rather than maintain a second WorkflowSpec/SimulationResult definition.
   - UI convenience/form validation may remain, but canonical semantic validation before simulation must use the shared engine/contract validator.

2. **Current WorkflowMap implementation**
   - It is a temporary structure preview, not a DAG renderer.
   - Replace it during integration with the accepted Agent-D stack: React Flow + ELK layered layout.
   - Stable task/dependency IDs map to node/edge IDs; layout runs only on topology/size changes, not playback state changes.

3. **Current v0 state vocabulary**
   - Update after A v1 freeze: resourcePoolId binding, queued/admission-wait semantics, fixed reservations, per-pool in-flight policy, half-open intervals, and renamed aggregate communication metric.
   - Do not infer policy wait; render only explicit engine data.

### Integration refactor required

The 684-line App.tsx is acceptable as a checkpoint prototype but should not become the long-term integration file. When ported, split at least along the existing component boundaries (Builder, Explore, Compare, graph, inspectors, timelines/metrics) so B/D/A integration does not recreate a monolith.

### Build/validation requirement

The source review is positive, but the real dependency install/typecheck/Vite build has not yet been run. Before promotion to main, Agent F/integration must run:

```bash
npm install
npm run typecheck
npm run build
```

plus final application tests once the engine adapter is connected.

### Promotion scope

PORT:
- app shell / view state model;
- Builder → Explore → Compare flow;
- stale-result invalidation;
- accessibility/responsive CSS principles;
- metrics/timeline/compare component boundaries;
- React/TS/Vite scaffold configuration.

REIMPLEMENT/REPLACE during integration:
- v0 local contract types/fixtures;
- WorkflowMap;
- engine adapter seam;
- monolithic file layout as needed.

No further Agent-C work is required until Agent A v1 is frozen. At that point Agent F may request one bounded integration pass for v1 types + React Flow/ELK.
