# Round 4G — indexed actor-state projection and high-scale Scenario-B stress

Status: Agent A checkpoint candidate  
Branch: `agent/engine`  
Frozen DES: **unchanged**

## 1. Problem

Round 4F established that the old post-DES actor projection scales as:

`actors × (compiled task entries + actor-wait entries)`

for every cursor query.

That is acceptable for compact Scenario A (1,000 actors, 4 tasks, 1 wait) but not for public Scenario B/D models with hundreds of concrete task/wait entries.

The semantic reference remains the existing actor projection:
- Working/Blocked/Idle meanings;
- half-open `[start,end)` intervals;
- multiple blocked reasons coalesce;
- Working+Blocked is invalid;
- multiple simultaneous Working claims are invalid;
- actor state remains derived above frozen DES.

## 2. Implementation

New module:

`engine/design/actor-state-index.mjs`

New additive API:

```ts
createActorStateProjector(
  manifest,
  simulationResult
): ActorStateProjector
```

The projector precomputes:

1. DES event time index keyed by event type + task ID;
2. task running-interval index;
3. selected actor participation/wait claim intervals;
4. per-actor half-open state segments;
5. per-group count + blocked-reason summary segments;
6. exact actor transition times.

Existing APIs remain source-compatible:

- `deriveActorStateDetailAt(...)`
- `deriveActorStateAt(...)`
- `deriveActorStateCountsAt(...)`

They now use a WeakMap cache keyed by the CompilationManifest and SimulationResult object identities and delegate to the indexed projector.

New optional APIs:

- `deriveActorGroupSummaryAt(...)`
- `actorStateTransitionTimes(...)`
- direct `ActorStateProjector.summaryAt/detailAt/countsAt`.

### Cache contract

Compilation manifests and simulation results are treated as immutable run evidence after construction.

If a caller intentionally changes actor semantics or simulation evidence, it should provide a new manifest/result object rather than mutate an already-queried object in place.

This matches the existing RunRecord/snapshot architecture.

## 3. Semantic preservation

The test-only semantic oracle is:

`engine/tests/helpers/actor-state-reference.mjs`

It preserves the pre-index implementation.

Optimized/reference comparisons cover:

- 4-rank Scenario A;
- 4-rank Scenario B;
- 1,000-rank Scenario A;
- 1,000-actor / 200-quantum Scenario B stress.

Exact comparisons include:
- actor details;
- group counts;
- blocked-reason counts;
- half-open transition timestamps;
- overlapping `quantum-result` + `global-synchronization` reasons;
- Working+Blocked conflict rejection.

Conflict intervals are indexed but errors remain query-time errors: projector creation itself does not reject an otherwise unqueried conflicting interval.

## 4. Scenario-B high-scale stress fixture

Producer:

`engine/examples/qamp-b-200-stress.mjs`

Scale:
- 1,000 persistent actors;
- 200 preparation task instances;
- 200 serialized QPU task instances;
- 1 full collective;
- 200 submitter result waits;
- 1 global complete-result gate.

Compiled:
- 401 DES tasks;
- 201 actor waits.

Synthetic timing:
- prepare = 1 s;
- each QPU task = 1 s;
- collective = 1 s.

QPU:
- capacity 1;
- max in-flight 1;
- no resource queue buildup;
- serialization uses policy admission scaffolding.

Timeline:
- prepare completes t=1;
- quantum #1 runs [1,2);
- first quantum result at t=2 activates full-group synchronization;
- quantum #200 completes t=201;
- full collective runs [201,202);
- makespan = 202 s.

This fixture is mechanism-grounded in published Scenario B:
- global synchronization wall;
- serial quantum service;
- full useful work resumes only after complete required result set.

The 1,000/200 scale and all numeric times are synthetic prototype stress choices, not performance measurements.

## 5. Exact transition acceptance

Examples:

At t=1:
- 200 Blocked submitters;
- 800 Idle.

At t=2 exactly:
- rank 1's local result wait has ended;
- global synchronization has begun;
- rank 1 reason = `global-synchronization`;
- rank 2 reason = `global-synchronization` + `quantum-result`;
- all 1,000 actors are Blocked.

At t=201 exactly:
- all quantum-result waits and the global gate have ended;
- collective begins;
- all 1,000 actors are Working.

At t=202:
- all actors are Idle.

These boundaries match the reference implementation exactly.

## 6. CI benchmark

Branch CI benchmark run:

- GitHub Actions: `38310735762`
- Ubuntu 24.04
- Node v22.23.3
- B-200 actor count = 1,000
- compiled tasks = 401
- actor waits = 201
- cursor sweep points = 405

Projector internal size:
- actor segments = 3,398
- group summary segments = 202
- indexed DES events = 1,803
- indexed running intervals = 401

### Precompute

12 independent projector builds:

- mean: **14.602 ms**
- median: **13.895 ms**
- p95: **15.639 ms**
- max: **20.568 ms**

This is a one-time run-evidence indexing cost.

### Count query

2,000 queries:

- mean: **0.00203 ms**
- p95: **0.00299 ms**

### Individual detail query

20,000 queries:

- mean: **0.000342 ms**
- p95: **0.000832 ms**

### Existing playback-style detail signature

The current app actor-aware view loops through all 1,000 actor details to build one composition/reason signature.

Full 405-cursor sweep:

- total: **50.842 ms**
- mean/cursor: **0.1250 ms**
- median/cursor: **0.0855 ms**
- p95/cursor: **0.4544 ms**
- max/cursor: **0.6803 ms**

Soft Round-4G target:
- p95 < 30 ms/cursor.

Measured:
- **0.454 ms p95**, approximately 66× below the target.

Therefore the current C playback detail-loop pattern is already interactive after the projector is indexed.

### Direct indexed group-summary signature

Optional new summary API, same 405 cursor points:

- total: **1.557 ms**
- mean/cursor: **0.00371 ms**
- p95/cursor: **0.00378 ms**

C does not need this API for B-200 responsiveness, but it is available if F wants to simplify playback summary construction.

### Reference pre-index summary

Old reference summary scan at t=100.5, 5 measured samples:

- mean: **951.17 ms**
- median: **932.51 ms**
- measured p95 sample: **936.32 ms**
- max: **1,030.81 ms**

The indexed implementation changes the high-scale projection from roughly one second per summary snapshot to sub-millisecond cursor queries after ~15 ms precompute.

## 7. Memory evidence

With `--expose-gc` requested before retained memory snapshots:

Before projector:
- RSS 81,162,240 B
- heap used 5,623,016 B

After retained projector:
- RSS 97,525,760 B
- heap used 6,355,976 B

Retained projector delta:
- RSS: **+16,363,520 B**
- heap used: **+732,960 B**

After cursor sweeps:
- additional RSS: +434,176 B
- additional heap used: +262,504 B

RSS is allocator-dependent and not a peak-memory proof. The retained heap delta is the more useful evidence for this checkpoint: the B-200 index retained less than 1 MB of additional JS heap on the measured runner.

## 8. Playback migration guidance

### Zero-change compatibility path

If F ports:
- `actor-state-index.mjs`;
- the updated `actor-state.mjs`;

existing C calls to `deriveActorStateDetailAt` and `deriveActorStateCountsAt` automatically reuse a cached projector.

No playback source rewrite is required to obtain the measured B-200 detail-loop performance.

### Optional faster summary path

C may later replace its per-actor summary loop with:

`deriveActorGroupSummaryAt(...)`

or retain a projector and call:

`projector.summaryAt(...)`.

This is optional. It is not required for the current B-200 soft performance target.

## 9. Scenario-D actor admission gap

The current actor-wait event vocabulary is:

- `ready`
- `started`
- `completed`

This cannot exactly express the desired Scenario-D state:

- 1 QPU job Running;
- 49 QPU jobs resource-Queued;
- those 50 admitted submitter actors Blocked;
- ~950 dependency-ready but policy-held actors Idle.

Why:

### Activation = `ready`

All 1,000 quantum tasks become ready before admission control selects the first 50.

A one-per-instance result wait activated by `ready` therefore marks all 1,000 actors Blocked, including the 950 policy-held actors.

### Activation = `started`

Only the single currently running QPU task has emitted `task_started`.

That marks 1 actor Blocked, but misses the 49 actors whose jobs are admitted and resource-queued.

### Activation = `completed`

Too late to describe waiting.

Therefore the actor projection lacks an above-DES **admission boundary**.

### Smallest proposed extension — NOT implemented in Round 4G

Add one allowed actor-wait boundary event:

```ts
type ActorWaitTaskEvent =
  | "ready"
  | "queued"
  | "started"
  | "completed";
```

Compiler mapping:

`"queued" -> existing DES "task_queued" event`.

No DES change is required.

Under frozen v1 semantics:
- `task_queued` is emitted when a QPU task is admitted into the running + resource-queued in-flight set;
- policy-held ready tasks do not emit `task_queued` until later admission.

A D actor wait:

`activation = queued; release = completed; selection = one-per-instance`

would therefore mark:
- running actor + resource-queued actors Blocked;
- policy-held actors Idle.

No `task_throttled` actor wait should be added for this interpretation, because policy-held actors are intentionally Idle.

### Affected higher-level interfaces if F accepts later

- `ActorWaitTaskEvent`;
- `CompiledActorWaitEventType`;
- compiler event mapping.

Unaffected:
- `WorkflowSpec`;
- `SimulationResult`;
- DES events (already include `task_queued`);
- scheduling/metrics.

This is a concrete representational gap proposal only. Round 4G does **not** implement it.

## 10. Promotion recommendation

### PORT

- `engine/design/actor-state-index.mjs`
- updated `engine/design/actor-state.mjs`
- actor projector type additions in `engine/design/types.d.ts`
- `engine/examples/qamp-b-200-stress.mjs`
- `engine/tests/actor-state-index.test.mjs`

### Validation/reference only

- `engine/tests/helpers/actor-state-reference.mjs`
- `engine/benchmarks/actor-projector-b200-benchmark.mjs`
- branch-only CI benchmark step

### DEFER pending F decision

- Scenario-D `queued` actor-wait trigger proposal
- playback source migration to direct group-summary API

### No change

- frozen DES
- engine metrics/order
- WorkflowSpec/SimulationResult
- UI/playback source
- dependencies
