# Agent E — Research / Validation

Branch: `agent/research`

## Mission

Keep the simulator/modeling grounded in current literature and the actual QAMP/IBM workflow while preventing research scope from consuming the 10-day product.

## Initial assignment

Validate and summarize only what affects implementation:

- analytical timing model / communication regime quantities suitable as baseline;
- queue/resource-policy findings relevant to tests/presets;
- QAMP tutorial semantics that should remain;
- IBM C/C++/MPI/OpenMP/QRMI/SQD workflow structure suitable as the first serious preset;
- assumptions from legacy scenarios that should be removed or demoted to preset-specific assumptions;
- acceptance cases for Agent A.

Distinguish published equations/results from project-specific assumptions.

## Boundaries

Do not:
- design a new scheduler;
- add QEEGNet/CUDA-Q/live Slurm/current hardware execution to the 10-day scope;
- modify production engine/UI logic directly.

## Current status

**Coordinator-requested Rao follow-up complete; research track ready to stop pending final coordinator consumption.**

Primary evidence artifact:

- `docs/research/VALIDATION_MATRIX.md`
- source commit: `bbb5261d1c1a2f8741e40bd0b9cd13cd25c5c6b7`

### Verified implementation-relevant results

- Current Qiskit C API is a low-level Qiskit core-data-model API; provider execution/scheduling must be attributed to the appropriate runtime/QRMI layer.
- IBM's Fe4S4 SQD C/C++ demo integrates quantum work exclusively at MPI rank 0; MPI parallelism is used for the classical eigensolver/post-processing.
- The inspected demo samples the QPU once before its bounded configuration-recovery/SBD loop.
- Current IBM Quantum Compute documentation supports QPU capacity 1 for that reference environment, but the product must keep capacity configurable because this is not universal.
- IBM provider queueing is dynamic fair-share behavior and must not be represented as a fixed measured queue delay.
- Hockney/alpha-beta communication cost maps directly to v0 dependency latency/bytes/bandwidth fields and is sufficient as the first analytical baseline.
- Slurm allocation semantics justify keeping active, allocated-idle, and released resource states separate.

### Recommended preset

`ibm-sqd-fe4s4-reference` — structural IBM/QAMP reference DAG:

`rank0 setup -> rank0 build -> rank0 transpile -> rank0/QPU sample -> bounded [rank0 recovery/subsample -> all-rank SBD] loop`.

It is a topology/reference preset, not a calibrated performance benchmark.

### Engine acceptance cases

Defined in `docs/research/VALIDATION_MATRIX.md`:

- E1 configurable QPU capacity;
- E2 affine communication dependency;
- E3 fork/join barrier semantics;
- E4 bounded in-flight quantum work;
- E5 scaled IBM fixed-allocation accounting;
- E6 explicit external/provider delay.

### Interface clarifications requested

1. **Fixed reservation size:** v0 has `allocation: "fixed"` but no explicit workflow/job reservation quantity, so it cannot unambiguously account for N reserved MPI-rank slots while rank 0 alone is active.
2. **`maxInFlightQuantum`:** define as admitted-but-not-complete quantum tasks (running + resource-queued); policy-held ready tasks should remain distinct from resource queue depth.
3. **External/provider delay:** do not add a provider scheduler; either model explicit user/synthetic delay with an assumption label or defer it from v1.

Agent F/A must accept or reject these semantics before they become shared contract.

### Legacy disposition

- Preserve A handoff, B fork/join, C latency stress, and D bounded-admission concepts only as engine-derived fixtures/presets.
- Remove hard-coded 1000-rank/200-submitter counts as defaults.
- Remove “every rank submits QPU work” from the serious IBM preset.
- Remove constant provider queue time and queue-time-as-QPU-cost assumptions.
- Remove aggregate Working/Idle/Blocked counters as engine ontology.

## Handoff

- **Production files proposed for promotion:** none directly; this is research/validation evidence.
- **Evidence proposed for PORT:** validated facts, IBM preset topology, acceptance cases E1-E6, legacy assumption removals.
- **Investigation-only files:** none.
- **Dependencies added/changed:** none.
- **Production interface modified:** none.
- **Requested interface changes:** reservation semantics + in-flight definition + external-delay handling above.
- **Validation performed:** primary/current IBM/Qiskit/Slurm sources, direct qiskit-c-api-demo source inspection, legacy Explorer source inspection, deterministic fixture arithmetic.
- **Known failure/discarded approach:** legacy additive Runner is not suitable as authoritative timing/cost model; legacy hand-coded scenario counters are not suitable engine semantics.
- **Unresolved risk:** exact production service/queue times are not supported by sources and must remain user/synthetic inputs.
- **Recommended promotion decision:** **PORT**.


## Coordinator review — 2026-10-02

**Agent F decision:** **PORT — accepted checkpoint, with one bounded follow-up before research track closes.**

### Independently verified

Agent F checked the highest-impact claims against current IBM/Qiskit sources and the current `qiskit-community/qiskit-c-api-demo` source:

- Current Qiskit C API is documented as a low-level interface to the Qiskit core data model, not itself the provider queue/scheduler abstraction.
- IBM's Fe4S4 SQD demo explicitly states that only the classical eigensolver is MPI-orchestrated and quantum integration occurs at rank 0.
- Current `src/main.cpp` performs one sampler execution outside the recovery loop; the bounded recovery/subsample/SBD loop follows that sampling step.
- IBM Quantum Compute documentation states that classical preprocessing for multiple jobs can overlap while only one job at a time executes on the QPU.
- IBM fair-share scheduling is dynamic, so a fixed deterministic provider-queue delay must not be presented as a measured IBM property.
- QRMI/Slurm documentation permits resource configurations with multiple execution lanes, supporting the decision to keep engine QPU capacity configurable rather than globally fixed at one.
- Qiskit 2.3.1 is currently listed as end-of-life while current stable documentation is newer; 2.3 should remain historical QAMP context.

### Accepted for PORT into shared design

- IBM/QAMP Fe4S4 SQD preset topology.
- Removal/demotion of legacy assumptions listed in the validation matrix.
- Acceptance fixtures E1-E6, subject to Agent A/F contract reconciliation.
- Definition of policy wait vs resource queue for `maxInFlightQuantum`.
- Need for explicit fixed-reservation semantics distinct from instantaneous active usage.
- External/provider delay must be explicit synthetic/user input or omitted; no provider scheduler in v1.

### One bounded follow-up required

The checkpoint validates the Hockney/alpha-beta communication term, but it does not yet validate the full Rao et al. 2026 analytical model requested by the new project technical note.

Add a concise section covering only implementation-relevant Rao quantities:

- `T_cycle = T_C + T_Q + T_comm`
- `T_C = C_C / tau_C`
- `T_Q = C_Q / tau_Q`
- `T_comm = F(L + V/B)`
- `R_cc = T_comm / (T_Q + T_C)`
- distinguish blocking exchange frequency `F` from shot count;
- state clearly that this analytical cycle-average model is a baseline/diagnostic and does not replace the event simulator;
- propose the smallest deterministic validation fixture(s), preferably including one published SQD reference check or order-of-magnitude reproduction from Rao.

Do not expand into real-time/QEC modeling unless needed to explain scope exclusion.

### Interface handling

Do not modify shared interfaces directly. Agent F will reconcile R1-R3 with Agent A's v1 proposal.

### Promotion scope

Research prose is not to be merged wholesale into product UI. Agent F will port:
- validated facts;
- the serious IBM/QAMP preset;
- acceptance cases;
- explicit assumption labels.

After the bounded Rao addendum, Agent E can stop unless Agent F requests a later source check.


## Rao addendum completion — 2026-10-02

**[verified]** Coordinator-bounded follow-up completed in:

- `docs/research/VALIDATION_MATRIX.md`, section 11;
- content commit `957a9dd3243faf9e40b56d6ff63d198f6433fed4`;
- Markdown/LaTeX rendering correction `de37c19bfbfe2a071cd560b263bff5f8fb903d2b`.

Validated directly against Rao et al. 2026:

- Eqs. (1)–(5): `T_cycle`, `T_C`, `T_Q`, `T_comm`, `R_cc`;
- `F` is blocking exchange frequency per compute cycle, distinct from shot count;
- analytical model is cycle-average/diagnostic and does not replace DES semantics;
- synthetic exact fixture R1;
- published SQD order-of-magnitude reproduction R2.

R2 reproduces Rao's SQD table to rounding/order-of-magnitude precision:

- remote: `1.15e-4` vs published `1.2e-4`;
- co-located: `1.03e-6` vs published `1.0e-6`;
- tight: `2.05e-7` vs published `2.1e-7`.

Real-time/QEC feasibility was documented only as a scope boundary; no QEC/control-loop model was added.

No dependencies, production logic, or shared interfaces were changed.

**Recommended state:** Agent E idle/closed after coordinator review unless a later source check is requested.


## Coordinator final review — 2026-10-02

**Agent F decision:** **PORT accepted; research track CLOSED/IDLE.**

### Rao addendum independently verified

Agent F checked the primary arXiv HTML for Rao et al. 2026.

Confirmed:
- Eq. (1): T_cycle = T_C + T_Q + T_comm.
- Eq. (2): T_C = C_C / tau_C.
- Eq. (3): T_Q = C_Q / tau_Q.
- Eq. (4): T_comm = F(L + V/B).
- Eq. (5): R_cc = T_comm / (T_Q + T_C).
- F counts blocking quantum-classical exchanges per compute cycle and is explicitly distinct from shot count s.
- SQD uses one measurement batch & diagonalization as the canonical compute cycle and F=1.
- Published SQD reference: 301 x 2.4M shots, ~45 min quantum, 90 min classical.
- Paper reconstructs T_Q ~= 2400 s and T_C ~= 5400 s.
- Published R_cc values are 1.2e-4 remote, 1.0e-6 co-located, 2.1e-7 tight.

The addendum's reproduced values (1.15e-4, 1.03e-6, 2.05e-7) are consistent with the paper's rounded table.

### Accepted usage

- Rao equations become an analytical baseline/diagnostic layer.
- They do not replace the DES or define DES scheduling semantics.
- R_cc may be displayed only from explicit analytical inputs or a deliberately defined trace/cycle mapping with assumptions shown.
- Real-time/QEC feasibility remains documented out-of-scope for v1.

### Final promotion scope

PORT into integration/design:
- validated IBM/QAMP structural preset;
- E1-E6 deterministic acceptance cases;
- legacy assumption removals/demotions;
- fixed-reservation and policy-wait/resource-queue semantics;
- Rao analytical equations + R1/R2 validation fixtures;
- source/provenance notes needed by README/methodology.

Do not merge the research document wholesale into user-facing UI.

No further Agent-E work is required unless Agent F requests a targeted source check later.


## Round 2 task — QAMP A–D concept contract

**Status:** REOPENED for one bounded source-grounding task.

### Goal

Translate the QAMP Scenario A–D tutorial material into a **concept-level acceptance contract** for the rebuilt generic Explorer.

This is not a request to recreate old frames or defend stale didactic counts.

For each scenario, extract from the QAMP documentation:

- defining orchestration mechanism;
- assumptions needed for that mechanism;
- what is explicitly *not* the bottleneck;
- minimum workflow structure needed to demonstrate it;
- observable consequences that frozen v1 can legitimately measure;
- legacy visual concepts that should only be derived/presentational;
- anti-invariants: behavior that would mean the fixture is testing the wrong thing.

### Required distinctions

- A: overlap / QPU off critical path.
- B: global dependency/synchronization wall, not capacity throttling.
- C: communication-dominated delay, not global synchronization or backend queue saturation.
- D: service-capacity mismatch + bounded admission, not a barrier or pure latency wall.

Map old Working/Idle/Blocked language onto frozen-v1 observables only where the mapping is technically valid; explicitly flag concepts that frozen v1 does not represent directly.

### Rules

- Ground the contract in the QAMP scenario pages.
- Do not import exact 1000/200/50 counts unless needed to explain the historical example.
- Do not modify engine/UI code.
- Do not expand research scope beyond acceptance semantics.

### Deliverable

One concise scenario matrix suitable for Agent F to reconcile against Agent A's executable fixtures.

After this checkpoint, stop for Agent F review.


## Round 2 checkpoint — QAMP A–D concept contract

**Status:** **READY FOR AGENT F REVIEW; stop after this checkpoint.**

Deliverable:

- `docs/research/QAMP_SCENARIO_CONTRACT.md`
- source commit: `c8b3e99421367ae85472d21dd653abd47a0420f9`

### Source basis

Checked directly against current QAMP documentation source on `HPC-Quantum/Documentation-website/main`:

- `workflowscenarios.md`
- `scenario-a.md`
- `scenario-b.md`
- `scenario-c.md`
- `scenario-d.md`

Mapped only against frozen v1 from `agent/integration:docs/coordination/INTERFACE_CONTRACTS.md`.

### Result

The contract separates the four mechanisms exactly as requested:

- **A:** local dependency + overlap; QPU off overall critical path.
- **B:** global complete-result dependency/synchronization wall; no throttling/queue wall required.
- **C:** positive dependency communication dominates; no global barrier and no sustained backend saturation.
- **D:** service-capacity mismatch + per-pool bounded admission; local consumers resume independently.

### Frozen-v1 vocabulary findings

- `Working` maps directly only to running classical tasks / active classical resources.
- QPU `Run` and `Queue` map directly.
- `Transfer` maps to positive-duration dependency communication, not a network resource or three-phase transfer state machine.
- legacy `Idle` maps only partially to `allocated-idle`/released allocation state.
- legacy `Blocked` has **no direct v1 state**; local/global dependency gating must be shown from graph/event timing, not recreated as an authoritative rank counter.
- Scenario D policy-held work maps directly to `task_throttled` + `admissionWaitSecondsByPool`, while any CPU allocated-idle state remains separate.

### Representational-gap result

**No frozen-v1 compatibility defect found.** All four defining mechanisms are expressible without adding engine states.

Historical visuals not first-class in v1:
- per-rank Blocked counts;
- causal subtypes of Idle beyond explicit policy wait/allocation accounting;
- off-load/in-flight/on-load transfer subphases;
- “working while off-loading” unless authored as an explicit task;
- exact historical rank/job counts.

### Validation

Research-only checkpoint; no executable engine/UI code changed.

Validation performed:
- direct source comparison against all five QAMP scenario source files;
- cross-check against frozen-v1 task/resource/queue/communication semantics;
- explicit anti-invariants written for A–D to detect mechanism drift.

### Promotion recommendation

**PORT** the scenario matrix and source/observable mapping into Agent F's A/E reconciliation. Do not merge research prose wholesale into the product UI.

No dependencies, engine code, UI code, or shared interfaces changed.


## Coordinator Round 2 review — 2026-10-02

**Agent F decision:** **PORT accepted; Agent E CLOSED/IDLE pending A reconciliation.**

The concept contract is accepted as the source-grounded semantic reference for Scenarios A-D.

Accepted discriminators:

- **A:** local dependency + overlap; QPU remains off overall critical path.
- **B:** global complete-result dependency / synchronization wall; queue saturation and admission control are not the cause.
- **C:** communication-dominated local paths; no global barrier, no sustained backend saturation, no provider queue assumption.
- **D:** service-capacity mismatch + bounded admission; policy wait distinct from QPU resource queue; local consumers resume independently.

Accepted vocabulary constraints:

- `Working` is only directly represented by running classical tasks / active classical resources.
- QPU `Run` and `Queue` map directly.
- `Transfer` maps to positive-duration dependency communication only.
- legacy `Idle` is only partially represented by allocation state.
- legacy `Blocked` is **not** a frozen-v1 task state and must not be recreated as an authoritative rank counter.
- Scenario-D policy-held work maps to `task_throttled` + admission wait.

No frozen-v1 compatibility defect is identified by this contract.

Agent F will reconcile this matrix against Agent A's executable fixtures. No further Agent-E work is required unless that reconciliation exposes a source question.
