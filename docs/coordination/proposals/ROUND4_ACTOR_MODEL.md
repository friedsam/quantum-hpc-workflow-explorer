# Round 4A — logical multiplicity, actor participation, and wait gates

Status: Agent A repaired checkpoint candidate  
Branch: `agent/engine`  
Frozen DES: **unchanged**

## Goal

Represent compact logical task multiplicity and persistent logical actors above the frozen DES while keeping:

- task multiplicity;
- actor count;
- per-instance `resourceCount`;

strictly distinct.

Scenario B is the acceptance case:
- a subset prepares/submits;
- submitters block waiting for quantum results;
- a later synchronization gate blocks the full actor group on the complete result set;
- full collective work resumes afterward;
- quantum execution is serialized without QPU resource-queue buildup.

## 1. Logical task multiplicity

Optional higher-level design field:

```ts
interface DesignTask {
  id: string;
  label: string;
  multiplicity?: number; // default 1
  // ...
}
```

Compilation:
- multiplicity 1 preserves the stable task ID;
- multiplicity N emits deterministic concrete IDs `taskId#1 ... taskId#N`;
- one task resource binding applies to each concrete instance;
- `resourceCount` remains per concrete DES task instance.

Logical multiplicity does not imply actor count or resource scaling.

### Dependency instance mapping

```ts
interface DesignDependency {
  // ...
  instanceMapping?: "pairwise" | "all-to-all";
}
```

Rules:
- equal multiplicities default to pairwise;
- unequal multiplicities require an explicit mapping;
- pairwise requires equal multiplicities;
- all-to-all emits each source-instance -> target-instance edge.

Scenario B:
- `prepare -> quantum`: pairwise;
- `quantum -> collective`: all-to-all.

The collective therefore remains a normal DAG fan-in requiring the complete quantum result set.

## 2. Persistent actor groups

```ts
type ActorGroupKind = "mpi-rank" | "worker" | "logical";

interface ActorGroup {
  id: string;
  label: string;
  kind?: ActorGroupKind;
}

interface RunConfiguration {
  // ...
  actorGroupCounts?: Record<string, number>;
}
```

Actor groups provide stable logical identity. They are not DES resources:

- actor count does not set CPU/GPU/QPU capacity;
- actor count does not set task `resourceCount`;
- actors are not emitted as WorkflowSpec task nodes.

A positive run-time count is required for each declared persistent actor group.

## 3. Task participation

Optional task participation is explicit:

```ts
interface ActorParticipation {
  actorGroupId: string;
  selection:
    | { kind: "all" }
    | { kind: "one-per-instance" }
    | { kind: "ordinals"; actorOrdinals: number[] }; // Round 4D additive extension
  stateDuringTask: "working" | "blocked";
}
```

Round 4A Scenario B uses task participation only for actual actor work. Round 4D adds explicit ordinal-set selection for bounded actor subsets without rank nodes:

- `prepare#1/#2` -> ranks 1/2 Working;
- `quantum#1/#2` -> no actor participation; the QPU produces results while submitters wait;
- `collective` -> all four ranks Working.

This corrects the rejected interpretation in which a submitting rank was modeled as participating in the QPU task merely because it was blocked on that result.

## 4. Actor wait / gate claims

Dependency waiting is separate from task participation:

```ts
interface ActorWaitClaim {
  id: string;
  actorGroupId: string;
  selection:
    | { kind: "all" }
    | { kind: "one-per-instance" };
  activation: ActorWaitTaskEventCondition;
  release: ActorWaitTaskEventCondition;
  reason: string;
}

interface ActorWaitTaskEventCondition {
  kind: "task-event";
  taskId: string;
  event: "ready" | "started" | "completed";
  instance:
    | "matching-instance"
    | "any-instance"
    | "all-instances";
}
```

### One-per-instance waits

Used when persistent actor i waits on logical instance i.

Required:
- activation and release both use `matching-instance`;
- activation/release task multiplicities are equal;
- multiplicity does not exceed actor-group count.

Scenario B submitter wait:
- rank i activates `quantum-result` wait when `prepare#i` completes;
- rank i releases it when `quantum#i` completes.

### All-actor gates

Used for group-wide dependency/synchronization waits.

Scenario B global gate:
- all ranks activate `global-synchronization` when **any** serialized quantum result completes;
- all ranks release only when **all** quantum results complete.

This creates a real all-ranks blocked interval before the collective begins without inventing a DES barrier state.

## 5. Compilation manifest

The Round 2C `CompilationManifest` remains the traceability surface.

Task entries retain:
- stable design task ID;
- logical multiplicity;
- logical instance ordinal;
- repeat identity if applicable;
- timing key/provenance;
- compact actor participation assignments.

Dependency entries retain logical instance ordinals.

New `actorWaits` entries retain:
- stable authored wait ID;
- actor group;
- concrete actor selection;
- compiled activation/release event boundaries;
- reason.

Example compiled submitter wait:

```ts
{
  designWaitId: "submitter-result-wait",
  actorGroupId: "ranks",
  selection: { kind: "one", actorOrdinal: 2 },
  activation: {
    eventType: "task_completed",
    taskIds: ["prepare#2"],
    quantifier: "all"
  },
  release: {
    eventType: "task_completed",
    taskIds: ["quantum#2"],
    quantifier: "all"
  },
  reason: "quantum-result"
}
```

Downstream code never needs to reverse-engineer generated IDs.

## 6. Actor-state derivation

Reference implementation:

`engine/design/actor-state.mjs`

Exports:
- `deriveActorStateDetailAt(...)`;
- `deriveActorStateAt(...)`;
- `deriveActorStateCountsAt(...)`.

State is a post-DES explanatory projection.

### Working

An actor has an active task-participation claim marked `working`, and that concrete task is running.

### Blocked

An actor has one or more active blocked claims:
- a task-participation claim explicitly marked blocked; or
- an actor wait/gate claim whose activation boundary has occurred and release boundary has not.

Multiple blocked claims **coalesce** into one top-level Blocked state while preserving distinct reasons.

Example at Scenario B t=5:
- rank 1: `global-synchronization`;
- rank 2: `global-synchronization` + `quantum-result`;
- ranks 3/4: `global-synchronization`.

### Idle

No active Working or Blocked claim.

### Conflict rule

- multiple blocked claims are allowed;
- Working + Blocked overlap remains an error;
- multiple simultaneous Working participation claims remain an error.

No precedence rule is invented.

## 7. Scenario B acceptance fixture

Executable example:

`engine/examples/qamp-b-actor-model.mjs`

### Compact authored model

Persistent logical actor group:
- `ranks`: 4.

Authored tasks:
- `prepare` multiplicity 2;
- `quantum` multiplicity 2;
- `collective` multiplicity 1.

Compiled WorkflowSpec tasks:
- `prepare#1`;
- `prepare#2`;
- `quantum#1`;
- `quantum#2`;
- `collective`.

Resources:
- CPU capacity/reservation 4;
- QPU capacity 1;
- QPU max-in-flight 1;
- prepare resourceCount 1;
- quantum resourceCount 1;
- collective resourceCount 4.

Synthetic service times:
- prepare 1 s;
- each quantum evaluation 3 s;
- collective 1 s.

### Serialized quantum phase

Both quantum tasks become dependency-ready after preparation, but only one is admitted at a time:

- quantum #1 starts t=1;
- quantum #2 is policy-held and starts t=4;
- QPU **resource queue wait = 0**;
- QPU admission wait = 3 s.

Thus queue buildup is suppressed and is not the Scenario-B mechanism.

### Complete-result synchronization

- quantum #1 completes t=4;
- global synchronization wait activates for all four ranks;
- quantum #2 completes t=7;
- global gate releases;
- collective starts t=7;
- makespan = 8 s.

### Scaled actor-frame sequence

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
- Blocked 4;
- Idle 0.

At t=7.5:
- Working 4;
- Blocked 0;
- Idle 0.

This is the required:
`subset working / others idle -> submitters blocked -> full group blocked -> full group working`.

## 8. MPI terminology boundary

MPI process/rank identity and collective participation support the separation between logical actors and hardware resource allocation.

MPI collective completion is not generally equivalent to a barrier: completion may occur without every other process having completed or even started unless the operation semantics require otherwise.

Therefore the Explorer does not infer a global barrier merely from a collective label. Scenario B's synchronization is explicitly authored as a complete-result wait/gate plus DAG fan-in.

## 9. Frozen DES boundary

No changes to:
- `WorkflowSpec`;
- `SimulationResult`;
- engine events;
- resource queues;
- scheduling;
- resource accounting;
- communication semantics.

Multiplicity expands before DES. Actor participation/wait state is derived outside DES from the compilation manifest plus exact `SimulationResult`.

## 10. Deliberate limits

Not implemented:
- range/complement selector languages beyond explicit deterministic ordinal sets;
- wait conditions on repeat blocks;
- multiplicity >1 nested inside repeat blocks;
- overlapping Working actor tasks;
- dynamic actor migration/rebinding;
- actor-level message traffic;
- nested communicator semantics;
- provider queues;
- optimizer;
- UI changes;
- one node/task per rank.

## 11. Validation

Focused files:
- `engine/tests/actor-model.test.mjs`;
- existing `engine/tests/design-compile.test.mjs`.

Repaired Round 4A actor suite: **6/6 passed**.  
Round 2C compiler regressions: **7/7 passed**.  
Total focused checks: **13/13 passed**.

Coverage includes:
- multiplicity / actor count / resourceCount separation;
- compact actor wait manifest;
- pairwise and all-to-all dependency expansion;
- serialized QPU phase with zero resource-queue wait;
- full-result collective dependency;
- required four-stage actor frame sequence;
- multiple Blocked reasons coalescing;
- Working + Blocked conflict rejection;
- pre-existing compiler/provenance/repeat regressions.

## Recommendation

**PORT** the repaired additive design/compiler/actor derivation layer. Frozen DES remains unchanged.


## Round 4D additive note

Scenario-A fidelity required one additional deterministic actor selector:

```ts
{ kind: "ordinals"; actorOrdinals: number[] }
```

This is a higher-level actor-selection extension only. Existing Round-4A Scenario-B semantics and frozen DES remain unchanged. See `ROUND4D_SCENARIO_A_REGIMES.md`.
