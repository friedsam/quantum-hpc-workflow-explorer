# Round 4H — queued actor-wait admission boundary for Scenario D

Status: Agent A checkpoint candidate  
Branch: `agent/engine`  
Coordinator decision: D017  
Frozen DES: **unchanged**

## 1. Accepted bounded change

Round 4H adds exactly one high-level actor-wait boundary event:

```ts
type ActorWaitTaskEvent =
  | "ready"
  | "queued"
  | "started"
  | "completed";
```

Compiler mapping:

```
queued -> task_queued
```

The DES already emitted `task_queued`; no DES event, scheduler, QPU queue rule, resource accounting, or SimulationResult shape changed.

The compiled actor-wait event union gains only:

```
task_queued
```

No generalized admission ontology was added.

## 2. Why queued is the correct D boundary

For frozen-v1 QPU policy semantics:

- `task_ready` means dependencies are satisfied;
- `task_queued` means the task has been admitted into the QPU in-flight set;
- admitted in-flight work is either running or resource-queued;
- a dependency-ready task held by `maxInFlightQuantumByPool` has no `task_queued` event yet.

Therefore an actor wait authored as:

```
activation: quantum queued
release: quantum completed
```

means:

> Block the submitting actor only after that actor's quantum job is admitted; keep policy-held demand Idle until admission.

`task_queued` is admission evidence. It does **not** mean that the task is currently running.

## 3. Deterministic D1000 stress fixture

Test-only producer:

`engine/tests/fixtures/qamp-d-1000-stress.mjs`

Scale:
- 1,000 persistent MPI-rank actors;
- 1,000 preparation instances;
- 1,000 QPU request instances;
- 1,000 local continuation instances;
- 3,000 compiled DES tasks;
- 1,000 actor waits.

Resources:
- CPU capacity = 1,000;
- QPU capacity = 1.

Policy:
- release-aware classical allocation;
- `maxInFlightQuantumByPool.qpu = 50`.

Synthetic task times:
- prepare = 1 s;
- QPU service = 1 s;
- local continuation = 0.5 s.

No global synchronization gate exists.

The published scenario framing calls D **Throttled Execution** and explains it as rate limiting required without synchronization, dominated by serial service capacity. It distinguishes QPU Queue from QPU Run, and defines a Blocked HPC rank as one waiting for its own submitted quantum result. The fixture preserves that mechanism rather than inventing a synchronization wall.

## 4. Authored actor lifecycle

Preparation:
- one-per-instance actor participation;
- all 1,000 actors Working over [0,1).

Quantum:
- no actor task participation;
- one-per-instance actor wait:
  - activation = matching quantum task `queued`;
  - release = matching quantum task `completed`;
  - reason = `admitted-quantum-result`.

Continuation:
- one-per-instance Working participation for 0.5 s after each quantum result.

This keeps task participation distinct from waiting.

## 5. Initial admission boundary

At t=1 exactly:

- all preparations have ended;
- quantum #1 emits `task_queued` and then `task_started` at the same timestamp;
- quantum #2…#50 are admitted and resource-queued;
- quantum #51…#1000 are dependency-ready but policy-held.

QPU state:
- Running = 1;
- resource Queue = 49;
- policy-held = 950.

Actor state:
- Working = 0;
- Blocked = 50;
- Idle = 950.

This is the exact Round-4H acceptance target.

## 6. Zero-width immediate queue/start semantics

Quantum #1 has:

```
task_queued @ t=1
task_started @ t=1
```

and no positive-width DES `queued` TaskInterval.

Its actor wait is still:

```
[task_queued, task_completed) = [1,2)
```

Therefore rank 1 is Blocked at t=1 and t=1.5.

This is intentional: actor admission waiting is keyed from admission, not from positive resource-queue residence.

## 7. Slot replenishment

At t=2 exactly:

- quantum #1 completes;
- rank 1's wait ends;
- local continuation #1 starts;
- quantum #2 moves from resource queue to Run;
- quantum #51 becomes newly admitted and emits `task_queued`.

QPU:
- Run = 1;
- resource Queue = 49;
- policy-held = 949.

Actors:
- Working = 1;
- Blocked = 50;
- Idle = 949.

At t=2.25:
- same actor composition.

At t=2.5:
- rank 1 continuation ends;
- Blocked remains 50;
- Idle returns to 950.

No Working+Blocked collision occurs.

## 8. End-to-end lifecycle

The accepted `queued -> completed` lifecycle is sufficient to represent the requested D actor semantics all the way through completion.

Last QPU task:
- completes at t=1001.

At t=1001:
- Working = 1;
- Blocked = 0;
- Idle = 999.

At t=1001.25:
- same.

At makespan t=1001.5:
- Working = 0;
- Blocked = 0;
- Idle = 1000.

No fabricated rank identity or temporal counter is required.

## 9. Semantic oracle compatibility

The indexed projector and the pre-index reference implementation agree for selected actors across:

- preparation;
- initial admission;
- immediate queued/start boundary;
- first replenishment;
- middle execution;
- late admission;
- final completion;
- makespan.

Existing Round-4G projector equivalence tests, small Scenario B actor tests, and small Scenario D tests remain in the full engine suite.

## 10. Node-22 CI evidence

GitHub Actions run:

- `38321518049`
- Node v22.23.3
- **63/63 tests PASS**

D benchmark:

`engine/benchmarks/scenario-d-admission-benchmark.mjs`

### Compile — 3 samples

- mean: **76.81 ms**
- median: **66.92 ms**
- max: **100.92 ms**

### Simulate — 3 samples

- mean: **268.27 ms**
- median: **261.85 ms**
- max: **286.78 ms**

### Actor projector build — 5 samples

- mean: **89.77 ms**
- median: **79.70 ms**
- p95 sampled value: **104.31 ms**
- max: **108.27 ms**

Indexed projector structure:
- actor segments = 4,949;
- group summary segments = 2,001;
- indexed event entries = 12,950;
- indexed running intervals = 3,000.

### Count query — 5,000 samples

- mean: **0.00206 ms**
- p95: **0.00284 ms**

### Detail query — 20,000 samples

- mean: **0.000260 ms**
- p95: **0.000541 ms**

### Full transition-summary sweep

Transition cursor count:
- 2,002.

Full sweep:
- total = **3.239 ms**;
- mean/cursor = **0.00147 ms**;
- p95/cursor = **0.00169 ms**;
- max/cursor = **0.03296 ms**.

The one-time projector build is the dominant actor-projection cost. Cursor queries remain effectively negligible after indexing.

## 11. Memory evidence

With `--expose-gc` requested before retained snapshots:

Before projector:
- RSS = 134,742,016 B;
- heap used = 18,302,576 B.

After retained projector:
- RSS = 134,815,744 B;
- heap used = 19,931,240 B.

Retained projector delta:
- RSS = **+73,728 B**;
- heap used = **+1,628,664 B**.

After transition sweep:
- additional RSS = +36,864 B;
- additional heap used = +227,336 B.

RSS is allocator-dependent; these are retained-process observations rather than peak-memory guarantees.

## 12. Migration notes for F/C

Affected higher-level type:

```ts
ActorWaitTaskEvent
```

adds:
- `"queued"`.

Affected compiled type:

```ts
CompiledActorWaitEventType
```

adds:
- `"task_queued"`.

Compiler:
- accepts authored `queued`;
- maps to existing DES `task_queued`.

Actor-state projector:
- no semantic extension required;
- event indexing already accepts compiled event-type strings.

No `.d.mts` files exist under the engine lab tree; the engine source-of-truth declaration is `engine/design/types.d.ts`. When F ports to the app, the app's mirrored `.d.mts`/TypeScript declarations must receive the same additive union case.

No persisted schema-version bump is required for this additive optional event value, subject to Agent-F integration policy.

## 13. Limits

This checkpoint does not add:
- actor admission counters;
- a generalized policy-event ontology;
- provider-queue semantics;
- DES event types;
- QPU scheduling changes;
- actor state for tasks without explicit authored actor identity/waits;
- UI or playback changes.

The semantics depend on frozen-v1 behavior that `task_queued` denotes admission to the QPU in-flight set. If future scheduling changes that meaning, the actor boundary must be revalidated.

## 14. Promotion recommendation

### PORT

- `engine/design/types.d.ts`
- `engine/design/compile.mjs`

### Test/reference PORT as useful for integration validation

- `engine/tests/fixtures/qamp-d-1000-stress.mjs`
- `engine/tests/scenario-d-admission.test.mjs`

### Validation-only

- `engine/benchmarks/scenario-d-admission-benchmark.mjs`
- branch-lab CI benchmark step

### No change

- frozen DES;
- `WorkflowSpec`;
- `SimulationResult`;
- QPU scheduling;
- UI/playback source;
- third-party dependencies.
