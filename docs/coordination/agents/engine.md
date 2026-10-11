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


## Agent A Round 2C repair response — 2026-10-03

**Status:** **R2C-1/R2C-2 complete; ready for Agent F review.**

### R2C-1 — persisted input schema versions

Added required `schemaVersion: 1` to:
- `WorkflowDesign`;
- `RunConfiguration`;
- `SystemProfile`.

The compiler now rejects missing or unsupported versions before resolution/expansion.

### R2C-2 — explicit compilation manifest

Added:
- `compileWorkflowDesignDetailed(...)` -> `{ workflowSpec, manifest }`;
- compatibility `compileWorkflowDesign(...)` remains unchanged for callers needing only `WorkflowSpec`;
- `CompilationManifest` records authored-to-compiled traceability for tasks, dependencies/carry edges and resources;
- resolved timing/communication/cost provenance is retained in manifest entries;
- `RunRecord` now snapshots `compilationManifest` alongside exact design/config/profile/spec/result.

The manifest is presentation/provenance data only and does not enter DES semantics.

### Actor/rank guardrail

Documentation now states explicitly that actor-group identity/counts are only a future hook. They are **not** sufficient for exact rank-level Working/Blocked/Idle accounting without future participation/affinity semantics.

### Focused validation

Exact current test logic was executed against current Git branch content.

Result: **7/7 PASS**.

New requested regressions:
1. missing/unsupported `schemaVersion` rejection across all three persisted inputs;
2. manifest mapping through a repeated block, including:
   - compiled task -> design task + repeat ordinal + timing key/provenance;
   - compiled design dependency -> stable dependency + repeat ordinals + communication provenance;
   - compiled carry edge -> carry ID + source/target ordinals;
   - compiled resource -> run resource + cost key/source/provenance.

Existing compiler behavior/regressions remain passing.

### Scope

Frozen DES implementation/types were not changed.

No optimizer, stochastic model, actor-state ontology, rank-scaling inference, or other architecture change was added.

### Files proposed for PORT

- `engine/design/types.d.ts`
- `engine/design/compile.mjs`
- `engine/examples/qamp-a-design-compile.mjs`
- `engine/tests/design-compile.test.mjs`
- `docs/coordination/proposals/DESIGN_CONFIGURATION_LAYER.md`

Investigation-only files: none.  
Dependencies added/changed: none.  
Frozen interface changes requested: none.

**Recommended decision: PORT. Stop after Agent F review.**


## Coordinator Round 2C final review — 2026-10-03

**Agent F decision:** **PORT accepted; Round 2C FROZEN. Agent A CLOSED/IDLE.**

Accepted:
- versioned WorkflowDesign / RunConfiguration / SystemProfile;
- pure design compiler above frozen DES;
- bounded repeat expansion;
- CompilationManifest with authored-to-compiled task/dependency/resource traceability;
- RunRecord including the manifest and exact inputs/result;
- provenance for timing/communication/cost assumptions;
- optional actor-group identity as a future hook only.

The compatibility compileWorkflowDesign(...) -> WorkflowSpec API remains useful; compileWorkflowDesignDetailed(...) is the preferred API when provenance/debugger/optimization traceability matters.

No frozen DES changes are required.

Agent A reports 7/7 focused compiler tests passing. There is no branch CI workflow for Agent A; integration CI will re-run equivalent tests after the layer is ported into the production app.

No further Agent-A work is required unless integration reveals a concrete compiler defect.


## Coordinator Round 2C repair acceptance — 2026-10-03

**Agent F decision:** **PORT accepted; Agent A CLOSED/IDLE.**

Verified by source review:
- schemaVersion=1 is required and validated for WorkflowDesign, RunConfiguration and SystemProfile;
- compileWorkflowDesignDetailed(...) returns WorkflowSpec + CompilationManifest;
- manifest maps compiled tasks, dependencies/carry edges and resources back to authored IDs/profile keys with provenance;
- RunRecord snapshots the manifest with exact inputs/spec/result;
- compatibility compileWorkflowDesign(...) remains available;
- frozen DES implementation/types are unchanged.

Agent A reports 7/7 focused compiler tests passing. No GitHub Actions run exists for this branch head; equivalent tests must pass after the layer is ported into the production app/integration CI.

No further Agent-A work is required unless Round 3 exposes a concrete compiler defect.


## Agent A Round 4A response — 2026-10-10

**Status:** **Round 4A complete; ready for Agent F review. Frozen DES unchanged.**

### Delivered

- `engine/design/types.d.ts`
  - additive logical task multiplicity;
  - persistent actor-group kind/count model;
  - explicit actor participation;
  - dependency instance mapping;
  - manifest logical-instance and actor-assignment types;
  - actor-state derivation API types.
- `engine/design/compile.mjs`
  - multiplicity compilation to concrete WorkflowSpec tasks;
  - pairwise / all-to-all logical dependency expansion;
  - actor-group/count validation;
  - compact actor assignments in CompilationManifest;
  - no DES changes.
- `engine/design/actor-state.mjs`
  - derives persistent logical actor `working / blocked / idle` from manifest + exact SimulationResult.
- `engine/examples/qamp-b-actor-model.mjs`
  - compact Scenario B: preparation x2 -> serialized quantum x2 -> full collective x1 over four persistent logical ranks.
- `engine/tests/actor-model.test.mjs`
  - Scenario B Round 4A acceptance tests.
- `docs/coordination/proposals/ROUND4_ACTOR_MODEL.md`
  - model contract, derivation semantics, acceptance result, explicit limits.

### Core distinction

The model keeps three independent quantities:

1. logical task multiplicity;
2. persistent actor count;
3. per-concrete-task DES `resourceCount`.

Scenario B demonstrates this with 3 authored tasks -> 5 compiled tasks, 4 actors, and resourceCount values 1/1/4.

No rank is emitted as a WorkflowSpec task merely because it exists.

### Actor participation/state

Round 4A supports only:
- `selection: all`;
- `selection: one-per-instance`;
- `stateDuringTask: working | blocked`.

Derivation:
- Working = participating actor while a working-marked task is running;
- Blocked = participating actor from ready -> completion for a blocked-marked task;
- Idle = no active claim;
- overlapping actor claims throw.

The actor projection is explanatory state above DES, not a new engine ontology.

### Scenario B acceptance

Persistent ranks = 4.

Compact logical tasks:
- prepare multiplicity 2;
- quantum multiplicity 2;
- collective multiplicity 1.

Compiled behavior:
- prepare #1/#2 start 0;
- quantum #1 start 1;
- quantum #2 start 4 on QPU capacity 1;
- collective starts 7 only after both quantum results;
- makespan 8;
- QPU queue wait 3;
- admission wait 0.

Derived actor counts:
- t=0.5 -> Working 2 / Blocked 0 / Idle 2;
- t=2 -> Working 0 / Blocked 2 / Idle 2;
- t=5 -> Working 0 / Blocked 1 / Idle 3;
- t=7.5 -> Working 4 / Blocked 0 / Idle 0.

### Validation

Exact current branch blobs were executed in the connected runtime.

- Round 4A actor suite: **4/4 PASS**.
- Existing Round 2C design/compiler regression suite: **7/7 PASS** after the additive manifest fields.

Total focused checks: **11/11 PASS**.

### Compatibility / schema

Frozen `WorkflowSpec`, `SimulationResult`, engine scheduling/events/metrics were not modified.

Persisted higher-level schema remains `schemaVersion: 1` because Round 4A fields are additive/optional and existing version-1 designs retain multiplicity=1/no actor participation behavior.

### External terminology verification

MPI 4.1 supports the identity boundary used here:
- ranks identify MPI processes within communicator groups;
- communicator groups define collective participation;
- collective completion is not inherently a global barrier.

Therefore Scenario B synchronization remains an explicit DAG dependency, not an assumed MPI-collective semantic.

### Explicit limits

Not implemented:
- arbitrary actor subsets/ranges;
- one node per rank;
- actor-level message traffic;
- dynamic actor migration;
- optimizer;
- provider queues;
- UI changes;
- multiplicity >1 nested inside repeatBlocks.

### Promotion scope

Proposed for **PORT**:
- `engine/design/types.d.ts`
- `engine/design/compile.mjs`
- `engine/design/actor-state.mjs`
- `engine/examples/qamp-b-actor-model.mjs`
- `engine/tests/actor-model.test.mjs`
- additive expectation update in `engine/tests/design-compile.test.mjs`
- `docs/coordination/proposals/ROUND4_ACTOR_MODEL.md`

Investigation-only files: none.  
Dependencies added/changed: none.  
Frozen DES interface changes requested: none.

**Recommended decision: PORT. Stop after Agent F review.**


## Agent A Round 4A repair response — 2026-10-10

**Status:** **Coordinator repair complete; ready for Agent F review. Frozen DES unchanged.**

### Defect repaired

The original Scenario-B projection incorrectly used QPU-task participation to represent a submitting rank blocked on its result and therefore never produced the required all-ranks synchronization wall.

The repaired model separates:
- task participation;
- actor dependency/wait gates.

### New actor wait/gate semantic

`WorkflowDesign.actorWaits` supports a bounded `ActorWaitClaim` with:
- actor group + `all` or `one-per-instance` selection;
- activation task event/condition;
- release task event/condition;
- explicit reason.

Supported task-event conditions:
- event = ready / started / completed;
- instance condition = matching-instance / any-instance / all-instances.

Wait claims compile into `CompilationManifest.actorWaits` only. They do not enter `WorkflowSpec` or DES semantics.

### Actor-state derivation repair

Added `deriveActorStateDetailAt(...)`.

Rules:
- multiple simultaneous Blocked claims coalesce to one top-level `blocked` state;
- all distinct blocked reasons are retained;
- Working + Blocked overlap is an error;
- multiple simultaneous Working participation claims remain an error;
- `deriveActorStateAt(...)` remains the compatibility state-only API.

### Scenario B repaired acceptance

Persistent ranks: 4.

Authored compact model:
- prepare x2;
- quantum x2;
- collective x1.

Actor semantics:
- prepare #i = rank i Working;
- submitter result wait activates when prepare #i completes and releases when quantum #i completes;
- after any quantum result completes, all four ranks enter `global-synchronization`;
- global wait releases only when all quantum results complete;
- collective then marks all four ranks Working.

Quantum serialization:
- QPU capacity 1;
- max in-flight 1;
- quantum #1 starts t=1;
- quantum #2 is policy-held until t=4;
- QPU resource queue wait = **0**;
- admission wait = 3 s;
- collective starts t=7;
- makespan = 8 s.

Required actor sequence:
- t=0.5 -> Working 2 / Blocked 0 / Idle 2;
- t=2 -> Working 0 / Blocked 2 / Idle 2;
- t=5 -> Working 0 / Blocked 4 / Idle 0;
- t=7.5 -> Working 4 / Blocked 0 / Idle 0.

At t=5:
- rank 1 blocked reason = `global-synchronization`;
- rank 2 blocked reasons = `global-synchronization` + `quantum-result`;
- ranks 3/4 blocked reason = `global-synchronization`.

### Validation

Exact current branch test logic executed against current Git blobs:

- repaired Round 4A actor suite: **6/6 PASS**;
- existing Round 2C design/compiler regressions: **7/7 PASS**;
- total focused checks: **13/13 PASS**.

### External terminology check

MPI 4.1 confirms that collective completion does not generally imply that other processes have completed or even started the operation. The repaired Scenario-B synchronization therefore remains explicitly authored rather than inferred from the word "collective."

### Scope / promotion

Frozen DES implementation/types/events/metrics remain unchanged.

Files proposed for **PORT**:
- `engine/design/types.d.ts`;
- `engine/design/compile.mjs`;
- `engine/design/actor-state.mjs`;
- `engine/examples/qamp-b-actor-model.mjs`;
- `engine/tests/actor-model.test.mjs`;
- additive manifest expectation in `engine/tests/design-compile.test.mjs`;
- `docs/coordination/proposals/ROUND4_ACTOR_MODEL.md`.

Investigation-only files: none.  
Dependencies added/changed: none.  
Frozen interface changes requested: none.

**Recommended decision: PORT. Stop after Agent F review.**


## Coordinator Round 4A repaired-model review — 2026-10-10

**Agent F decision:** **PORT accepted; Agent A CLOSED/IDLE.**

Accepted:
- logical task multiplicity remains distinct from actor count and per-instance resourceCount;
- persistent actor/rank groups are modeled above frozen DES;
- task participation is separate from dependency/gate waiting;
- actor waits/gates compile into the manifest, not WorkflowSpec;
- multiple blocked reasons coalesce while Working+Blocked remains invalid;
- compact logical DAG expands to concrete WorkflowSpec without one-node-per-rank representation;
- frozen DES remains unchanged.

Scenario B now satisfies the required scaled actor sequence:
- subset Working / rest Idle;
- submitting actors Blocked on their quantum results;
- full actor group Blocked on the complete-result synchronization gate;
- full actor group Working in the collective phase.

The fixture also suppresses QPU resource-queue buildup. Its internal admission wait is accepted as serialization scaffolding, not a user-facing Scenario-B bottleneck; product UI must not present Scenario B as a throttling/service-capacity case.

Agent A reports 6/6 repaired actor tests and 7/7 compiler regressions passing. Integration must rerun equivalent tests after porting.

No further Agent-A work is required unless downstream integration reveals a concrete defect.


## Round 4D task — Scenario A fidelity and regime-transition semantics

**Status:** REOPENED for one bounded model/preset pass.

### Why

Browser review exposed that Scenario B is now structurally understandable, but the current Scenario A preset is still generic/actor-less and cannot reproduce the tutorial's defining actor behavior:

- one submitting rank may block on its own quantum result;
- other ranks continue useful classical work;
- no global synchronization wall;
- QPU service remains below offered load in the baseline.

The accepted actor model currently supports only `all` and `one-per-instance` participation/waits. That may be insufficient to express “one/few submitting ranks while the complementary rank subset keeps working” in one persistent actor group.

### Goal

Find the **smallest actor-selection/model extension, if any, needed to represent Scenario A faithfully** while preserving the accepted frozen DES and Round-4 architecture.

### Required acceptance case

Use one scaled actor group representing the HPC rank allocation (for example 4 ranks, not hard-coded generically).

Represent a default Scenario A in which:
- most/all ranks perform classical work;
- one rank submits a quantum request and becomes Blocked only on its own result;
- non-submitting ranks continue useful classical work;
- no global synchronization wait exists;
- one QPU lane executes the request;
- default timing produces no QPU resource queue and no policy hold;
- local result consumption resumes without a full-allocation join.

If exact actor accounting requires a bounded actor selection beyond `all` / `one-per-instance`, propose and implement the smallest deterministic form (for example explicit ordinal set/range or complement selection). Do not create one actor node per rank.

### Parameter-regime requirement

Document and test which behavior changes can emerge by changing **parameters only** while holding topology fixed.

At minimum distinguish:
- longer QPU service time with one local request -> submitting actor blocked longer but no queue/global wall;
- multiple/staggered local requests whose offered load stays below QPU service capacity -> still A-like;
- offered load exceeding QPU service capacity -> queue/throughput regime (D-like);
- adding/retaining an explicit full-group result gate -> synchronization-wall behavior (B-like).

Do not claim A becomes B from QPU time alone if the global dependency is absent.

### Timing semantics

Clarify that task service time is **modeled wall time for the task instance**, not “CPU speed” or per-instruction time. If a logical phase internally contains MPI communication, that cost is either:
- folded into the modeled phase wall time; or
- represented explicitly by dependencies/phases when the user wants to study it.

No stochastic timing model is required.

### Deliverables

1. minimal schema/model change if required;
2. faithful scaled Scenario-A logical fixture/preset;
3. actor-state frame sequence for A;
4. parameter-regime acceptance matrix/tests;
5. statement of what remains topology vs parameter;
6. no UI changes;
7. frozen DES unchanged.

Stop for Agent F review.


## Agent A Round 4D response — 2026-10-10

**Status:** **Round 4D complete; ready for Agent F review. Frozen DES unchanged.**

### Minimal model extension

Added explicit deterministic actor ordinal-set selection:

```ts
{ kind: "ordinals"; actorOrdinals: number[] }
```

This is available for task participation and actor wait claims.

Validation:
- non-empty;
- unique positive 1-based ordinals;
- each ordinal <= persistent actor-group count.

No range/complement language and no rank nodes were added.

### Faithful scaled Scenario A

New executable fixture:
- `engine/examples/qamp-a-actor-regimes.mjs`.

Persistent actor group:
- four HPC ranks.

Baseline authored behavior:
- rank 1 performs local quantum preparation/submission;
- ranks 2-4 perform independent useful classical work;
- rank 1 alone waits on its own quantum result;
- QPU request has no actor participation;
- rank 1 locally consumes its result;
- no full-group wait/gate exists;
- no full-allocation join exists.

Baseline timing:
- background wall time 8 s;
- submit wall time 1 s;
- QPU service wall time 2 s;
- local consume wall time 0.5 s.

Result:
- QPU queue wait = 0;
- QPU admission wait = 0;
- local consume starts t=3 while background continues until t=8.

Actor frames:
- t=0.5 -> Working 4 / Blocked 0 / Idle 0;
- t=1.5 -> Working 3 / Blocked 1 / Idle 0;
- t=3.25 -> Working 4 / Blocked 0 / Idle 0.

### Parameter-regime result

#### One-request topology, timing only

Baseline QPU service 2 s:
- submitting rank blocks 2 s;
- queue = 0;
- no global wall.

Long-QPU profile 5 s:
- same design/run configuration;
- submitting rank blocks 5 s;
- queue = 0;
- no global wall;
- ranks 2-4 continue Working.

Therefore longer QPU wall time alone does not make A -> B.

#### Fixed three-request topology, timing only

Same `WorkflowDesign` and `RunConfiguration` for both profiles.

Below-capacity profile:
- submit wall times 1/3/5 s;
- QPU service 1/1/1 s;
- quantum starts 1/3/5 s;
- QPU queue wait = 0;
- admission wait = 0;
- A-like local independent waits.

Overload profile:
- submit wall times 1/2/3 s;
- QPU service 3/3/3 s;
- quantum starts 1/4/7 s;
- QPU queue wait = 6 s;
- max QPU queue depth = 2;
- admission wait = 0;
- QPU utilization > 0.8;
- no global wait.

This is the parameter-only A-like -> D-like queue/throughput transition.

#### B-like synchronization

The accepted Scenario-B actor fixture is the topology counterexample:
- explicit full-group `global-synchronization` wait;
- full-result collective dependency;
- all four actors Blocked before collective work resumes.

That behavior requires authored dependency/gate semantics. It is not produced by QPU service time alone.

### Timing semantics clarified

`SystemProfile.taskServiceTimes[*].value.seconds` is modeled wall-clock duration of one concrete task instance.

It is not CPU speed or per-instruction time and is not implicitly divided by `resourceCount`.

If a logical phase internally contains MPI communication:
1. its measured/fitted/synthetic wall time may include that communication; or
2. communication may be represented explicitly as dependencies/phases when it is the phenomenon under study.

No stochastic or rank-speedup model was added.

### Validation

Exact current branch logic executed against current Git blobs:

- Round-4D Scenario-A/regime suite: **7/7 PASS**;
- repaired Round-4A actor suite: **6/6 PASS**;
- Round-2C compiler regressions: **7/7 PASS**;
- total focused checks: **20/20 PASS**.

### External verification

Two external facts were used only to sanity-check the framing:
- MPI collectives are not inherently barriers; synchronization must be explicit when required.
- standard queue-stability reasoning distinguishes arrival/offered load from service opportunity; sustained arrival above service opportunity produces backlog.

The deterministic regime fixtures do not claim stochastic queue-rate estimation.

### Files proposed for PORT

- `engine/design/types.d.ts`;
- `engine/design/compile.mjs`;
- `engine/design/actor-state.mjs`;
- `engine/examples/qamp-a-actor-regimes.mjs`;
- `engine/tests/scenario-a-regimes.test.mjs`;
- `docs/coordination/proposals/ROUND4D_SCENARIO_A_REGIMES.md`;
- small consistency update to `docs/coordination/proposals/ROUND4_ACTOR_MODEL.md`.

Investigation-only files: none.  
Dependencies added/changed: none.  
Frozen DES interface changes requested: none.  
Higher-level schema change requested for integration: explicit ordinal-set actor selection.

### Known limits

Not added:
- actor ranges/complements;
- one node per rank;
- optimizer;
- provider queues;
- stochastic timing;
- automatic performance scaling;
- UI changes.

**Recommended decision: PORT. Stop after Agent F review.**


## Agent A Round 4D repair response — 2026-10-10

**Status:** **Small coordinator repair complete; ready for Agent F review. Frozen DES unchanged.**

### Repairs applied

1. **Tutorial source basis corrected**
   - Round-4D documentation now grounds Scenario A in the current published tutorial rather than claiming the page lacks enough prose.
   - Preserved tutorial contract: individual-rank quantum calls, local result consumption, no global quantum-state dependency, concurrent classical work, submitting rank does not stall others, single-lane QPU, at most one active/queued baseline job, no admission control, and immediate classical resumption after result return.

2. **Baseline admission policy removed**
   - baseline Scenario-A `RunConfiguration` no longer sets `maxInFlightQuantumByPool.qpu`;
   - QPU capacity 1 + one request is sufficient;
   - baseline queue wait = 0 and admission wait = 0.
   - multi-request regime fixture retains `maxInFlightQuantumByPool.qpu = 3` only as explicit test-control scaffolding so overload manifests as resource queueing instead of policy hold.

3. **Post-result classical resumption made explicit**
   - baseline local result-consumption/resumed-classical phase increased from 0.5 s to 3 s;
   - rank 1 works from t=3 to t=6 after the result returns;
   - independent ranks continue until t=8;
   - at t=4 all four actors are Working while the QPU is idle;
   - quantum branch remains off the baseline critical path.

4. **Tutorial Idle vs Explorer Blocked wording corrected**
   - tutorial Frame 2 explicitly calls the submitting rank Idle during transfer;
   - the scaled fixture folds transfer into submit wall time;
   - Explorer `Blocked` begins only for the authored post-submit quantum-result wait;
   - documentation no longer attributes the Explorer classification to the tutorial.

5. **Ordinal-set limitation recorded**
   - fixed ordinals such as `[2,3,4]` do not automatically mean "all non-submitters" if actor-group count changes;
   - no complement/range selector was added in this repair.

### Validation

Exact current branch logic rerun after the repair:

- Round-4D Scenario-A/regime suite: **7/7 PASS**;
- repaired Round-4A actor suite: **6/6 PASS**;
- Round-2C compiler suite: **7/7 PASS**;
- total focused checks: **20/20 PASS**.

### Scope

Files intentionally changed in this repair:
- `engine/examples/qamp-a-actor-regimes.mjs`;
- `engine/tests/scenario-a-regimes.test.mjs`;
- `docs/coordination/proposals/ROUND4D_SCENARIO_A_REGIMES.md`;
- coordination handoff/status docs only.

Frozen DES, Round-4 actor compiler semantics, UI, optimizer, provider-queue model and stochastic timing remain unchanged.

Dependencies added/changed: none.  
Investigation-only files: none.  
Interface changes requested: none beyond the already-reviewed ordinal-set selector from Round 4D.

**Recommended decision: PORT. Stop after Agent F review.**


## Coordinator Round 4D final review — 2026-10-10

**Agent F decision:** **PORT accepted; Agent A CLOSED/IDLE.**

Accepted:
- deterministic ordinal-set actor selection for task participation and actor waits;
- actor-aware Scenario A with local submitter wait, independent non-submitters, no global gate, and one QPU lane;
- no baseline admission/throttling policy;
- parameter-only A-like -> D-like queue transition on a fixed multi-request topology;
- explicit authored topology required for B-like global synchronization;
- modeled task time is task-instance wall time, not CPU speed;
- frozen DES unchanged.

Tutorial fidelity was independently checked against the current published Scenario-A page.

Coordinator demo-quality adjustment:
- resumed classical work now continues from t=3 until t=8 so the baseline remains in restored equilibrium after the result instead of reintroducing a spurious idle rank before scenario completion;
- at t=4 and t=7 the actor projection is 4 Working / 0 Blocked / 0 Idle with QPU idle.

Known non-blocking limitation:
- explicit ordinal subsets do not automatically scale when actor-group count changes. Generalized range/complement authoring is deferred until after the 3-day prototype.

Port the latest producer files/fixture including the coordinator duration adjustment.


## Coordinator Round 4F assignment — 2026-10-11

**Status:** ACTIVE for one bounded checkpoint. **Owner:** Agent A on `agent/engine`.

**Authoritative instructions:** Fetch `origin/agent/integration` at/after **`5f999d49b728952ef4bcf6b0c71fc5f71c209935`**, then read the **Round 4F** entry in `docs/coordination/REVIEW_QUEUE.md` and D012 in `DECISION_LOG.md`. Earlier Round 4D status above is superseded.

**Immediate deliverable:** minimal compact scalable actor selection above the frozen DES (e.g. inclusive range / all-except), plus a *separate* 1,000-rank Scenario-A demo producer, tests and performance evidence. Keep the 4-rank fixture as regression; distinguish actor count, logical multiplicity, and per-instance resource units. No UI or DES rewrite.

**Critical-path fix:** The currently integrated A has background 8 s and local submit/QPU/resumed-work = 1 + 2 + 5 = 8 s, a tie. The previous coordinator intentionally kept rank 1 Working through t=7. Retain this restored-equilibrium interval and **extend background wall time above 8 s**, rather than shorten resumed classical work, to make the QPU path strictly off critical path. Expected 1,000-rank snapshots: t=0.5 → 1000/0/0; t=1.5 → 999/1/0; t=4 and t=7 → 1000/0/0, with zero QPU queue/admission delay. All times synthetic.

**Validation and handoff:** preserve old regression tests; run focused tests and branch CI; benchmark 1,000-actor compile/simulate/actor-state costs; report exact SHA/paths, type/manifest migration, known scaling limits, and PORT recommendation. Update this role file with evidence, push and **STOP for Agent F review**. C stays on HOLD pending acceptance.


## Agent A Round 4F response — 2026-10-11

**Status:** **Round 4F bounded checkpoint complete; ready for Agent F review. Frozen DES unchanged.**

### Coordinator inputs consumed

- `agent/integration@5f999d49b728952ef4bcf6b0c71fc5f71c209935`;
- Round 4F entry in integration `REVIEW_QUEUE.md`;
- D012 in `DECISION_LOG.md`;
- current published Scenario-A tutorial.

### Minimal scalable selector result

Added two bounded symbolic actor selectors:

```ts
{ kind: "range"; startActorOrdinal: number; endActorOrdinal: number }
{ kind: "all-except"; actorOrdinals: number[] }
```

Existing selectors remain unchanged:
- `all`;
- `one-per-instance`;
- explicit `ordinals`.

Validation:
- range bounds positive, ordered and within actor-group count;
- exclusion ordinals positive, unique and within actor-group count.

The compiler preserves `range` / `all-except` symbolically in the CompilationManifest. It does not expand a 999-rank selection into 999 actor IDs.

### Type/manifest migration

Higher-level producer/consumer union additions:
- `ActorParticipationSelection`;
- `CompiledActorAssignment.selection`;
- `CompiledActorWaitClaim.selection`.

No `WorkflowSpec` / `SimulationResult` change.

Existing v1 documents remain valid. Any consumer with an exhaustive selector switch must add the two new cases before consuming a Round-4F producer.

`schemaVersion: 1` remains unchanged for this prototype additive extension.

### 4-rank regression correction

The accepted restored-equilibrium local continuation remains 5 s.

Changed only baseline independent background:
- old: 8 s;
- new: 10 s.

Thus:
- submit 1 + QPU 2 + local resume 5 = 8 s;
- independent background = 10 s;
- local branch is strictly off critical path.

Existing small-fixture tests remain active.

### Dedicated 1,000-rank Scenario-A demo

New:
- `engine/examples/qamp-a-1000-demo.mjs`.

Persistent actors:
- 1,000 ranks.

Compact logical tasks:
- 4.

Selectors:
- background ranks 2-1000: `all-except([1])`;
- rank-1 submit/resume/wait: `range(1,1)`.

Resource units:
- CPU capacity 1000;
- background resourceCount 999;
- rank-1 CPU tasks resourceCount 1;
- QPU capacity 1.

There is:
- no global actor/result gate;
- no QPU admission/throttling limit;
- no per-rank DES expansion.

The 999-unit background task is explicitly documented as an aggregate approximation of 999 concurrently working ranks, not 999 independent DES tasks.

Synthetic timing:
- background 10 s;
- submit 1 s;
- QPU 2 s;
- local resume 5 s.

Acceptance:
- t=0.5 -> 1000 Working / 0 Blocked / 0 Idle;
- t=1.5 -> 999 Working / 1 Blocked / 0 Idle;
- t=4 -> 1000 / 0 / 0, QPU idle;
- t=7 -> 1000 / 0 / 0, QPU idle;
- QPU queue wait 0;
- QPU admission wait 0;
- local branch complete t=8;
- makespan t=10.

### Compactness evidence

Exact current branch JSON string sizes:
- design: 2,202 chars;
- run config: 693 chars;
- profile: 1,176 chars;
- compiled WorkflowSpec: 3,900 chars;
- manifest: 2,847 chars.

Actor count remains 1,000 while compiled DES task count remains 4.

### Tests

New:
- `engine/tests/scenario-a-1000-demo.test.mjs` — **5/5 PASS** in exact-blob preflight.

Existing focused suites:
- Round 4D: 7/7 PASS;
- Round 4A actor: 6/6 PASS;
- Round 2C compiler: 7/7 PASS.

Branch CI:
- workflow: `.github/workflows/engine-validation.yml`;
- run: `38118493908`;
- Node: v22.23.3;
- result: **SUCCESS**;
- all engine tests: **47/47 PASS**.

### Actual 1,000-actor benchmark

Benchmark:
- `engine/benchmarks/scenario-a-1000-benchmark.mjs`;
- CI run `38118493908`, Ubuntu 24.04 / Node v22.23.3.

Compile, 100 iterations:
- mean 0.099 ms;
- median 0.070 ms;
- p95 0.179 ms.

Simulate, 100 iterations:
- mean 0.046 ms;
- median 0.037 ms;
- p95 0.123 ms.

Four actor-state snapshots per batch, 50 iterations:
- mean 2.592 ms/batch;
- median 1.991 ms/batch;
- p95 7.385 ms/batch;
- mean ≈0.648 ms/snapshot.

Observed process-memory deltas in that repeated benchmark:
- compile: heap -203,432 B, RSS +7,516,160 B;
- simulate: heap -137,952 B, RSS +131,072 B;
- actor snapshots: heap +633,984 B, RSS -847,872 B.

These memory numbers are allocator/GC-sensitive process deltas, not peak-memory proofs.

### Scaling bottleneck

Current actor-state derivation performs a naïve actor × (compiled tasks + waits) scan.

1,000-rank A:
- 4 tasks + 1 wait;
- ≈5,000 claim-entry checks/snapshot;
- measured mean ≈0.648 ms/snapshot.

Indicative 200-job B expansion:
- ~401 tasks + ~201 waits;
- ~602,000 checks/snapshot;
- 120.4× A's scan count;
- simple linear timing extrapolation ≈60-80 ms/snapshot.

Indicative 1,000-request C/D expansion with ~3,000 tasks + ~1,000 waits:
- ~4,000,000 checks/snapshot;
- ~800× A's scan count;
- simple linear timing extrapolation ≈0.4-0.5 s/snapshot.

Those are complexity-based estimates, not measured B/C/D benchmarks. Event lookup costs can add overhead.

Conclusion:
- current projection is acceptable for the 1,000-rank compact A demo;
- naïve per-cursor recomputation is likely impractical once expanded task/wait count reaches hundreds/thousands;
- future optimization should index/cache actor projection, not rewrite DES.

No optimization was implemented in Round 4F.

### Promotion scope

**PORT**:
- `engine/design/types.d.ts`;
- `engine/design/compile.mjs`;
- `engine/design/actor-state.mjs`;
- 4-rank timing correction in `engine/examples/qamp-a-actor-regimes.mjs`;
- corresponding small-fixture test correction;
- `engine/examples/qamp-a-1000-demo.mjs`;
- `engine/tests/scenario-a-1000-demo.test.mjs`.

**DEFER**:
- actor-state indexing/precomputed interval/cache optimization;
- generalized selector-query language;
- per-rank heterogeneous expansion;
- actor-selector UI.

**Validation-only / do not PORT**:
- `engine/benchmarks/scenario-a-1000-benchmark.mjs`;
- `.github/workflows/engine-validation.yml` unless Agent F wants permanent branch-lab CI.

Dependencies added/changed: none.  
UI files changed: none.  
Frozen DES interface changes requested: none.

Code/validation checkpoint before handoff docs:
- `5fbc7904be44afb394737447a6cf779aed79c41f`.

Detailed proposal:
- `docs/coordination/proposals/ROUND4F_TUTORIAL_SCALE_A.md`.

**Recommended decision: PORT selector/model/fixture/test changes; DEFER actor-projection optimization. STOP for Agent F review.**
