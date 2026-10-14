# Quantum–HPC Workflow Explorer

**QAMP 2025 Hello HPC · Continued prototype development (October 2026)**

[**Try the interactive prototype**](https://quantum-hpc-workflow-explorer-next.vercel.app/) · [QAMP Hello HPC tutorials](https://hpc-quantum.github.io/Documentation-website/) · [Development roadmap](docs/ROADMAP.md) · [Near-term FTQC extension](docs/coordination/FTQC_EXTENSION_OUTLOOK.md)

The Workflow Explorer is a **pre-execution design-space simulator and visual debugger** for hybrid HPC–quantum workflows. It helps users investigate *why* a workflow spends time in useful classical work, waiting on quantum results, moving data, or awaiting QPU admission. It is **not** an HPC/quantum scheduler or a prediction of vendor performance.

## What's new since the original QAMP project?

The original Hello HPC tutorial used static workflow scenarios to explain orchestration bottlenecks. The continuation replaces hand-authored frame sequences with a shared, deterministic simulation model:

1. **Build:** Edit a logical workflow DAG, task multiplicities, resource capacities, assumed task/communication times and QPU admission limits.
2. **Simulate:** Compile the design into a concrete DAG and run the frozen discrete-event simulator (DES). The engine—not UI counters—produces event traces and authoritative resource/queue metrics.
3. **Explore:** Step or play through one synchronized timeline, showing authored HPC actors as **Working / Blocked / Idle** alongside QPU **running / resource-queued / policy-held** work. Inspect causal evidence and source-event provenance.
4. **Compare:** Modify an assumption, rerun and compare the stored alternatives and their modeled outcomes.

| Public demonstration | Mechanism | Scope of the *synthetic* example |
|---|---|---|
| A · Local overlap | Local quantum wait, with the QPU branch off the critical path | 1,000 HPC actors, 4 logical tasks |
| B · Synchronization wall | All-rank result dependency, not a resource-queue wall | 1,000 actors, 200 QPU evaluations |
| C · Transfer wall | 1,000 outbound/return transfers and per-rank results; idle QPU between arrivals | 1,000 individual QPU requests with a **synthetic staggered delivery schedule** |
| D · Throughput throttling | One QPU execution lane; 50 admitted, excess demand policy-held | 1,000 independent QPU requests, 3 logical / 3,000 expanded tasks |

**Important:** Actor count, QPU jobs, resource units and dependency transfers are separate quantities. **C and D now both model 1,000 individual QPU requests.** C deliberately spaces outbound transfer *completions* using declared synthetic per-instance delays; each quantum result returns before the next quantum request arrives, and actors resume one by one. This does not simulate a contended physical network link. D instead illustrates QPU throughput/admission bottlenecks. D's one-shot drain finishes Idle; an additional work cycle is not fabricated.

## Technical status and evidence

- [Verified] The React/TypeScript/Vite prototype with React Flow/ELK is deployed in a **separate** Vercel project; the original website and historical `main` branch remain untouched.
- [Verified] The accepted integration branch passed **143/143 Node tests**, clean Node 22 `npm ci`, TypeScript checks and a production build. [CI evidence](https://github.com/friedsam/quantum-hpc-workflow-explorer/actions/runs/38337192791).
- [Verified] A Chromium browser smoke test of the same application source passed 19 functional checkpoints across scenarios A–D, playback, editing/Compare and input validation. [Browser evidence](https://github.com/friedsam/quantum-hpc-workflow-explorer/actions/runs/38334619801).
- [In progress] Visual layout refinement, final browser acceptance of the separately deployed site and shareable documentation. The 143 automated tests are **not** a scientific validation against real HPC/QPU measurements.

## Run locally

Node 22 is the validated runtime:

```bash
git checkout agent/integration
cd app
npm ci
npm test
npm run dev
```

The source remains under `app/` on `agent/integration`. The historical `main` branch is not yet the new application; do not treat it as the release source.

## What's next?

See the [milestone-based roadmap](docs/ROADMAP.md) for reference-workflow validation, parameter sensitivity, Slurm-oriented HPC execution planning, and a **near-term FTQC-aware modeling extension**. The FTQC direction is to import or adapt quantum resource estimates (logical execution time, physical-qubit requirements, QEC and magic-state overhead) and connect them to HPC orchestration, classical decoding/communication constraints, and cloud-accessed versus tightly integrated HPC–QPU architectures. [Scope and technical outlook](docs/coordination/FTQC_EXTENSION_OUTLOOK.md). **FTQC support and Slurm export are planned, not implemented in this prototype.**

**Model limitations:** The current engine uses deterministic service times, an expanded DAG, explicitly specified capacities, FIFO admission, and independently modeled transfer delays; it does not capture live provider queues, network contention, uncertain runtimes, physical device noise, or real-time fault correction.
