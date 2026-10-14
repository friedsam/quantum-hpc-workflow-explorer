# Quantum–HPC Workflow Explorer — staging app

**Implementation:** React 19, TypeScript, Vite, React Flow, ELK. The current code under `app/` is staged on `agent/integration`; the old `main`/legacy `web/` deployment is not automatically replaced.

## Workflow

`WorkflowDesign + RunConfiguration + SystemProfile → compile (manifest) → expanded WorkflowSpec → validate → frozen DES → SimulationResult → actor/causal projection → Explore/Compare`.

The authoritative DES is `src/engine/runtime.mjs`. The compiler, actor projection and playback are **separate layers**. Logic and state semantics should not be reimplemented in graphics/UI code.

**Builder:** edit logical task multiplicity, dependencies (pairwise and all-to-all), modeled wall time per instance, CPU/GPU/QPU pools, resource units/instance, fixed reservation and max-in-flight policy. Compiled DES preview is Advanced and bounded above 500 tasks.

**Explore:** synchronized semantic playback, persistent authored actor Working/Blocked/Idle counts, QPU Running/ResourceQueued/PolicyHeld, causal transfer/wait explanations and source-event provenance. Advanced metrics/diagnostics are lazy; automatic graphs, task details and timelines are intentionally omitted for very large workflows such as D1000.

**Compare:** saved in-memory run/config/profile/result snapshots with provenance and authoritative metric deltas. Direct `WorkflowSpec` editing remains available as an Advanced compatibility path.

## Public scenario presets

- **A:** 1,000 persistent ranks; local one-rank QPU request; 999 ranks work independently; QPU branch completes in 8 synthetic seconds, background in 10.
- **B:** 1,000 ranks; 200 serialized quantum results; 3 logical/401 compiled tasks; complete-result global gate, not a resource-queue wall.
- **C:** 1,000 independently Blocked ranks, 1,000 individual QPU jobs, and 2,000 outbound/return transfer dependencies. A declared synthetic 0.7-second per-instance *delivery stagger* makes each result return before the next quantum job reaches the QPU. Ranks resume one by one. No global barrier or backend backlog; the stagger is an input assumption, not a network-contention simulation.
- **D:** 1,000 independent QPU requests; 3 logical/3,000 compiled tasks; single QPU lane with at most 50 admitted requests, including 1 executing + up to 49 resource-queued. The one-shot model finishes with 1,000 ranks Idle; a repeating all-Working phase must be authored, never fabricated.

The Fe4S4 SQD preset is a **structural/synthetic reference**, not a run against hardware.

## Local commands

Use Node 22:

```bash
cd app
npm ci --no-audit --no-fund
npm test
npm run build
npm run dev
```

**Reproducible install resolved:** `package-lock.json` is committed; integration CI runs clean `npm ci --no-audit --no-fund` and 143/143 Node tests + TypeScript/Vite build ([run 38337192791](https://github.com/friedsam/quantum-hpc-workflow-explorer/actions/runs/38337192791)). The same-source Chromium 141 lab smoke passed 19 checkpoints ([run 38334619801](https://github.com/friedsam/quantum-hpc-workflow-explorer/actions/runs/38334619801)); **the separate Vercel project now serves `app/` using Vite and Node 22; its new individual-request Scenario C is awaiting final human visual acceptance**.

## Validation and limitations

[Agent F's integration run 38332756103](https://github.com/friedsam/quantum-hpc-workflow-explorer/actions/runs/38332756103) passed **143/143 Node tests**, `tsc --noEmit`, and Vite build on the Round-4J D1000 checkpoint. Headless Chromium 141 functional smoke (19 checkpoints, Play/Pause/step, A–D, B Advanced, D guard, editing/Compare, validation) passed on Agent C's lab source, which has the exact same `app/src` tree (`6158a42b341583db4a60bbac4e7b898e32bbcef7`) and Vite entry files as staging. A separate Vercel project is live at [Quantum–HPC Workflow Explorer Next](https://quantum-hpc-workflow-explorer-next.vercel.app/) with `app/` as root, Vite and Node 22. The former smoke test was performed on the earlier C-cohort build; the corrected 1,000-job C still requires browser visual acceptance. Consult [release checklist](../docs/coordination/RELEASE_ACCEPTANCE.md) before promoting `main`.

Simulation timings and cost rates are explicit synthetic/user inputs, not automatically measured hardware properties. DES assumes fixed constant durations, deterministic strict FIFO, already-expanded DAGs, explicit capacity and non-contended dependency transfers. No live provider queue, network-resource contention, real-time hardware/QEC/FTQC, or production scheduler is modeled.

FTQC-aware resource estimation and cross-layer HPC–QPU modeling are a **near-term planned extension** described in [FTQC_EXTENSION_OUTLOOK.md](../docs/coordination/FTQC_EXTENSION_OUTLOOK.md). The first step is to integrate estimator outputs, not build a competing FTQC estimator. No FTQC tuning or execution is implemented yet.
