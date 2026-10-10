# Round 4D — Scenario A fidelity and parameter-regime semantics

Status: Agent A checkpoint candidate  
Branch: `agent/engine`  
Frozen DES: **unchanged**

## Source basis

The current published Scenario-A tutorial is the acceptance source for this fixture:

https://hpc-quantum.github.io/Documentation-website/scenario-a/

Its explicit contract includes:
- quantum jobs triggered by individual ranks;
- results consumed locally;
- no rank depends on global quantum state to proceed;
- many ranks execute classical work concurrently;
- a submitting rank does not stall others;
- QPU execution is single-lane;
- at most one quantum job is active or queued in the baseline;
- no admission control or throttling is required;
- after result return, the submitting rank resumes classical work immediately.

The tutorial also distinguishes transfer from result waiting. In Frame 2 it calls the submitting rank **Idle while the job is transferred**. The Explorer actor projection does not relabel that tutorial transfer interval. This scaled fixture folds transfer into the submit phase wall time; its explicit `Blocked` state begins only for the authored post-submit quantum-result wait.

## 1. Minimum actor-selection extension

Round 4A had only:
- `all`;
- `one-per-instance`.

That is insufficient to express one persistent actor subset doing one task while the complementary subset performs another task when neither subset follows logical task multiplicity.

Round 4D adds one deterministic selection:

```ts
type ActorParticipationSelection =
  | { kind: "all" }
  | { kind: "one-per-instance" }
  | { kind: "ordinals"; actorOrdinals: number[] };
```

The same ordinal selection is valid for actor wait claims.

Rules:
- ordinals are 1-based persistent actor ordinals within the selected actor group;
- list must be non-empty;
- ordinals must be unique positive integers;
- every ordinal must be <= the run-time actor-group count.

Compiled manifest selection remains explicit:

```ts
{
  kind: "ordinals",
  actorOrdinals: [2, 3, 4]
}
```

No complement/range language and no rank nodes are added.

### Migration impact

Existing `all` and `one-per-instance` designs compile identically.

Affected higher-level consumers only:
- design schema/compiler;
- actor-state derivation;
- future persisted design/editor handling if Agent F ports this variant.

Frozen `WorkflowSpec` and `SimulationResult` are unaffected.

## 2. Faithful scaled Scenario A

Executable fixture:

`engine/examples/qamp-a-actor-regimes.mjs`

Persistent actor group:
- `ranks` count = 4.

Compact authored tasks:
- `classical-background`: actors 2,3,4 Working;
- `submit`: actor 1 Working;
- `quantum`: no actor participation;
- `local-consume`: actor 1 Working.

Local wait:
- actor 1 activates `quantum-result` wait when `submit` completes;
- actor 1 releases when `quantum` completes.

Dependencies:

```
submit -> quantum -> local-consume

classical-background    (independent)
```

No full-group actor wait exists.

### Baseline resource/config values

- CPU capacity = 4;
- QPU capacity = 1;
- no QPU admission/throttling limit in the baseline;
- background resourceCount = 3;
- submit resourceCount = 1;
- quantum resourceCount = 1;
- local consume resourceCount = 1.

### Baseline synthetic wall times

- independent classical background = 8 s;
- submit/preparation = 1 s;
- QPU service = 2 s;
- local result consumption / resumed classical continuation = 3 s.

Result:
- background runs [0,8);
- submit runs [0,1);
- quantum runs [1,3);
- local result consumption / resumed classical continuation runs [3,6);
- QPU queue wait = 0;
- QPU admission wait = 0;
- at t=4 all four actors are Working while the QPU is idle;
- the quantum branch completes before the independent background phase at t=8;
- no full-allocation join exists.

### Actor frames

At t=0.5:
- Working 4;
- Blocked 0;
- Idle 0.

At t=1.5:
- Working 3;
- Blocked 1;
- Idle 0.

At t=4:
- Working 4;
- Blocked 0;
- Idle 0;
- QPU idle.

The post-result interval [3,6) explicitly represents the submitting rank resuming useful classical work while ranks 2-4 remain in their independent classical phase. This matches the tutorial's restored-equilibrium behavior without adding a global join.

This is the intended local-blocking behavior: only the submitting rank loses useful work while awaiting its result.

## 3. Task service-time semantics

`SystemProfile.taskServiceTimes[key].value.seconds` means:

> modeled wall-clock duration of one concrete task instance.

It is **not**:
- CPU clock speed;
- instruction latency;
- wall time divided by resourceCount;
- automatic strong/weak-scaling prediction.

Example:
- Scenario-A background uses `resourceCount = 3`;
- its modeled service time remains exactly 8 s.

If a logical phase internally contains MPI communication, the model has two valid choices:

1. **folded phase model** — measured/fitted/synthetic phase wall time already includes that internal communication;
2. **explicit communication model** — expose communication as separate dependencies/phases when it is the phenomenon under study.

No stochastic timing or implicit rank-speedup model is introduced.

## 4. Parameter-regime matrix

### Family S — one local request, fixed topology

Same:
- `WorkflowDesign`;
- `RunConfiguration`;
- actor selection;
- dependencies;
- QPU capacity/admission policy.

Only `SystemProfile` QPU service time changes.

| Case | QPU service | QPU queue | Admission wait | Actor effect | Regime |
|---|---:|---:|---:|---|---|
| S1 baseline | 2 s | 0 | 0 | rank 1 Blocked for 2 s | A |
| S2 long QPU | 5 s | 0 | 0 | rank 1 Blocked for 5 s; ranks 2-4 continue | still A |

Longer service time alone does **not** create:
- a resource queue when there is one request;
- a global wait;
- a full-group synchronization wall.

### Family M — three local requests, fixed topology

One authored topology/run config is used for both M1 and M2:

Three independent local paths:

```
submit-1 -> quantum-1 -> consume-1
submit-2 -> quantum-2 -> consume-2
submit-3 -> quantum-3 -> consume-3
```

One independent background actor remains.

QPU:
- capacity 1;
- max in-flight 3 **only as test-control scaffolding** so overload appears as QPU resource queueing rather than policy/admission hold.

This bound is not part of Scenario-A baseline semantics; the one-request baseline has no admission-control limit.

Only deterministic `SystemProfile` wall-time parameters change.

#### M1 — staggered, below service capacity

Submit task wall times:
- 1 s, 3 s, 5 s.

QPU service:
- 1 s each.

Quantum starts:
- 1, 3, 5 s.

Result:
- QPU queue wait = 0;
- admission wait = 0;
- no global actor wait.

This remains A-like: independent local waits with spare service capacity between arrivals.

#### M2 — offered load exceeds service capacity

Same topology/config.

Submit task wall times:
- 1 s, 2 s, 3 s.

QPU service:
- 3 s each.

Quantum starts:
- 1, 4, 7 s.

Result:
- aggregate QPU resource-queue wait = 6 s;
- max QPU queue depth = 2;
- QPU admission wait = 0;
- QPU utilization > 0.8 for the finite fixture;
- no global synchronization gate exists.

This is D-like throughput/queue behavior produced from **parameter changes only** on one fixed local-request topology.

### Queueing interpretation

For this finite deterministic fixture, "offered load exceeds service capacity" means requests become ready more rapidly than the single QPU lane can complete them, so backlog appears.

This is consistent with standard queue-stability reasoning: sustained arrival rate above departure/service opportunity produces growing backlog. The Explorer does not estimate a stochastic arrival rate here; it directly simulates the authored deterministic arrivals.

## 5. What is topology vs parameter?

### Parameters

Changing only these does not change authored topology:
- task wall times;
- dependency latency/data/bandwidth assumptions;
- resource capacities/reservations/admission limits in a RunConfiguration;
- cost assumptions.

Round 4D specifically demonstrates a timing-only A-like -> D-like transition on the same multi-request design/config.

### Topology / authored dependency semantics

These are not produced by making a task slower:
- adding/removing task/dependency nodes;
- changing logical multiplicity;
- adding a full-group actor wait/gate;
- adding a collective/full-result dependency;
- changing which actors participate/wait.

B-like global synchronization requires such an explicit authored dependency/gate.

The accepted Scenario-B actor fixture has:
- a full-group `global-synchronization` wait;
- a collective that depends on the complete result set.

Therefore:

> A does not become B from QPU service time alone when the global dependency is absent.

## 6. Bounded comparison with Scenario B

Round 4D reuses the accepted Scenario-B actor fixture as the topology counterexample.

Long-QPU Scenario A:
- actor 1 may remain blocked longer;
- actors 2-4 continue independent work;
- no `selection: all` actor wait exists;
- not all four actors become Blocked.

Scenario B:
- manifest contains explicit all-actor `global-synchronization`;
- all four actors become Blocked before collective work resumes.

This distinction is authored structure, not timing magnitude.

## 7. Validation

Focused test:

`engine/tests/scenario-a-regimes.test.mjs`

New Round-4D suite: **7/7 PASS**.

Coverage:
1. explicit ordinal subset gives one blocked submitter while complementary ranks continue Working;
2. longer QPU wall time lengthens only the local block with no queue/global wall;
3. multiple staggered requests below service capacity remain queue-free/A-like;
4. same multi-request topology crosses to positive queue wait/depth under overload timing;
5. B-like global synchronization requires explicit full-group gate;
6. ordinal selection rejects actor IDs outside group count;
7. below-capacity and overload cases preserve design/run-config identity and differ only in SystemProfile.

Compatibility regressions:
- repaired Round-4A actor suite: **6/6 PASS**;
- Round-2C compiler suite: **7/7 PASS**.

Total focused checks after Round 4D: **20/20 PASS**.

## 8. External verification used

MPI's standard semantics distinguish rank/process identity and collective synchronization behavior; an MPI collective is not automatically a barrier. The project therefore keeps actor identity/waits explicit rather than inferring global blockage from generic MPI participation.

Queueing-theory stability results likewise distinguish offered arrival work from service opportunity; backlog is expected when sustained arrival exceeds service opportunity. Round 4D uses only a deterministic finite analogue of that principle.

## Generalization limitation

The explicit ordinal-set selector is intentionally bounded. A fixed selection such as `[2,3,4]` means exactly those actor ordinals; it does **not** automatically mean "all non-submitters" if a user later changes the actor-group count from 4 to 1000.

Round 4D does not add complement/range semantics. Generalized actor authoring will need an explicit future selector model if that use case is promoted beyond scaled presets.

## 9. Frozen DES boundary

No changes to:
- `WorkflowSpec`;
- `SimulationResult`;
- task/resource/queue states;
- scheduler;
- event semantics;
- resource accounting;
- communication semantics.

The only schema addition is the higher-level deterministic actor ordinal-set selector.

## Recommendation

**PORT**:
- ordinal actor selection;
- Scenario-A actor/regime fixture;
- Round-4D acceptance tests;
- timing/regime semantics documentation.

Do not port any UI change; none was made.
