# Round 4F — tutorial-scale Scenario A and scalable actor selectors

Status: Agent A checkpoint candidate  
Branch: `agent/engine`  
Decision basis: D012 on `agent/integration`  
Frozen DES: **unchanged**

## 1. Compact scalable actor selectors

Round 4F adds two bounded symbolic selector variants above frozen DES:

```ts
type ActorParticipationSelection =
  | { kind: "all" }
  | { kind: "one-per-instance" }
  | { kind: "ordinals"; actorOrdinals: number[] }
  | {
      kind: "range";
      startActorOrdinal: number;
      endActorOrdinal: number;
    }
  | {
      kind: "all-except";
      actorOrdinals: number[];
    };
```

### Why these two

`range(start,end)` expresses a large contiguous subset in O(1) model size.

`all-except(actorOrdinals)` expresses a large complementary set without listing hundreds/thousands of actor IDs.

This is enough for the tutorial-scale demos currently anticipated:
- first N submitting actors can still use `one-per-instance`;
- contiguous complementary groups can use `range`;
- "all ranks except one/few submitters" can use `all-except`.

No general selector language, boolean expression language, tags, or dynamic predicates were added.

### Validation

`range`:
- start/end must be positive integers;
- start <= end;
- end <= actor-group count.

`all-except`:
- exclusion list must be non-empty;
- ordinals must be unique positive integers;
- every exclusion must be <= actor-group count.

Existing `all`, `one-per-instance`, and `ordinals` behavior is unchanged.

### Manifest behavior

Selectors remain symbolic in the `CompilationManifest`.

Example for the 1,000-rank background:

```json
{
  "kind": "all-except",
  "actorOrdinals": [1]
}
```

The compiler does **not** materialize ranks 2…1000 as 999 identifiers.

## 2. Migration contract

Affected higher-level types:
- `ActorParticipationSelection`;
- compiled task actor-assignment selection;
- compiled actor-wait selection.

Affected consumers:
- design/compiler validation;
- actor-state projection;
- future UI/serialization code that exhaustively switches on selector kind.

Not affected:
- `WorkflowSpec`;
- `SimulationResult`;
- frozen DES scheduling/events/metrics;
- existing persisted designs using older selector kinds.

`schemaVersion: 1` remains unchanged for this prototype because the new selector variants are additive and old v1 objects remain valid. A consumer with an exhaustive selector switch must add `range` and `all-except` before consuming a producer using them.

## 3. Separate 1,000-rank Scenario-A demo

Producer:

`engine/examples/qamp-a-1000-demo.mjs`

This is independent of the 4-rank regression fixture.

### Actor and logical model

Persistent actor group:
- `ranks = 1000`.

Authored logical tasks:
1. `classical-background`;
2. `submit`;
3. `quantum`;
4. `local-resume`.

Compiled DES task count:
- **4**, not 1,000.

Actor selections:
- background: `all-except([1])` = ranks 2–1000;
- submit/local-resume/result-wait: `range(1,1)`;
- QPU task: no actor participation.

There is no full-group result gate.

### Resource model

CPU capacity:
- 1000 modeled units.

Background task:
- `resourceCount = 999`.

Submit/local resume:
- `resourceCount = 1`.

QPU:
- capacity 1;
- one local request;
- no admission/throttling limit.

The single 999-unit background task is an **aggregate approximation** representing concurrent useful work by ranks 2–1000. It is not 999 independent DES tasks and does not claim per-rank heterogeneous timing.

This preserves the distinction between:
- actor count = 1000;
- logical task count = 4;
- logical multiplicity = 1 for each task;
- per-task resource demand = 999/1/1/1 units as configured.

## 4. Synthetic timing and strict critical path

All times are explicitly synthetic.

Baseline:
- background = 10 s;
- submit = 1 s;
- QPU service = 2 s;
- resumed local classical work = 5 s.

Local branch:

`1 + 2 + 5 = 8 s`.

Independent background:

`10 s`.

Therefore the quantum-dependent branch finishes **strictly before** overall makespan:

`8 < 10`.

The accepted 4-rank regression baseline is corrected the same way:
- background now 10 s;
- local branch remains 8 s;
- restored-equilibrium interval through t=7 is preserved.

## 5. Deterministic 1,000-rank acceptance

Expected and tested:

At t=0.5:
- Working 1000;
- Blocked 0;
- Idle 0.

At t=1.5:
- Working 999;
- Blocked 1;
- Idle 0.

At t=4:
- Working 1000;
- Blocked 0;
- Idle 0;
- QPU idle.

At t=7:
- Working 1000;
- Blocked 0;
- Idle 0;
- QPU idle.

Other invariants:
- QPU resource queue wait = 0;
- QPU admission wait = 0;
- no `maxInFlightQuantumByPool` baseline policy;
- no global synchronization wait;
- local branch completes at t=8;
- makespan/background complete at t=10.

The published tutorial describes Scenario A as individual-rank quantum requests with locally consumed results, no global quantum-state dependency, a single-lane QPU, no required admission control, and restored classical work after the result returns. This producer preserves those semantics while scaling the actor count compactly.

## 6. Compactness evidence

Exact current branch serialization sizes, measured as JSON string characters:

- `WorkflowDesign`: 2,202;
- `RunConfiguration`: 693;
- `SystemProfile`: 1,176;
- compiled `WorkflowSpec`: 3,900;
- `CompilationManifest`: 2,847.

Actor count:
- 1,000.

Compiled task count:
- 4.

The background selector stored in the manifest is only:

`{ kind: "all-except", actorOrdinals: [1] }`.

## 7. Node-22 CI / performance evidence

Branch workflow:

`.github/workflows/engine-validation.yml`

Run:
- GitHub Actions run `38118493908`;
- Ubuntu 24.04;
- Node `v22.23.3`;
- conclusion: **SUCCESS**.

All engine tests:
- **47/47 PASS**;
- total Node test duration ≈230.6 ms.

Benchmark script:

`engine/benchmarks/scenario-a-1000-benchmark.mjs`

1000-rank demo results on that runner:

### Compile — 100 iterations

- mean: **0.099 ms**;
- median: **0.070 ms**;
- p95: **0.179 ms**.

### Simulate — 100 iterations

- mean: **0.046 ms**;
- median: **0.037 ms**;
- p95: **0.123 ms**.

### Actor-state batch — four snapshots, 50 iterations

Snapshots per batch:
- t = 0.5, 1.5, 4, 7.

- mean: **2.592 ms / four snapshots**;
- median: **1.991 ms / four snapshots**;
- p95: **7.385 ms / four snapshots**.

Approximate mean per snapshot:
- **0.648 ms**.

### Memory observations

The same repeated-process benchmark observed:

Compile stage:
- heap delta: -203,432 bytes;
- RSS delta: +7,516,160 bytes.

Simulation stage:
- heap delta: -137,952 bytes;
- RSS delta: +131,072 bytes.

Actor-snapshot stage:
- heap delta: +633,984 bytes;
- RSS delta: -847,872 bytes.

These memory deltas are **not peak-memory proofs**. They are process snapshots around repeated operations and are visibly affected by garbage collection / allocator behavior (including negative deltas). The compact JSON/compiled-task evidence above is the more stable structural memory/scaling signal for this checkpoint.

## 8. Actor-state scaling bottleneck

Current actor-state derivation is intentionally simple:

`deriveActorStateCountsAt`
- loops over every actor;
- for each actor, scans every compiled task manifest entry;
- then scans every actor-wait entry.

For the 1,000-rank A demo:

- actors = 1,000;
- compiled tasks = 4;
- compiled waits = 1;
- top-level claim-entry checks ≈ `1000 × (4 + 1) = 5,000` per snapshot.

The measured mean is ~0.648 ms/snapshot on the CI runner.

### Likely 200-QPU-job B scale

A plausible compact B expansion with:
- 200 prepare instances;
- 200 quantum instances;
- 1 collective;
- 200 submitter waits;
- 1 global gate;

would have about:
- 401 task entries;
- 201 wait entries;
- 602 entries scanned per actor.

At 1,000 actors:

`1000 × 602 = 602,000` top-level checks/snapshot.

That is **120.4×** the 1,000-rank A check count.

A simple linear extrapolation from the measured A mean gives roughly:
- **~78 ms/snapshot**.

This is an estimate, not a benchmark; event-list lookup and different participation density can make actual cost differ. It is already above a 16.7 ms 60-fps frame budget.

### Likely 1,000-request C/D scale

If a future expanded model contains approximately:
- 3,000 request-related tasks;
- 1,000 actor waits;

then:

`1000 × 4000 = 4,000,000` claim-entry checks/snapshot.

That is ~800× the A demo scan count.

Simple linear extrapolation from the current mean is roughly:
- **~0.52 s/snapshot**.

Again, this is a complexity-based estimate, not a measured C/D benchmark.

### Conclusion

For the 1,000-rank Scenario-A demo, current actor derivation is fast enough.

For hundreds/thousands of expanded request tasks, recomputing actor counts from scratch at every playback cursor update is **likely impractical**.

The likely future optimization boundary is the actor projection layer, not the frozen DES:
- actor-indexed task/wait lists;
- precomputed actor-state intervals/count transitions;
- snapshot caching.

No such optimization is implemented in Round 4F.

## 9. Validation

New focused test:

`engine/tests/scenario-a-1000-demo.test.mjs`

Coverage:
- compact symbolic selector preservation;
- actor/task/resource-count separation;
- exact 1,000-rank snapshots;
- queue/admission = zero;
- no global gate;
- strict off-critical-path result;
- range validation;
- all-except validation.

Existing regressions preserved:
- Round-4D Scenario-A regime suite: 7/7;
- Round-4A actor suite: 6/6;
- Round-2C compiler suite: 7/7;
- engine/QAMP invariant suites also pass in branch CI.

Branch CI:
- **47/47 tests passed**.

## 10. Promotion recommendation

### PORT

Port:
- selector type additions;
- selector compiler validation/preservation;
- selector actor-state evaluation;
- corrected 4-rank background timing;
- separate 1,000-rank A producer;
- focused tests.

### DEFER

Defer:
- actor-state indexing/caching optimization;
- range/complement authoring UI;
- generalized arbitrary actor predicates;
- per-rank heterogeneous DES tasks.

### REIMPLEMENT

No DES reimplementation is needed.

Frozen DES remains unchanged.
