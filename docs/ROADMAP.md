# Quantum–HPC Workflow Explorer — development roadmap

**Status:** A–D event-driven prototype implemented on `agent/integration` as of October 2026. This is a *milestone plan*, not a declaration that later features exist or a promise of dates.

The distinguishing idea is a **traceable chain from a user-authored hybrid workflow to an authoritative event trace and an intelligible visual causal explanation**. The Explorer should remain useful as a what-if planning and communication tool without claiming to reproduce a specific HPC scheduler or hardware provider.

## Milestone 1 — Explainable prototype (implemented; visual QA ongoing)

**Already implemented**
- Logical DAG editing and compilation into the accepted deterministic DES, with explicit resource demand, task multiplicity, actor participation and positive communication costs.
- One shared Builder → Simulate → Explore → Compare workflow, with named synthetic QAMP A–D examples.
- Actor Working/Blocked/Idle projections and separate QPU running/resource-queued/policy-held state, driven by event evidence rather than scripted animation counters.
- Semantic time stepping with source-event links, bounded Advanced diagnostics for large compiled graphs, provenance on modeled assumptions, saved comparable runs.
- Clean Node 22 lockfile-backed build, 143 passing Node tests and 19 Chromium smoke checks.

**Remaining presentation/release acceptance:** Improve default-screen information hierarchy so the DAG, actor/QPU state and playback controls can be understood together; address clipping and coarse scrubbing where material; collect reproducible screenshots; confirm the separate public deployment. This milestone is complete only when a first-time reader can explain a scenario and its bottleneck without deciphering the underlying DES terminology.

## Milestone 2 — Calibration against a representative workflow (planned)

Use one real hybrid HPC–quantum workflow, beginning with the existing Fe4S4 SQD *structural* reference, as a focused validation case.

- Identify the actual stages, HPC/QPU resource units, dependencies and measurable communication/service boundaries.
- Replace selected synthetic wall-time assumptions with documented measured or fitted inputs **only when evidence exists**, and retain source/provenance for every parameter.
- Compare model outputs to available execution logs/traces; report mismatches and the limits of the abstract model. No hardware-accuracy claim without validation.

**Completion criterion:** a reproducible reference workflow with trace/measurement provenance and a report distinguishing directly measured evidence from modeled assumptions.

## Milestone 3 — Design-space analysis (planned)

Extend single-run comparisons into **bounded parameter sweeps** over communication latency, quantum service time, parallel CPU/GPU capacity and max-in-flight limits. Expose sensitivity and tradeoffs with explicit assumptions, rather than present one preferred hardware configuration as an optimized real-world answer.

**Completion criterion:** users can vary a small set of declared parameters, compare results consistently and identify which bottleneck controls the modeled makespan/resource usage.

## Milestone 4 — Scheduler-neutral HPC interoperability (exploratory)

Investigate a versioned export/import boundary between an authored workflow and HPC/QPU execution systems—for example, scheduler-neutral plans or trace import from Qiskit/HPC experiments. Slurm-specific adapters may follow only once the core mapping can be validated.

**Completion criterion:** a documented schema and one small reproducible external-workflow/trace round trip. This would not turn the Explorer into a production scheduler.

## Longer-term research — hierarchical FTQC models (deferred)

Future architectures may require coupling application-level scheduling with *logical* QPU execution-time/resource estimates: logical error budgets, code distance, QEC decoder throughput/feedback deadlines, magic-state factories and shared classical accelerators. Comparing cloud-managed quantum access with tightly coupled HPC–QPU systems would introduce a new cross-layer optimization problem.

Use externally validated resource estimators where possible; keep real-time QEC constraints distinct from ordinary cloud round-trip latency. **None of this is available in the current prototype.** See [FTQC Extension Outlook](coordination/FTQC_EXTENSION_OUTLOOK.md).

## General principles

- Maintain one authoritative simulation engine, with presentation derived from its events.
- Distinguish persistent actors, tasks, queues, policy hold, transfers, and resource allocation.
- Show users the assumption behind every estimate and avoid claiming vendor-specific performance.
- Prefer one measurable, repeatable reference-workflow validation to a broad but unverified feature list.
