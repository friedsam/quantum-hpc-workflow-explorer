# QAMP Scenario A–D Concept Acceptance Contract

Date: 2026-10-02  
Agent: E — Research / Validation  
Purpose: source-grounded semantic contract for reconciling QAMP Scenarios A–D with frozen engine v1.

## Scope and evidence

**[verified]** The QAMP scenario suite is explicitly conceptual orientation rather than performance prediction. The historical rank/job counts are explanatory examples, not acceptance constants.

Primary QAMP sources:

- `HPC-Quantum/Documentation-website/workflowscenarios.md`
- `HPC-Quantum/Documentation-website/scenario-a.md`
- `HPC-Quantum/Documentation-website/scenario-b.md`
- `HPC-Quantum/Documentation-website/scenario-c.md`
- `HPC-Quantum/Documentation-website/scenario-d.md`

Frozen implementation vocabulary is taken from `docs/coordination/INTERFACE_CONTRACTS.md` on `agent/integration` (v1 frozen, 2026-10-02).

This contract preserves the **mechanism** of each QAMP scenario. It does not preserve old screenshot counts or add legacy states to the engine.

---

## Frozen-v1 mapping of the old visual vocabulary

| QAMP visual concept | Frozen-v1 mapping | Status / limitation |
|---|---|---|
| **Working** | classical task `TaskInterval.state = running` plus matching CPU/GPU `ResourceInterval.state = active` | **Direct when an explicit classical task is running.** It is not a generic rank counter. |
| **QPU Run** | QPU task `running` + active QPU resource interval | **Direct.** |
| **QPU Queue** | QPU task `queued` + `queueSeries` depth / `queueWaitSecondsByPool` | **Direct.** |
| **Transfer** | positive-duration dependency with `communication_started/completed`; included in `aggregateCommunicationSeconds` | **Direct only as dependency delay.** v1 does not represent off-load/in-flight/on-load as three resource-consuming phases or a network resource. |
| **Idle** | for a fixed classical reservation, unused reserved units appear as `allocated-idle`; under release-aware allocation inactive units are `released` | **Partial.** Allocation state does not tell why no classical task is running. |
| **Blocked** | no direct frozen-v1 task state | **Not directly represented.** A local wait is expressed by the downstream classical continuation being dependency-gated while QPU/communication work remains incomplete. If a fixed reservation is held, the unused CPU units may simultaneously be `allocated-idle`, but that does not make `allocated-idle == blocked`. |
| **Idle by throttling** (Scenario D) | dependency-ready QPU work held by `maxInFlightQuantumByPool`: `task_throttled` event + positive `admissionWaitSecondsByPool`; any CPU `allocated-idle` is separate allocation accounting | **Policy wait is direct; the historical rank-level Idle label is not.** |

### Important legacy-label caveat

**[verified]** The QAMP overview defines **Blocked** as a rank that submitted a quantum job and waits for *its own* result. Scenario B later uses “all ranks blocked” at the global synchronization wall, including ranks that did not submit quantum jobs.

**[opinion]** The rebuilt acceptance suite must preserve the Scenario-B mechanism (system-wide dependency gating), not encode that broadened visual use of “Blocked” as an engine state.

---

## Scenario matrix

| Scenario | Defining orchestration mechanism | Assumptions required | Explicit non-bottlenecks | Minimum workflow structure | Frozen-v1 observable consequences | Legacy concepts kept presentation-only | Anti-invariants: fixture is testing the wrong thing if… |
|---|---|---|---|---|---|---|---|
| **A — Idealized Baseline / loosely coupled overlap** | A quantum call has a **local dependency only** while substantial independent classical work continues; QPU work remains **off the overall critical path**. | Long classical phase(s); quantum calls infrequent; each result affects only its submitting path; QPU work shorter than independent classical work; transfer negligible; submission rate below QPU capacity; no throttle needed. | No global synchronization wall; no communication/latency wall; no QPU throughput/queue wall. | At least two concurrent classical paths: one path does classical prep → one local QPU task → local continuation; another independent classical path lasts long enough to overlap and outlast the quantum path. QPU capacity may be 1, but no meaningful queue should form. | CPU and QPU active intervals overlap; local consumer starts only after its own QPU result; QPU queue/admission wait ≈ 0; independent classical path continues while QPU runs; workflow makespan is determined by the independent classical path rather than the quantum path. | Historical “one rank Blocked” is only the dependency-gated local continuation; “nearly all Working” is derived from active classical tasks/resources, not a rank counter. | QPU path determines makespan; a collective stage waits on the quantum call; sustained QPU queue/admission wait appears; communication delay dominates; independent classical progress stops solely because QPU is running. |
| **B — Synchronization Wall / globally coupled workflow** | The next collective classical phase has a **global dependency on the complete required quantum result set**. The wall is algorithmic dependency, not resource admission. | Iterative/global update; partial quantum results insufficient; only a subset needs early preparation; later collective stage uses the wider allocation; quantum evaluation is deliberately abstracted so queue buildup is not the phenomenon under test. | Backend congestion is not the cause; admission throttling is not the cause; transfer latency is not the dominant cause. | Small fixed classical reservation; subset preparation task(s); a single aggregated/serialized QPU evaluation stage or otherwise queue-free quantum phase; a collective classical task using the reserved allocation and depending on the complete quantum evaluation. | Collective task cannot start before the final required quantum completion; CPU reservation can accumulate `allocated-idle` resource-seconds during the dependency wall; QPU admission wait = 0; meaningful QPU queue buildup is absent by construction; stall is visible from dependency/event timing. | Historical “all ranks Blocked” becomes **global continuation unavailable + allocated-idle reservation**. Early “Idle” reserved ranks may map to `allocated-idle`, but this is allocation accounting, not a new task state. | The collective task starts from partial results; per-rank consumers progress independently through the supposed wall; positive admission wait/throttle is required to create the stall; a deep QPU queue is the dominant effect; long communication delay is what holds the collective stage. |
| **C — Latency / Data Wall / transfer dominated** | Independent quantum-result paths stall mainly in **communication dependencies**; QPU is often waiting for arrivals and is not the saturated resource. | No global aggregation; results consumed independently; positive transfer delay ≫ classical and QPU service times; transfer paid repeatedly; arrivals are sufficiently spread/staggered that backend queue remains small. | No global synchronization wall; no backend saturation/throughput wall; no admission throttling requirement. | Multiple independent paths: short classical prep → long positive-duration communication dependency → short QPU task → long return communication dependency → local classical continuation. Scaled timings/arrival offsets must avoid turning simultaneous arrivals into Scenario D. | Communication start/complete spans dominate each local path timing; `aggregateCommunicationSeconds > 0` but must not be interpreted as wall-clock critical-path communication under overlap; QPU utilization is low relative to A/B/D reference fixtures; QPU queue wait/depth is zero or small; admission wait = 0; released QPU intervals appear between arrivals; consumers resume independently as their own return dependencies complete. | Historical “Blocked” counts are not directly reproducible; they mean local continuations unavailable while transfer/QPU dependency is unresolved. Transfer arrows map to communication events, not a network resource or rank state. | QPU stays continuously busy with sustained resource queue; admission wait is positive; all consumers wait for one global result set; communication is zero/negligible relative to service; the fixture relies on invented provider queue delay instead of dependency transfer cost. |
| **D — Throttled Execution / throughput limited asynchronous** | Independent paths generate QPU work faster than a capacity-1 QPU can serve it; **bounded per-pool admission** limits in-flight work, producing policy wait while completed paths resume independently. | No global dependency; local result consumption; many independent/frequent quantum calls; enough ready work to saturate QPU; QPU capacity = 1 for this preset; finite `maxInFlightQuantumByPool`; transfer is not the dominant effect. | Not a barrier/synchronization wall; not a pure latency/data wall. | Several independent classical → QPU → local-classical paths whose QPU tasks become ready faster than service completes; QPU capacity 1; in-flight cap smaller than total demand. No collective join is required for local consumers. | QPU queue depth stays bounded by admission semantics; positive QPU `admissionWaitSecondsByPool` under saturation; positive queue wait is possible for admitted work; QPU utilization remains high through the saturated region; `task_throttled` events distinguish policy wait from resource queue; an early completed path's local consumer starts before all QPU jobs complete. | Historical “Idle by policy” is represented by policy-throttled ready work/admission wait, not a new Idle task state. “Blocked” is local dependency gating only. Three-phase transfer/off-load visuals are presentation detail not represented by frozen v1 unless explicit tasks/dependencies are authored. | A collective join prevents every consumer from progressing until all QPU jobs finish; queue depth exceeds the bound; saturation occurs but admission wait remains zero because throttling never engages; QPU is mostly idle waiting on long transfers; transfer latency, rather than service capacity, determines the stall. |

---

## Acceptance interpretation by scenario

### A — what must be proved

**[verified from QAMP]** Clean overlap is the defining concept; QPU execution must not reduce overall classical progress or become the critical-path constraint.

**Required behavioral assertions:**
- at least one positive-duration CPU-active interval overlaps a QPU-active interval;
- the local post-QPU continuation starts only after its QPU predecessor completes;
- no collective dependency is required;
- QPU queue/admission wait is zero or negligible by fixture construction;
- the deterministic makespan is set by the independent classical path, not by the local QPU path.

### B — what must be proved

**[verified from QAMP]** The synchronization wall is imposed by algorithmic dependency; the tutorial intentionally suppresses queue buildup to isolate this effect.

**Required behavioral assertions:**
- the collective classical stage cannot start before the complete required quantum result set is available;
- a fixed reservation can remain allocated-idle while that dependency is unresolved;
- QPU admission wait is zero;
- resource queueing is absent or intentionally trivial;
- removing/changing the global dependency would remove the wall without changing QPU capacity.

### C — what must be proved

**[verified from QAMP]** Transfer dominates while the QPU is frequently idle; neither global synchronization nor queue saturation explains the stall.

**Required behavioral assertions:**
- positive dependency-transfer durations exceed the short CPU/QPU service durations on the representative paths;
- no collective join gates independent consumers;
- QPU utilization is deliberately low and idle/released gaps occur between quantum jobs;
- QPU resource queue remains small;
- admission wait is zero;
- no external/provider queue delay is introduced.

**Fixture-design warning:** if all transfer-delayed jobs arrive simultaneously and create a sustained QPU backlog, the scaled fixture has accidentally become Scenario D.

### D — what must be proved

**[verified from QAMP]** The key mechanism is service-rate mismatch controlled by throttling, with no global barrier.

**Required behavioral assertions:**
- QPU capacity is 1 for the preset and is saturated for a meaningful interval;
- per-pool in-flight limit is never exceeded;
- policy-held work produces `task_throttled` / positive admission wait but does not inflate QPU resource queue depth;
- QPU queue remains bounded;
- at least one local post-QPU consumer starts before the final QPU task completes;
- no collective dependency is needed for that progress.

---

## Cross-scenario discriminators

These are the minimum discriminators Agent F can use when reconciling Agent A's executable fixtures.

| Diagnostic | A | B | C | D |
|---|---:|---:|---:|---:|
| Global complete-result dependency | No | **Yes** | No | No |
| Local QPU-result dependency | Yes | May exist inside aggregate phase | **Yes** | **Yes** |
| Communication dominant | No | No | **Yes** | No |
| Sustained QPU saturation | No | Not required / suppressed | No | **Yes** |
| Admission throttling required | No | No | No | **Yes** |
| Positive admission wait expected | No | No | No | **Yes** |
| QPU queue buildup defining | No | No | No | Bounded backlog only |
| Independent consumer may resume before all QPU work completes | Yes | **No** | Yes | **Yes** |
| Fixed classical reservation useful to expose allocated-idle | Optional | **Yes** | Optional | Optional |
| QPU off overall critical path | **Yes** | No | No | No |

---

## Representational gaps: frozen v1 is sufficient, with explicit limits

**[verified against frozen v1]** No v1 engine change is required to express the four defining mechanisms.

The following historical visuals are deliberately **not** first-class v1 semantics:

1. per-rank `Blocked` counts;
2. causal subtypes of classical `Idle` except policy wait and allocation state;
3. transfer split into off-load / in-flight / on-load phases;
4. “rank is Working while off-loading” unless off-load is authored as an explicit CPU task;
5. a physical/network resource state machine;
6. legacy exact rank/job counts.

These can be derived or narrated by playback/UI only when provenance is clear; they must not become authoritative counters independent of the engine trace.

---

## Promotion recommendation

**PORT** this concept contract into Agent F's A/E reconciliation.

No production code, engine semantics, UI code, dependencies, or shared interfaces are changed.
