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
- **C:** 1,000 ranks modeled as five 200-rank cohorts and five *aggregate quantum calls*; outbound/return transfer dominates; no global gate or queue saturation.
- **D:** 1,000 independent QPU requests; 3 logical/3,000 compiled tasks; single QPU lane with at most 50 admitted requests, including 1 executing + up to 49 resource-queued. The one-shot model finishes with 1,000 ranks Idle; a repeating all-Working phase must be authored, never fabricated.

The Fe4S4 SQD preset is a **structural/synthetic reference**, not a run against hardware.

## Local commands

Use Node 22:

```bash
cd app
npm install --no-audit --no-fund
npm test
npm run build
npm run dev
```

**Release TODO:** `package-lock.json` is not yet committed. Until it is reviewed/committed, `npm ci` will not work. The production integration workflow uses `npm install` and must be switched after clean-install validation.

## Validation and limitations

[Agent F's integration run 38332756103](https://github.com/friedsam/quantum-hpc-workflow-explorer/actions/runs/38332756103) passed **143/143 Node tests**, `tsc --noEmit`, and Vite build on the Round-4J D1000 checkpoint. **Actual browser interactions and deployment are not yet accepted.** Consult [release checklist](../docs/coordination/RELEASE_ACCEPTANCE.md) before promoting `main`.

Simulation timings and cost rates are explicit synthetic/user inputs, not automatically measured hardware properties. DES assumes fixed constant durations, deterministic strict FIFO, already-expanded DAGs, explicit capacity and non-contended dependency transfers. No live provider queue, network-resource contention, real-time hardware/QEC/FTQC, or production scheduler is modeled.

Potential future FTQC support is described in [FTQC_EXTENSION_OUTLOOK.md](../docs/coordination/FTQC_EXTENSION_OUTLOOK.md); no FTQC execution tuning is implemented.
