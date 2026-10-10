# Round 4A — logical multiplicity and persistent actor state

Status: Agent A checkpoint candidate  
Branch: `agent/engine`  
Frozen DES: **unchanged**

## Goal

Add the smallest higher-level model needed to represent:

- compact logical task multiplicity;
- optional persistent MPI-rank/worker groups;
- stable actor participation across CPU -> QPU -> CPU stages;
- derivable logical actor `Working / Blocked / Idle` state;
- compilation to the existing frozen concrete `WorkflowSpec`.

This is an authored-model/compiler/explanation layer only.

## 1. Three counts remain distinct

The model intentionally separates:

1. **task multiplicity** — how many concrete task instances one logical authored task represents;
2. **actor count** — how many persistent logical actors exist in an actor group;
3. **resourceCount** — how many units of the task's configured resource pool each concrete DES task instance consumes.

They may have different values.

Scenario B acceptance example:

- authored logical tasks = 3: `prepare`, `quantum`, `collective`;
- `prepare.multiplicity = 2`;
- `quantum.multiplicity = 2`;
- `collective.multiplicity = 1`;
- persistent actor group `ranks` count = 4;
- per-instance `resourceCount` = 1 for prepare, 1 QPU lane for quantum, 4 CPU units for the full collective;
- compiled DES tasks = 5, not one node per rank.

## 2. Logical task multiplicity

Additive optional design field:

```ts
interface DesignTask {
  // existing fields...
  multiplicity?: number; // default 1
}
```

Compilation:

- multiplicity 1 preserves the stable task ID;
- multiplicity N > 1 produces deterministic concrete IDs:
  `taskId#1 ... taskId#N`;
- task resource binding is still authored once by stable design task ID;
- every concrete instance receives the same configured `resourceCount`;
- multiplicity does not imply actor count or resource scaling.

### Dependency instance mapping

```ts
interface DesignDependency {
  // existing fields...
  instanceMapping?: "pairwise" | "all-to-all";
}
```

Rules:

- equal source/target multiplicity defaults to `pairwise`;
- unequal multiplicities require an explicit mapping;
- `pairwise` requires equal multiplicities;
- `all-to-all` emits every source-instance -> target-instance edge.

Scenario B:

- `prepare -> quantum`: pairwise;
- `quantum -> collective`: all-to-all, so the one collective task depends on both quantum results.

This makes the synchronization wall a normal DAG fan-in, not a special barrier state.

## 3. Persistent actor groups

```ts
type ActorGroupKind = "mpi-rank" | "worker" | "logical";

interface ActorGroup {
  id: string;
  label: string;
  kind?: ActorGroupKind;
}

interface RunConfiguration {
  // existing fields...
  actorGroupCounts?: Record<string, number>;
}
```

A design actor group defines stable identity; the run configuration supplies the persistent group count.

For any design that declares actor groups, Round 4A compilation requires a positive count for each group.

Actor groups are not resources:

- actor group count does not set CPU/GPU/QPU capacity;
- actor count does not set task `resourceCount`;
- actors are not emitted as DES task nodes.

### External terminology check

MPI 4.1 defines an MPI process through group/rank identity and defines collective participation through communicator groups. This supports treating persistent ranks as logical participant identities separate from hardware resource allocation:

- MPI Forum 4.1, Message Envelope: https://www.mpi-forum.org/docs/mpi-4.1/mpi41-report/node58.htm
- MPI Forum 4.1, Intra-Communicators: https://www.mpi-forum.org/docs/mpi-4.1/mpi41-report/node180.htm

MPI also explicitly notes that collective completion does not necessarily imply that all other participants have completed or started. Therefore this project does **not** equate "MPI collective" with an automatic global barrier. Scenario B's barrier-like behavior comes from explicit DAG dependencies.

## 4. Actor participation

New optional task-level semantics:

```ts
interface ActorParticipation {
  actorGroupId: string;
  selection:
    | { kind: "all" }
    | { kind: "one-per-instance" };
  stateDuringTask: "working" | "blocked";
}
```

### Selection semantics

`all`:
- every persistent actor in the referenced group participates in every concrete task instance.

`one-per-instance`:
- logical task instance ordinal i maps deterministically to actor ordinal i;
- task multiplicity must not exceed actor-group count.

This preserves actor identity across multiple logical stages without creating rank nodes.

Scenario B:

- `prepare#1` and `quantum#1` both map to rank 1;
- `prepare#2` and `quantum#2` both map to rank 2;
- the collective maps to all four ranks.

## 5. Compilation manifest

The existing Round 2C manifest remains the authored-to-concrete traceability surface.

Task entries now additionally retain:

- logical multiplicity;
- logical instance ordinal;
- compact actor assignment(s).

Actor assignments are compact:

```ts
{
  actorGroupId: "ranks",
  selection: { kind: "one", actorOrdinal: 2 },
  stateDuringTask: "blocked"
}
```

or:

```ts
{
  actorGroupId: "ranks",
  selection: { kind: "all" },
  stateDuringTask: "working"
}
```

The manifest also stores actor-group count/kind and dependency source/target logical ordinals.

No generated-ID parsing is required downstream.

## 6. Actor state derivation

Reference implementation:

`engine/design/actor-state.mjs`

Exports:

- `deriveActorStateAt(...)`;
- `deriveActorStateCountsAt(...)`.

The derivation uses only:

- compilation manifest actor assignments;
- exact frozen DES events/task intervals;
- simulation time.

### State semantics

For an explicitly participating actor:

**Working**
- actor assignment says `stateDuringTask: "working"`;
- state is Working only over the concrete task's running half-open interval.

**Blocked**
- actor assignment says `stateDuringTask: "blocked"`;
- state is Blocked from `task_ready` until `task_completed`;
- therefore policy wait, resource queue wait and execution of that blocking task remain one actor-level blocked episode.

**Idle**
- no active Working or Blocked claim at that time.

If one persistent actor receives overlapping active participation claims, derivation throws instead of inventing precedence.

These are higher-level logical actor states. They do not modify DES task/resource/queue states.

## 7. Scenario B acceptance fixture

Executable example:

`engine/examples/qamp-b-actor-model.mjs`

### Compact authored model

Persistent actor group:
- `ranks`: four logical MPI ranks.

Logical DAG:

```
prepare x2  ->  quantum x2  ->  collective x1
   pairwise        all-to-one fan-in
```

Resources/config:
- CPU capacity/reservation = 4;
- QPU capacity = 1;
- QPU max in-flight = 2;
- prepare resourceCount = 1 per instance;
- quantum resourceCount = 1 per instance;
- collective resourceCount = 4.

Synthetic times:
- prepare = 1 s;
- quantum = 3 s each;
- collective = 1 s.

### Compiled DES behavior

- prepare #1/#2 start at t=0;
- quantum #1 starts t=1;
- quantum #2 is serialized and starts t=4;
- collective waits for both results and starts t=7;
- makespan = 8 s;
- QPU queue wait = 3 s;
- admission wait = 0.

### Derived actor state counts

At t=0.5:
- Working 2;
- Blocked 0;
- Idle 2.

At t=2:
- Working 0;
- Blocked 2;
- Idle 2.

At t=5:
- Working 0;
- Blocked 1;
- Idle 3.

At t=7.5:
- Working 4;
- Blocked 0;
- Idle 0.

This demonstrates persistent actor identity across prepare/QPU/collective stages without rendering or simulating four rank nodes.

## 8. Frozen DES boundary

No changes to:

- `WorkflowSpec`;
- `SimulationResult`;
- scheduling;
- queue semantics;
- resource accounting;
- communication semantics;
- engine events.

Logical multiplicity is expanded before DES. Actor state is derived after DES.

## 9. Deliberate Round 4A limits

Not implemented:

- arbitrary actor subsets/ranges beyond `all` and deterministic one-per-instance;
- overlapping actor participation;
- actor migration/rebinding during a task;
- nested/overlapping MPI communicator semantics;
- actor-level message traffic;
- provider queues;
- optimizer;
- UI;
- one task/node per rank.

Logical multiplicity > 1 inside a bounded `repeatBlock` is explicitly rejected in Round 4A; composing both expansion dimensions is deferred until a concrete case requires it.

## 10. Validation

Focused files:

- `engine/tests/actor-model.test.mjs`
- existing `engine/tests/design-compile.test.mjs`

Round 4A actor acceptance: **4/4 passed**.  
Round 2C compiler regression after additive manifest changes: **7/7 passed**.

Tests cover:

- task multiplicity / actor count / resourceCount distinction;
- pairwise and fan-in dependency compilation;
- persistent actor assignments across CPU/QPU/CPU;
- serialized QPU behavior and complete-result collective dependency;
- derivable Working/Blocked/Idle counts;
- existing repeat/provenance/compiler behavior remains intact.

## Recommendation

**PORT** the additive design/compiler/actor-derivation layer. Keep frozen DES unchanged.
