# Quantum–HPC Workflow Explorer — Agent C UI

Status: Round-3 integrated model + causal debugger checkpoint on `agent/ui`.

This `app/` directory is a self-contained React + TypeScript + Vite implementation of the product flow:

`WorkflowDesign + RunConfiguration + SystemProfile → compile → frozen WorkflowSpec → validate → simulate → inspect/animate SimulationResult → compare runs`

Direct `WorkflowSpec` editing remains a supported compatibility/custom-authoring path.

## Architecture boundary

- `src/domain/types.ts` — frozen v1 DES input/output contract.
- `src/design/` — versioned design/config/profile types, pure compiler, CompilationManifest provenance, and direct-edit detachment.
- `src/causal/systemState.mjs` — derived causal-debugger adapter; it does not alter DES/resource semantics.
- `src/domain/validation.ts` — UI wrapper around the authoritative engine validator.
- `src/engine/runtime.mjs` — canonical accepted frozen-v1 DES runtime; unchanged in Round 3.
- `src/services/engineAdapter.ts` — the only UI → engine execution seam.
- `src/playback/trace-playback.mjs` — canonical accepted frozen-v1-compatible playback module; unchanged in Round 3.
- UI components render engine/playback output; they do not calculate authoritative scheduling metrics.

## Product surfaces

### Builder

- editable React Flow DAG;
- deterministic ELK layered layout;
- explicit left target / right source ports;
- add/delete/edit tasks;
- add/delete/edit dependencies, including communication parameters;
- add/delete/edit CPU/GPU/QPU resource pools;
- fixed/release-aware allocation;
- fixed classical reservations;
- per-QPU-pool max-in-flight policy;
- workflow name and assumptions;
- frozen-v1 engine validation before simulation.

Invalid intermediate drafts remain visible and cannot be simulated until valid.

### Explore

- authoritative v1 metrics;
- task intervals: ready / queued / running;
- resource intervals: active / allocated-idle / released;
- explicit resource-queue series;
- full-system debugger with exact capacity plane + separate causal explanation plane;
- fixed-geometry DAG runtime lens;
- linked resource/QPU queue/policy analytical strips;
- semantic keyframe playback with source-event provenance;
- no raw-event autoplay;
- manual time scrubbing;
- reduced-motion preference disables animation by default.

### Compare

Every successful simulation is stored in an in-memory run history. Design-backed runs retain `WorkflowDesign + RunConfiguration + SystemProfile + compiled WorkflowSpec + CompilationManifest + SimulationResult`; direct/custom runs retain the compatibility `WorkflowSpec + SimulationResult` envelope.

Compare operates on those saved runs, not estimates or synthetic recomputation. B − A deltas are presentation-only.

## Presets

Loadable authoring presets:

- Custom starter
- Scenario A — accepted local overlap / QPU off critical path
- Scenario B — accepted fixed-reservation synchronization wall
- Scenario C — accepted communication/data-movement wall
- Scenario D — accepted throughput-limited asynchronous pipeline with separate resource queue and policy hold
- IBM/QAMP Fe4S4 SQD structural reference using synthetic scaled acceptance timings

All synthetic assumptions are labeled in the preset/result provenance.

## Run locally

Vite 8 requires Node 20.19+ or 22.12+. Node 22 is used in branch CI.

```bash
cd app
npm install --no-audit --no-fund
npm test
npm run build
npm run dev
```

## Validation

Branch CI workflow: `.github/workflows/agent-ui-validation.yml`.

Latest verified green run at the time of this checkpoint:

- 17/17 frozen-v1 engine tests pass;
- 7/7 design/compiler/schema/manifest tests pass;
- 5/5 QAMP A-D behavioral tests pass;
- 4/4 causal-state derivation tests pass;
- 13/13 playback tests pass;
- 10/10 architecture tests pass;
- `tsc --noEmit` passes;
- Vite 8.3.2 production build passes.

The build currently reports a non-fatal large-chunk warning:

- JS: about 1.934 MB minified / 596 kB gzip.

Bundle/code-splitting optimization is intentionally deferred until Agent F confirms the final integration/deployment shape.

## Dependencies

Production:
- React / React DOM
- `@xyflow/react`
- `elkjs`

Development:
- TypeScript
- Vite
- official Vite React plugin

No routing or application-state framework is required for the current scope.

## Known integration boundary

The frozen engine consumes an already-expanded DAG. A user-facing bounded-repeat/template authoring schema is not defined in the frozen v1 contract. Agent C therefore does not invent one in this checkpoint; existing presets and custom workflows are represented as explicit DAGs.

## Round 3 debugger invariants

- Exact resource capacity is only `active + allocated-idle + released`; causal waits are not added to this partition.
- Resource-queued tasks and policy-held QPU tasks are separate states.
- Strong labels such as collective synchronization require accepted semantic metadata; a multi-input DAG pattern alone is only a structural join.
- Actor-group metadata is retained as a future hook and is not treated as exact persistent rank ownership.
- One simulation-time cursor synchronizes debugger state, DAG highlighting, analytical strips, and semantic playback without relayout.
- The cumulative-cost strip is intentionally disabled until an authoritative producer-owned cost time series exists.

Latest green Round-3 code run before the handoff documentation: `37092997663` at head `299923914aaf564712ce674551ff17e2bdefec6f`.
