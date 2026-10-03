# Minimal design / configuration layer above frozen engine v1

Status: Agent A Round 2C proposal  
Branch: `agent/engine`  
Frozen DES contract: **unchanged**

## 1. Purpose

The frozen engine correctly answers:

> Given one fully resolved `WorkflowSpec`, what deterministic execution trace and metrics follow?

It should not also own design intent, resource-sweep inputs, system calibration, provenance, or bounded-template authoring.

The smallest higher-level split is:

```
WorkflowDesign
      +
RunConfiguration
      +
 SystemProfile
      |
      v
   compile(...)
      |
      v
frozen WorkflowSpec
      |
      v
simulateWorkflow(...)
      |
      v
SimulationResult
      |
      v
RunRecord = exact inputs + compiled spec + exact result
```

This keeps the DES concrete and deterministic while allowing the product to evolve into a design-space explorer later.

## 2. WorkflowDesign — stable intent/topology

`WorkflowDesign` contains what the workflow **is**, independent of one machine/run:

- stable task IDs and labels;
- stable dependency IDs;
- optional semantic type/metadata;
- optional actor/rank-group identity metadata;
- optional bounded repeat blocks;
- logical keys used to resolve timing/communication from a `SystemProfile`.

Reference schema is executable/typed in:

- `engine/design/types.d.ts`
- `engine/design/compile.mjs`

Core shape:

```ts
interface WorkflowDesign {
  id: string;
  name: string;
  tasks: DesignTask[];
  dependencies: DesignDependency[];
  actorGroups?: ActorGroup[];
  repeatBlocks?: RepeatBlock[];
  assumptions?: string[];
  metadata?: Record<string, unknown>;
}

interface DesignTask {
  id: string;                  // stable design ID
  label: string;
  timingKey?: string;          // defaults to id
  semanticType?: string;
  actorGroupIds?: string[];    // semantically inert in v1
  metadata?: Record<string, unknown>;
}

interface DesignDependency {
  id: string;                  // stable design ID
  sourceTaskId: string;
  targetTaskId: string;
  communicationKey?: string;   // defaults to id
  metadata?: Record<string, unknown>;
}
```

### Actor/rank metadata

`actorGroups` and `actorGroupIds` are annotations only. They do **not** create new DES state and do not imply `Working / Blocked / Idle`.

Their purpose is to preserve stable identity so a later actor-accounting layer can track named rank/actor groups exactly without changing generic workflow semantics.

A `RunConfiguration` may also retain `actorGroupCounts`. Frozen v1 ignores it.

## 3. Bounded repeat/template representation

Minimal repeat form:

```ts
interface RepeatBlock {
  id: string;
  count: number;
  taskIds: string[];
  carryDependencies?: {
    id: string;
    sourceTaskId: string;
    targetTaskId: string;
    communicationKey?: string;
  }[];
}
```

Compiler rules:

- each design task belongs to at most one repeat block;
- the block is unrolled deterministically, iteration-major;
- compiled task IDs are deterministic:
  `taskId@repeatId:ordinal`;
- dependencies whose endpoints are both in the block are copied per iteration;
- a dependency entering a repeated block targets the first iteration;
- a dependency leaving a repeated block originates from the last iteration;
- `carryDependencies` connect iteration `i` to `i+1`;
- direct edges between two different repeat blocks are rejected in this minimal version.

This is deliberately not a general control-flow language. It is only bounded DAG expansion before frozen DES execution.

## 4. RunConfiguration — selected resources/run choices

`RunConfiguration` contains choices that may vary between runs while the design stays stable:

```ts
interface RunConfiguration {
  id: string;
  name?: string;
  workflowId?: string;

  resources: {
    id: string;
    kind: "cpu" | "gpu" | "qpu";
    capacity: number;
    costKey?: string;
  }[];

  taskResources: Record<
    string, // stable DesignTask.id
    {
      resourcePoolId: string;
      resourceCount: number;
    }
  >;

  policy: {
    allocation: "fixed" | "release-aware";
    fixedReservationByPool?: Record<string, number>;
    maxInFlightQuantumByPool?: Record<string, number>;
  };

  costOverridesByPool?: Record<string, Provenanced<number>>;
  actorGroupCounts?: Record<string, number>;

  assumptions?: string[];
  metadata?: Record<string, unknown>;
}
```

Current per-task `resourceCount` is an allocation/concurrency input only.

**It does not imply runtime speedup.**

Changing rank/resource count while using a constant `SystemProfile` leaves task service time unchanged. Rank-count optimization therefore remains unsupported until a future profile explicitly defines a resource-count-dependent task-time model.

## 5. SystemProfile — system-specific resolved assumptions

`SystemProfile` contains system-dependent assumptions, independently from design topology and run resource choices.

```ts
interface SystemProfile {
  id: string;

  taskServiceTimes: Record<
    string,
    Provenanced<{ kind: "constant"; seconds: number }>
  >;

  dependencyCommunication?: Record<
    string,
    Provenanced<{
      fixedLatencyS?: number;
      dataBytes?: number;
      bandwidthBytesPerS?: number;
    }>
  >;

  costPerUnitSecond?: Record<
    string,
    Provenanced<number>
  >;

  assumptions?: string[];
  metadata?: Record<string, unknown>;
}
```

Resolution rules:

- task timing key = `DesignTask.timingKey ?? task.id`;
- communication key = `DesignDependency.communicationKey ?? dependency.id`;
- resource cost key = `RunResource.costKey ?? resource.id`;
- explicit `RunConfiguration.costOverridesByPool` wins over profile cost;
- missing dependency communication means zero-cost control dependency;
- every task must resolve to a constant service time in current v1.

## 6. Provenance

Minimal provenance:

```ts
type ProvenanceKind =
  | "synthetic"
  | "user-entered"
  | "measured"
  | "fitted";

interface Provenance {
  kind: ProvenanceKind;
  source?: string;
  observedAt?: string;
  notes?: string;
}
```

This is intentionally much smaller than a full provenance ontology. It is conceptually compatible with later mapping to standards such as W3C PROV, which separates provenance entities, activities and agents, but the project does not need a PROV dependency now.

The resolved frozen `WorkflowSpec` contains execution constants. Exact assumption provenance is retained in `RunRecord`, not forced into DES semantics.

## 7. compile(design, runConfiguration, systemProfile)

Executable reference:

`compileWorkflowDesign(design, runConfiguration, systemProfile)`

Output is the **existing frozen `WorkflowSpec`**, with no DES interface change.

Compilation performs:

1. design ID/topology/repeat validation;
2. deterministic bounded-repeat expansion;
3. run-resource/task binding resolution;
4. fixed reservation and QPU policy resolution;
5. constant task-time lookup;
6. dependency communication lookup;
7. cost-profile/override resolution;
8. preservation of design/actor/timing provenance references in optional task metadata;
9. concatenation of explicit design/config/profile assumptions.

The compiler does not simulate or optimize.

## 8. RunRecord — exact reproducibility envelope

```ts
interface RunRecord {
  schemaVersion: 1;
  id: string;

  design: WorkflowDesign;
  runConfiguration: RunConfiguration;
  systemProfile: SystemProfile;

  compiledWorkflowSpec: WorkflowSpec;
  simulationResult: SimulationResult;

  metadata?: Record<string, unknown>;
}
```

`createRunRecord(...)` takes structured snapshots so subsequent editing of design/config/profile does not mutate historical run evidence.

This gives comparisons a precise meaning:

> these exact design/config/profile inputs compiled to this exact `WorkflowSpec` and produced this exact engine result.

## 9. Current QAMP compile example

Executable example:

`engine/examples/qamp-a-design-compile.mjs`

QAMP Scenario A is separated into:

### Design

Stable tasks:
- `independent-classical`
- `quantum-prep`
- `quantum-run`
- `local-consumer`

Only the local quantum path has dependencies. Optional actor groups annotate independent workers vs the local quantum-dependent group.

### Run configuration

- CPU capacity 2;
- QPU capacity 1;
- per-task resource count 1;
- release-aware allocation.

### Synthetic system profile

- independent classical = 10 s;
- quantum prep = 1 s;
- QPU service = 4 s;
- local consumer = 1 s;
- illustrative CPU/QPU cost rates with `synthetic` provenance.

### Compiled frozen-v1 behavior

The compiled result preserves current Scenario-A acceptance behavior:

- independent classical starts at 0;
- quantum prep starts at 0;
- QPU starts at 1;
- local consumer starts at 5;
- makespan = 10 s;
- QPU queue wait = 0.

No DES change is involved.

## 10. Validation

Reference regression file:

`engine/tests/design-compile.test.mjs`

Five exact branch-content checks cover:

1. QAMP A design -> frozen-v1 compile + simulation;
2. deterministic repeat unrolling + carry dependency;
3. communication profile resolution + user cost override precedence;
4. immutable `RunRecord` snapshots;
5. explicit proof that resource-count changes do not imply task-time scaling under a constant profile.

Agent A executed equivalent checks directly against current Git blobs in the connected runtime: **5/5 passed**.

## 11. Minimum changes needed now

### Frozen DES

**None.**

Do not change:
- `WorkflowSpec`;
- `SimulationResult`;
- event semantics;
- scheduling semantics;
- metrics.

### Optional integration-layer additions

When/if Agent F ports this layer:

1. add shared `WorkflowDesign / RunConfiguration / SystemProfile / RunRecord` types;
2. add one pure compiler above the existing engine;
3. allow presets/editor state to save design/config/profile separately;
4. keep current direct `WorkflowSpec` path as a compatibility/import path if useful.

No staging UI change is required to validate the architecture.

## 12. Future capabilities kept open

Without changing frozen DES, this separation keeps open:

- parameter/resource sweeps over one stable workflow design;
- comparison of fixed vs release-aware configurations;
- per-system CPU/GPU/QPU capacity profiles;
- calibrated measured/fitted timing profiles;
- reusable communication profiles;
- transparent cost-scenario comparison;
- user-entered vs synthetic vs measured provenance display;
- bounded repeat/template authoring;
- backend/system profile switching;
- later actor/rank-group accounting;
- exact reconstruction of legacy-style actor counts **outside** generic DES ontology;
- configuration search/optimization as a future layer;
- resource-count optimization **only after** a future timing model explicitly depends on resource count;
- future non-constant/stochastic timing models as a profile/compiler extension, without rewriting DAG execution semantics.

## 13. Explicit non-goals

Not added:

- optimizer;
- stochastic timing;
- rank-speedup inference;
- scheduler learning;
- provider queue prediction;
- dynamic/unbounded control flow;
- actor `Working / Blocked / Idle` DES states;
- production runtime/orchestrator behavior.

## Recommendation

**PORT architecture + reference compiler/schema**, but keep it above frozen v1 and do not force immediate UI migration unless Agent F needs it for the current 10-day product.
