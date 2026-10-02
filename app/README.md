# Quantum–HPC Workflow Explorer — Agent C UI

Status: frozen-v1 integration checkpoint on `agent/ui`.

This `app/` directory is a self-contained React + TypeScript + Vite implementation of the product flow:

`create/edit WorkflowSpec → validate → simulate → inspect/animate SimulationResult → compare runs`

## Architecture boundary

- `src/domain/types.ts` — frozen v1 shared domain contract.
- `src/domain/validation.ts` — UI wrapper around the authoritative engine validator.
- `src/engine/runtime.mjs` — exact Agent-A frozen-v1 engine runtime copied into this lab branch for self-contained validation.
- `src/services/engineAdapter.ts` — the only UI → engine execution seam.
- `src/playback/trace-playback.mjs` — exact Agent-B frozen-v1-compatible playback module copied into this lab branch.
- UI components render engine/playback output; they do not calculate authoritative scheduling metrics.

During integration, Agent F should keep only one canonical engine runtime and one canonical playback module and rewire the adapter/imports if those are ported independently from Agents A/B.

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
- structured inline-SVG resource snapshot;
- semantic keyframe playback with source-event provenance;
- no raw-event autoplay;
- manual time scrubbing;
- reduced-motion preference disables animation by default.

### Compare

Every successful simulation is stored in an in-memory run history as an explicit:

`WorkflowSpec + SimulationResult`

Compare operates on those saved runs, not estimates or synthetic recomputation. B − A deltas are presentation-only.

## Presets

Loadable authoring presets:

- Custom starter
- Scenario A — classical / quantum / classical handoff
- Scenario B — fork/join synchronization
- Scenario C — synthetic latency stress
- Scenario D — bounded QPU admission
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

- 17/17 ported frozen-v1 engine tests pass;
- 13/13 ported playback Node test cases pass;
- 7/7 Agent-C architecture tests pass;
- `tsc --noEmit` passes;
- Vite 8.3.2 production build passes.

The build currently reports a non-fatal large-chunk warning:

- JS: about 1.90 MB minified / 586 kB gzip.

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
