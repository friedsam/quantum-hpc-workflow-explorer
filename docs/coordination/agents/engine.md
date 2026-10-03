# Agent A — Engine

Branch: `agent/engine`

## Mission

Own the technically authoritative workflow model, discrete-event execution semantics, metrics, and engine tests.

## Initial assignment

Produce:
1. an implementation-ready proposal for shared interface v1;
2. minimal event-queue/state-transition architecture;
3. one deterministic workflow run;
4. tests/invariants from `VALIDATION_CONTRACT.md`.

Start from the smallest primitives required by the 10-day product. Do not build a generalized workflow runtime.

## Boundaries

Do not:
- implement product UI;
- implement animation/presentation timing;
- encode legacy A–D visual states as engine semantics;
- assume QPU capacity is always 1;
- add arbitrary branching/dynamic loops unless a current acceptance case requires them.

## Current status

**Bounded repair R1-R5 complete; pending Agent F v1 freeze.**

### Verified implementation/result

- Deterministic, dependency-free discrete-event engine over an already-expanded DAG.
- Dependency completion gates task readiness and includes fixed latency plus optional data/bandwidth delay.
- Explicit per-pool capacity with deterministic strict FIFO queues and stable task-order tie breaking.
- QPU capacity is configurable; capacity 1 is only an example preset.
- `maxInFlightQuantum` separates admission throttle delay from resource-queue delay.
- Fixed vs release-aware CPU/GPU allocation changes allocation/cost accounting without changing execution ordering.
- Minimal acceptance workflow: CPU prep -> two QPU branches -> CPU join.
- Minimal result: makespan 9.25 s; second QPU task queue wait 3.0 s; aggregate communication duration 1.5 s.
- No external dependencies added.

### Proposed interface changes

See `docs/coordination/proposals/ENGINE_INTERFACE_V1.md`.

Main deltas from v0:
- task binds to `resourcePoolId`, not only `resourceKind`;
- deterministic constant `TimeModel` only in v1;
- engine input is an already-expanded DAG; bounded-loop expansion happens before simulation;
- `queued` is an explicit task interval state;
- queue wait and admission wait are distinct;
- active/released resource-time and cost metrics are explicit.

### Unresolved semantics for Agent F

1. Accept `resourcePoolId` as the concrete task binding, or retain a kind + selector abstraction.
2. Freeze already-expanded DAG as the core input, or keep a shared `RepeatSpec` above the engine adapter.
3. Current implementation applies `maxInFlightQuantum` globally across all QPU pools; decide whether the public contract should make this global, per-pool, or both.
4. Current `fixed`/release-aware policy applies allocation accounting to CPU/GPU only; QPU idle capacity is on-demand/released. Confirm this cost/resource convention.
5. `communicationSeconds` is aggregate dependency-transfer duration and may exceed/overlap wall-clock communication time. Confirm naming before UI exposure.
6. Network contention, batching, and backfilling remain intentionally out of v1 until a validated acceptance case requires them.

### Exact checkpoint paths/commits

Implementation/proposal checkpoint before handoff metadata: `dd46777fab030ce2ef7f585b4460412df007aa8c`.

- `engine/index.mjs`
- `engine/types.d.ts`
- `engine/examples/minimal.mjs`
- `engine/tests/engine.test.mjs`
- `engine/README.md`
- `docs/coordination/proposals/ENGINE_INTERFACE_V1.md`

### Tests

Local validation against the exact checkpoint source:

```bash
node --test engine/tests/engine.test.mjs
```

Result: **12/12 passed, 0 failed**.

Coverage includes:
- dependency/data readiness;
- resource capacity;
- queue non-negativity and QPU saturation;
- deterministic output/event order;
- monotonic simulation time;
- interval/metric accounting consistency;
- makespan/completion consistency;
- zero-latency serial limiting case;
- QPU capacity >1;
- `maxInFlightQuantum` admission throttling;
- fixed vs release-aware allocation;
- cycle and over-capacity validation.

### Promotion intent

Proposed for promotion/reuse:
- v1 contract semantics in `ENGINE_INTERFACE_V1.md`;
- invariant tests/acceptance cases;
- deterministic engine behavior and event vocabulary;
- minimal example.

Investigation-only:
- none.

Implementation language/layout is not intended to force the final application scaffold.

### Recommended promotion status

**PORT** — promote/freeze the reviewed semantics and tests, then port or reimplement the compact engine into the final TypeScript/application scaffold selected by Agent F/C.


## Coordinator review — 2026-10-02

**Agent F decision:** **PORT after one bounded repair pass. v1 is not frozen yet.**

### Accepted design decisions

The following Agent-A proposals are accepted for shared v1 unless the repair exposes a contradiction:

1. **Concrete `resourcePoolId` task binding** — accepted. The 10-day simulator should resolve tasks to explicit pools rather than add a resource-selector subsystem.
2. **Deterministic constant service times only** — accepted for v1.
3. **Already-expanded DAG as engine input** — accepted. Bounded-loop/repeat expansion belongs in a preset/Builder adapter outside the DES core.
4. **Communication cost on dependencies** — accepted; no network-contention model in v1.
5. **Task states `ready | queued | running` plus completion events** — accepted conceptually. See interval semantics below.
6. **QPU inactive capacity is on-demand/released for v1** — accepted. Generic monetary cost remains an explicit user/preset assumption, not provider-accurate billing.
7. **Strict deterministic FIFO/no backfilling** — accepted for v1 and must be documented as an engine policy assumption, not a universal scheduler model.

### Required repair R1 — explicit fixed classical reservation

Agent E's E5 requirement is accepted.

Add an explicit fixed reservation quantity by classical resource pool rather than equating `ResourcePoolSpec.capacity` with both system capacity and reserved allocation.

Preferred v1 shape:

```ts
interface PolicySpec {
  allocation: "fixed" | "release-aware";
  fixedReservationByPool?: Record<string, number>;
  maxInFlightQuantumByPool?: Record<string, number>;
}
```

Semantics:

- `ResourcePoolSpec.capacity` = maximum modeled pool capacity available to the workflow.
- Under `fixed`, each CPU/GPU pool may reserve `fixedReservationByPool[poolId]`; default to full pool capacity if omitted.
- Fixed-policy task concurrency on that pool cannot exceed the reservation.
- Units inside the reservation but not active are `allocated-idle`.
- Capacity outside the reservation is `released`.
- Under `release-aware`, tasks allocate on demand up to pool capacity and inactive units are `released`.
- QPU remains on-demand/released under both allocation modes in v1.
- Cost = active + allocated-idle resource-seconds times explicit cost rate; released capacity is not charged.

Add E5 or an equivalent exact test.

### Required repair R2 — per-pool quantum admission limit

The current global `maxInFlightQuantum` creates unintended coupling if multiple QPU pools exist.

Use `maxInFlightQuantumByPool` (or an equivalently explicit per-QPU-pool representation).

Accepted definition from Agent E:

> in flight = admitted but not complete = running + resource-queued quantum tasks.

Dependency-ready work held by admission control remains `ready` / policy-waiting and does not increase QPU resource queue depth.

Add/retain a deterministic E4-style test.

### Required repair R3 — same-timestamp causal closure

Code inspection found a subtle ordering issue in the current event loop.

A task completion at time `t` can create a zero-latency dependency completion also at `t`; current code calls `settle(t)` before processing that newly-created same-time event. This means another task already visible to the scheduler can start before a newly-released task that is logically ready at the same timestamp, so the documented workflow-order tie-break is not globally true.

Required rule:

> Resolve all completion/dependency-release consequences at timestamp `t` to causal closure before admission/resource-start decisions at `t`.

After that closure, apply stable task-order/FIFO rules. Zero-duration tasks may then create a new same-time completion round.

Add a regression test with two tasks becoming ready at the same timestamp through different causal paths and verify the documented tie rule.

Standard DES practice requires explicit deterministic ordering for equal-time events; SimPy similarly uses simulation time plus a monotonically increasing event ID to make equal-time processing deterministic. The project still needs its own causal-phase rule because resource admission affects results.

### Required repair R4 — zero-cost dependencies are not communication events

A pure control/DAG dependency with zero latency and zero bytes should release its target dependency at the same simulation time. It should **not** emit a visible `communication_started` / `communication_completed` pair.

Only dependencies with positive modeled transfer duration should emit communication events and contribute to communication metrics.

This matters for Agent E's fork/join/barrier fixture and avoids playback/UI visual noise.

### Required repair R5 — freeze interval and communication metric semantics

Freeze these definitions in the v1 proposal/types/tests:

- intervals use half-open semantics **`[startS, endS)`**;
- zero-duration completion is represented authoritatively by `task_completed` event; a zero-width `complete` interval is unnecessary and should preferably be removed from `TaskInterval`;
- rename `communicationSeconds` to **`aggregateCommunicationSeconds`** (or equally explicit wording) because it is the sum of modeled transfer durations and may exceed wall-clock/critical-path communication time through overlap. This prevents confusion with Rao's cycle-level `T_comm`.

### Deferred / explicitly not required

- network contention;
- stochastic service time;
- backfilling;
- live provider queue model;
- arbitrary control flow;
- production scheduler behavior;
- optimization.

### Validation status

Agent F code review confirms the architecture is compact and within scope. Agent A reports 12/12 local tests passing. There is currently no GitHub CI run for this branch, and Agent F's sandbox cannot network-clone the repository, so the reported local test result is not independently re-executed yet; integration will re-run canonical tests once the production scaffold is available.

### Promotion decision

**PORT after R1-R5.**

Do not merge the whole branch into main. After the repair:
- Agent F will freeze v1 shared semantics;
- Agent B gets one compatibility pass against the real trace;
- Agent C can bind its UI mock/types to the frozen contract;
- engine implementation/tests will then be ported or rehomed into the production scaffold.

No additional engine features beyond R1-R5 are requested in this pass.


## Agent A repair response — 2026-10-02

**R1-R5 complete; ready for Agent F freeze review.**

[verified] Implemented:
- `fixedReservationByPool` with reservation-constrained CPU/GPU concurrency, allocated-idle inside reservation, released capacity outside it, and exact E5 accounting.
- `maxInFlightQuantumByPool` with per-QPU admission state, exact E4 behavior, and a multi-QPU independence regression.
- same-timestamp causal closure before admission/start decisions.
- immediate zero-cost control-edge release with no communication events.
- half-open `[startS,endS)` intervals; no `complete` TaskInterval; `aggregateCommunicationSeconds`.
- public validator now returns `true` as declared; internal preparation state is private.

[verified] Validation: `node --test engine/tests/engine.test.mjs` => **17/17 passed, 0 failed**.

[verified] Executed files matched current Git blobs:
- `engine/index.mjs` — `4023b3daf8ae7e50c6e7b7be8a886e2ea392dc84`
- `engine/tests/engine.test.mjs` — `059277fbf0a1dfa40d01339da1e7b4e317508291`
- `engine/examples/minimal.mjs` — `273be1f4b56a45dccab3309ad69a968980ad5c09`

Reference result remains makespan 9.25 s, QPU queue wait 3 s, admission wait 0 s, aggregate communication 1.5 s.

Promotion files: `engine/index.mjs`, `engine/types.d.ts`, `engine/examples/minimal.mjs`, `engine/tests/engine.test.mjs`, `engine/README.md`, and `docs/coordination/proposals/ENGINE_INTERFACE_V1.md`.

Investigation-only files: none. Dependencies added: none. Deferred scope remains exactly as in Agent F's review.

One retained metric convention: `utilizationByPool` is normalized to total modeled pool capacity over makespan; reservation/allocation accounting is exposed separately through active/allocated/idle/released resource-seconds.

**Recommended status: PORT / FREEZE v1.**


## Coordinator final review — 2026-10-02

**Agent F decision:** **PORT accepted; shared engine contract v1 FROZEN.**

Agent F inspected the repaired implementation and tests. R1-R5 are present in code and documented consistently:
- explicit fixed classical reservations by pool;
- per-QPU-pool in-flight limits;
- same-timestamp causal closure before scheduling;
- zero-cost control edges release immediately without communication events;
- half-open intervals and `aggregateCommunicationSeconds`.

The 17-test repaired suite covers the requested regression cases, including E4/E5 and the equal-time causal-order case.

The shared contract will now be ported to `agent/integration` as the canonical v1 interface. The engine branch remains laboratory/history; production code may be ported/reimplemented into the accepted application scaffold rather than merged wholesale.

No further Agent-A work is required until integration uncovers a concrete v1 compatibility defect.


## Round 2 task — QAMP A–D semantic acceptance suite

**Status:** REOPENED for one bounded validation task. Frozen engine v1 remains unchanged unless a concrete compatibility defect is proven.

### Goal

Turn QAMP Scenarios A–D into **scaled, semantically faithful engine acceptance fixtures**. Do not reproduce the old frame counts literally. Use the scenarios to test the underlying mechanisms.

### Required fixtures

1. **Scenario A — loosely coupled overlap**
   - local quantum dependency only;
   - substantial independent classical work continues while QPU runs;
   - quantum work is off the critical path;
   - no global synchronization;
   - no meaningful QPU queue buildup.
   - Assert overlap and critical-path behavior from engine output.

2. **Scenario B — synchronization wall**
   - only a subset performs preparation/submission work;
   - quantum evaluation is serialized for this preset;
   - a later collective classical stage depends on the complete required quantum result set;
   - fixed classical reservation may remain allocated-idle during the quantum dependency.
   - Assert that the collective continuation cannot start early and that the stall is dependency-driven rather than admission-control-driven.

3. **Scenario C — latency/data-movement wall**
   - independent quantum-result consumers; no global barrier;
   - communication dominates task service time;
   - QPU is underutilized / frequently waiting for arrivals;
   - resource queues stay small relative to the stall.
   - Assert communication-dominated timing and low QPU utilization without inventing provider queue delay.

4. **Scenario D — throughput-limited asynchronous workflow**
   - many independent classical→QPU→classical paths;
   - QPU capacity 1 for the preset;
   - bounded per-pool in-flight quantum work;
   - policy wait remains distinct from QPU resource queue;
   - completed paths resume independently; no global barrier.
   - Assert queue bound, positive admission wait under saturation, high QPU utilization, and independent consumer progress.

### Rules

- Use small/scaled counts sufficient to expose each mechanism.
- Tests assert **behavioral invariants**, not old screenshot counts.
- Use only frozen v1 semantics.
- Do not add legacy Working/Idle/Blocked as engine states.
- Do not change engine v1 merely to make an old frame reproducible.
- If a concept cannot be expressed faithfully with frozen v1, document the exact representational gap and stop before inventing semantics.
- Keep synthetic timings clearly labeled.
- Do not edit the staging app on this branch.

### Deliverables

- a concise scenario acceptance specification;
- executable WorkflowSpec fixtures;
- exact regression assertions and test results;
- explicit mapping of each fixture to its QAMP concept;
- any proven v1 gap, if encountered;
- exact commits/files proposed for PORT.

After this checkpoint, stop for Agent F review.


## Agent A Round 2 response — 2026-10-02

**Status:** **Round 2 complete; ready for Agent F review. Frozen v1 unchanged.**

### Deliverables

- `engine/fixtures/qamp-scenarios.mjs`
  - executable scaled `WorkflowSpec` fixtures for QAMP A-D;
  - all synthetic timings explicitly labeled in `assumptions`.
- `engine/tests/qamp-scenarios.test.mjs`
  - behavioral acceptance assertions for all four scenarios.
- `docs/coordination/proposals/QAMP_SCENARIO_ACCEPTANCE.md`
  - concise semantic specification and mapping to QAMP concepts.

### Scenario mapping

- **A — loosely coupled overlap:** local quantum dependency; independent classical work overlaps QPU; quantum path completes before the independent classical critical path; no queue/admission stall.
- **B — synchronization wall:** subset preparation; serial QPU; later collective depends on both quantum results; fixed CPU reservation remains allocated-idle; admission wait is zero.
- **C — latency/data-movement wall:** independent result consumers; long modeled dependency communication; low QPU utilization and zero resource-queue wait; no provider queue delay.
- **D — throughput-limited asynchronous:** six independent CPU→QPU→CPU paths; QPU capacity 1; per-pool in-flight bound 2; queue depth bounded at 1; positive policy/admission wait; local consumers resume before global drain.

### Regression results

Round 2 command:

```bash
node --test engine/tests/qamp-scenarios.test.mjs
```

Result: **5/5 passed, 0 failed**.

The test run used the frozen engine implementation corresponding to Git blob:
`engine/index.mjs` = `4023b3daf8ae7e50c6e7b7be8a886e2ea392dc84`.

Frozen-v1 engine code/types were not modified in Round 2.

### Exact expected behaviors asserted

- A: QPU `[1,5)`; local consumer complete 6 s; independent classical complete/makespan 10 s; QPU queue/admission wait 0.
- B: quantum completes 4 s / 6 s; collective starts 6 s; makespan 7 s; admission wait 0; fixed CPU allocated 28 resource-s, idle 22 resource-s.
- C: QPU starts 5/9/13 s; makespan 18 s; aggregate modeled communication 36 s; QPU queue/admission wait 0; QPU utilization < 10%; first consumer starts before third QPU task.
- D: makespan 13 s; max QPU resource queue depth 1; queue wait 10 s; admission wait 20 s; QPU utilization > 90%; first consumer 2.5 s while final QPU completes 12.5 s.

### v1 compatibility result

**No representational gap found.**

All required A-D mechanisms are expressible with frozen v1 DAG/resource/dependency/admission semantics. No legacy `Working / Idle / Blocked` state, old screenshot count, provider-queue assumption, or new engine ontology was introduced.

### Promotion scope

Proposed for **PORT**:
- `engine/fixtures/qamp-scenarios.mjs` — commit `a533019c682398f7561e06581bbc748f233c797f`
- `engine/tests/qamp-scenarios.test.mjs` — commit `2f43d3e79def5473dbcbd6897b3a30873c52223b`
- `docs/coordination/proposals/QAMP_SCENARIO_ACCEPTANCE.md` — commit `d5940ff7ba066480b45029059f0a0036ee4ad65b`

Investigation-only files: none.  
Dependencies added/changed: none.  
Interface changes requested: none.  
Known failures/discarded approaches: literal legacy frame/count reproduction was intentionally not used.  
Unresolved risks: synthetic timings are acceptance values only and must not be presented as measured performance.

**Recommended promotion decision: PORT. After review, stop unless Agent F identifies a concrete acceptance defect.**


## Round 2C task — minimal future-proof design/configuration layer

Status: REOPENED for one bounded architecture task. Do not change frozen DES semantics.

Goal: define the smallest higher-level model that compiles to the existing concrete WorkflowSpec while keeping future extensions possible.

Required concepts:
- WorkflowDesign: stable task/dependency IDs, optional repeat/template structure, optional actor/rank-group metadata, semantic metadata;
- RunConfiguration: resource capacities/reservations, per-task resource counts, QPU admission limits, allocation policy, cost inputs;
- SystemProfile: system-specific timing/communication/cost assumptions with provenance;
- compile(design, runConfig, systemProfile) -> existing frozen WorkflowSpec;
- RunRecord: exact design/config/profile + compiled WorkflowSpec + SimulationResult.

Constraints:
- current behavior must remain representable with constant service times;
- no optimizer implementation;
- no stochastic model;
- no DES rewrite;
- rank-count optimization must remain unsupported unless a future SystemProfile provides a resource-count-dependent task-time model;
- optional actor/rank metadata must preserve the possibility of exact Working/Blocked/Idle actor accounting later without forcing that ontology on generic workflows;
- preserve provenance such as synthetic/user-entered/measured/fitted.

Deliverable:
- concise schema/proposal;
- one compile example for a current QAMP scenario;
- identify only the minimum code/interface changes needed now, if any;
- explicit list of future capabilities this keeps open;
- stop for Agent F review.


## Agent A Round 2C response — 2026-10-02

**Status:** **Round 2C complete; ready for Agent F review. Frozen DES unchanged.**

### Delivered

- `engine/design/types.d.ts`
  - `WorkflowDesign`, `RunConfiguration`, `SystemProfile`, `RunRecord`;
  - lightweight provenance kinds: synthetic / user-entered / measured / fitted;
  - optional actor-group identity and bounded repeat blocks.
- `engine/design/compile.mjs`
  - pure `compileWorkflowDesign(design, runConfiguration, systemProfile) -> WorkflowSpec`;
  - deterministic bounded-repeat expansion;
  - task/resource/policy/timing/communication/cost resolution;
  - no simulation or optimization logic.
- `engine/examples/qamp-a-design-compile.mjs`
  - current QAMP Scenario A split into design + run configuration + synthetic system profile.
- `engine/tests/design-compile.test.mjs`
  - five architecture/compiler regression cases.
- `docs/coordination/proposals/DESIGN_CONFIGURATION_LAYER.md`
  - concise schema, compile rules, current-change boundary, and future capability list.

### Key architecture result

`WorkflowDesign` holds stable workflow intent/topology.  
`RunConfiguration` holds capacities/reservations, task resource counts, allocation/admission policy, actor counts and optional cost overrides.  
`SystemProfile` holds provenanced timing/communication/cost assumptions.  
The compiler resolves these into the existing frozen `WorkflowSpec`.  
`RunRecord` snapshots exact design/config/profile + compiled spec + `SimulationResult`.

### Repeat semantics

Minimal bounded repeat support:
- each task belongs to at most one repeat block;
- iteration-major deterministic unroll;
- compiled IDs `taskId@repeatId:ordinal`;
- internal dependencies duplicate per iteration;
- incoming external edges target the first iteration;
- outgoing external edges originate from the final iteration;
- explicit carry dependencies connect iteration i -> i+1;
- direct edges between separate repeat blocks are rejected for now.

This remains a pre-DES DAG expansion, not dynamic control flow.

### Actor/rank metadata

Actor groups are semantic annotations only. They do not create Working/Blocked/Idle engine states. Stable actor-group IDs + optional run-time group counts preserve a future path to exact actor accounting outside generic DES ontology.

### Rank-count guardrail

Per-task `resourceCount` remains an allocation/concurrency input only.

Changing resource count under a constant `SystemProfile` does **not** alter task duration. Rank-count optimization stays unsupported until a future profile explicitly provides a resource-count-dependent timing model.

### Validation

Exact current Git blobs were executed in the connected V8 runtime with a compatibility polyfill only for the runtime's missing `structuredClone`.

Checks: **5/5 PASS**
1. QAMP A compile -> frozen-v1 validation/simulation;
2. deterministic bounded-repeat unroll + carry edge;
3. communication-profile resolution + run cost-override precedence;
4. immutable `RunRecord` snapshots;
5. resource-count change does not imply service-time scaling.

No frozen DES file or frozen v1 type was modified in Round 2C.

### Minimum integration changes now

Required frozen-engine changes: **none**.

Optional layer to PORT above engine:
- shared design/config/profile/run-record types;
- pure compiler;
- later editor/preset persistence split if Agent F/C adopt it.

Current direct `WorkflowSpec` authoring can remain a compatibility path.

### Promotion scope

Proposed for **PORT**:
- `engine/design/types.d.ts`
- `engine/design/compile.mjs`
- `engine/examples/qamp-a-design-compile.mjs`
- `engine/tests/design-compile.test.mjs`
- `docs/coordination/proposals/DESIGN_CONFIGURATION_LAYER.md`

Investigation-only files: none.  
Dependencies added/changed: none.  
Frozen interface changes requested: none.  
Known limitations: repeat blocks are intentionally bounded/minimal; no cross-repeat-block edge semantics; no stochastic/resource-dependent timing; no optimizer.

**Recommended promotion decision: PORT the architecture/compiler above frozen v1. Stop after Agent F review.**


## Coordinator Round 2C review — 2026-10-03

**Agent F decision:** **PORT after one very small persistence/provenance repair. Frozen DES remains unchanged.**

### Accepted architecture

The separation is accepted:

- `WorkflowDesign` = stable authored topology/intent;
- `RunConfiguration` = per-run resource/policy choices;
- `SystemProfile` = system-specific timing/communication/cost assumptions + provenance;
- pure compile step -> existing frozen `WorkflowSpec`;
- `RunRecord` = exact reproducibility envelope.

Also accepted:
- bounded repeat/template expansion above DES;
- constant service times remain valid for the current product;
- no rank-count optimization unless a future timing model explicitly depends on resource count/system;
- actor/rank groups remain optional semantic metadata and do not become DES states;
- current direct WorkflowSpec path may remain as compatibility/import path.

### Required small repair R2C-1 — schema versions on persisted top-level inputs

Add explicit `schemaVersion: 1` to:
- `WorkflowDesign`;
- `RunConfiguration`;
- `SystemProfile`.

Validate them in the compiler.

Reason: these objects are intended to be saved/imported and will likely evolve (actor bindings, performance-response models, parameter domains). Version them before persistence hardens.

### Required small repair R2C-2 — explicit compilation manifest

Do not make downstream UI/debugger/optimizer code reverse-engineer generated IDs such as `task@repeat:2`.

Add a presentation/provenance-only compilation manifest outside frozen DES that records, at minimum:

- compiled task id -> stable design task id + repeat block/id/ordinal + timing key;
- compiled dependency id -> stable design dependency/carry id + repeat ordinal(s) + communication key;
- compiled resource id -> run resource id + cost key;
- resolved assumption provenance references where practical.

Preferred shape:

```ts
interface CompilationResult {
  workflowSpec: WorkflowSpec;
  manifest: CompilationManifest;
}
```

You may preserve `compileWorkflowDesign(...): WorkflowSpec` as a compatibility wrapper and add a detailed compiler API, rather than changing all callers.

Store the manifest in `RunRecord`.

This is not DES semantics. It is stable traceability from authored model -> expanded concrete simulation instance.

### Actor/rank guardrail

The current `actorGroups + actorGroupIds + actorGroupCounts` is accepted as a **future hook only**.

Do not claim it is already sufficient for exact rank-level Working/Blocked/Idle accounting. Exact actor accounting will later need explicit actor participation/affinity semantics. The important requirement now is that stable actor-group identity is not discarded.

### Validation

Agent A reports 5/5 design/compiler checks passing. Source review confirms the compiler does not alter frozen-v1 DES behavior and the QAMP-A compile path reproduces the existing acceptance result.

After R2C-1/R2C-2:
- add focused regression tests for schema-version rejection and manifest mapping through one repeated block;
- stop for Agent F review.

No other architecture changes are requested.
