# Quantum–HPC Workflow Explorer

**Status:** New React/TypeScript prototype is feature-complete on [`agent/integration`](https://github.com/friedsam/quantum-hpc-workflow-explorer/tree/agent/integration); code-equivalent Chromium smoke and clean-install CI pass; deployed-preview verification and promotion to `main` remain pending. `main` still retains the historical implementation.

A pre-execution design and visual-debugging environment for hybrid HPC–quantum workflows:

`Build an editable logical DAG → compile to resource-bound tasks → simulate with a deterministic discrete-event engine → inspect causal execution/playback → compare alternatives`.

Public demonstration presets connect to the [QAMP Hello HPC tutorial](https://hpc-quantum.github.io/Documentation-website/workflowscenarios/):

| Preset | Defining bottleneck | Demo abstraction |
|---|---|---|
| A — local overlap | QPU off overall critical path | 1,000 persistent HPC actors; 4 logical tasks |
| B — synchronization wall | full-result collective dependency | 1,000 actors; 200 QPU evaluations; 3 logical nodes |
| C — transfer wall | communication-dominated local waiting | 1,000 actors in **five aggregate** 200-rank cohorts, five QPU evaluations |
| D — bounded asynchronous throughput | QPU service capacity and admission throttling | 1,000 corresponding requests, maximum 50 in flight, no global barrier |

The A–D values and service/transfer durations are **synthetic**, for causal understanding rather than measured performance prediction. In particular, C does **not** simulate 1,000 independent QPU requests; D does, and deliberately ends its one-shot drain with actors Idle rather than fabricate another working cycle.

## Run the new staging app

Use Node 22:

```bash
git checkout agent/integration
cd app
npm ci --no-audit --no-fund
npm test
npm run build
npm run dev
```

`app/package-lock.json` is committed and the integration validation workflow runs a clean `npm ci` (143/143 tests + TypeScript/Vite build; [CI run 38337192791](https://github.com/friedsam/quantum-hpc-workflow-explorer/actions/runs/38337192791)). Headless Chromium 141 A–D functional smoke passed on **byte-identical application source** in Agent C's laboratory run [38334619801](https://github.com/friedsam/quantum-hpc-workflow-explorer/actions/runs/38334619801); direct deployed-preview acceptance remains pending. Details: [App documentation](app/README.md).

## Architecture and limits

The frozen deterministic DES (`app/src/engine/runtime.mjs`) is the sole source of task scheduling, queue and resource metrics; actor projections, visuals and playback do not alter DES causality. Multiple resource pools and configurable QPU capacity are supported, though public A–D presets generally use one QPU lane. No live hardware jobs, real-provider queue model, stochastic/network-contention simulation, scheduling optimization, or vendor-accurate cost predictions are implied.

An **FTQC extension is future work**, potentially coupling application orchestration with logical-qubit/QEC decoder/magic-state resource estimates and comparing remote/cloud versus co-located HPC–QPU architectures. None of those FTQC features is implemented. See [FTQC outlook](docs/coordination/FTQC_EXTENSION_OUTLOOK.md).

[Release acceptance checklist](docs/coordination/RELEASE_ACCEPTANCE.md) · [Repository operating contract](AGENTS.md)
