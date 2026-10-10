# Slurm execution-model crosswalk for future Explorer export

Date: 2026-10-10  
Agent E — Round 4D advisory research  
Status: prototype-nonblocking; no engine/UI changes

## Boundary

This crosswalk asks only: **can the Explorer preserve enough scheduling intent now that a future adapter could emit Slurm-oriented execution plans without redesigning the product?**

**Warning:** an Explorer `ExecutionPlan` would be **scheduling intent, not an exact schedule**. A client may request resources, dependencies, array indices/concurrency and launch structure; Slurm decides actual eligibility/start, allocation/placement and queueing under site configuration/policy. `sbatch` returns after submission and the job can remain pending before resources are granted.

---

## Mapping table

| Explorer concept today | Closest Slurm representation | Exact mismatch / caution | Prototype action | Future `ExecutionPlan` hook |
|---|---|---|---|---|
| `DesignTask.multiplicity = N` | **Potential** `sbatch --array=...` | Slurm arrays are collections of **similar batch jobs with the same initial options**. Explorer multiplicity means logical equivalent instances; it is not inherently a scheduler array. | **Keep scheduler-neutral.** Do not rename ×N to “array”. | `executionMode: "array"`, `instanceCount`, optional `maxConcurrent` only after export planning. |
| Multiplicity instances with per-instance identity | `SLURM_ARRAY_TASK_ID`, `SLURM_ARRAY_JOB_ID` | Slurm gives each array element an index/identity, but Explorer currently has logical ordinals and no scheduler input-manifest convention. | Preserve compilation-manifest instance ordinals. | `instanceParameterRef` / manifest mapping ordinal -> input/arguments. |
| Same logical task ×N with different input values but same resource shape | One array is appropriate **if** all elements can share the same initial Slurm options; wrapper uses array index to select input. | Per-instance application parameters may differ; Slurm's array resource/time request starts homogeneous. | No change needed. | Parameter manifest external to scheduler-neutral plan. |
| Per-instance timing/resource heterogeneity | Usually **partition into homogeneous groups/arrays**; heterogeneous jobs are a different Slurm construct | Slurm array elements start with same size/time-limit/options. A single array can tolerate different actual runtimes, but not naturally different initial resource requests/time limits. | Keep one modeled multiplicity only while instances are intentionally equivalent. Do not promise direct array export for heterogeneous instances. | Optional `groupKey` / normalized resource-shape grouping during export. |
| `DesignDependency.instanceMapping = "pairwise"` between equal multiplicities N -> N | Downstream array with `aftercorr:<upstreamArrayJobID>` | Slurm `aftercorr` releases element *i* after corresponding upstream element *i* completes successfully. Requires compatible index identity. | **Safe semantic alignment now:** preserve corresponding-instance identity. | `dependency.scope: "corresponding"`, `condition: "success"`. |
| All upstream instances -> one downstream join (N -> 1) | Single job with `afterok:<ArrayJobID>` or `afterany:<ArrayJobID>` | `afterok` means all array tasks complete successfully; `afterany` means all terminate regardless of exit status. Explorer dependency semantics currently encode causal completion, not failure policy. | Preserve join topology; do **not** choose failure condition yet. | `dependency.scope: "whole-source-group"`, `condition: "success" | "complete"`. |
| All upstream instances -> all downstream instances (global N -> N gate) | Downstream array depending on entire upstream array via `afterok:<ArrayJobID>` / `afterany:<ArrayJobID>` | This is a global release, not `aftercorr`. | Safe topology alignment; defer failure semantics. | same `whole-source-group` relation. |
| One upstream job -> N independent instances | Array submitted with dependency on the singleton job | Slurm dependency acts at job eligibility level; Explorer edge may also model communication delay. | Preserve fan-out topology only. | group dependency + separate data/staging metadata later. |
| `maxInFlightQuantumByPool` / Scenario-D bounded admission | Array throttle `--array=...%K` **only if** quantum units are actually Slurm array jobs | Slurm array throttle limits simultaneously running array elements, not necessarily remote QPU jobs. If the array element merely submits to an external QPU and exits, `%K` does not bound remote QPU in-flight work. | **Do not directly map.** | `maxConcurrent` on Slurm-managed units; separate `externalConcurrencyIntent` for external services. |
| Actor group `kind="mpi-rank"` / count N | One job allocation/job step with `--ntasks=N`; often `srun` inside an `sbatch` allocation | **Not a job array.** MPI ranks are cooperating processes in one parallel phase; array elements are separate batch jobs. | **Align conceptually now.** Keep actor/rank count distinct from multiplicity ×N. | `executionMode: "parallel-step"`, `tasks=N`. |
| Threaded work per MPI/process task | `--cpus-per-task=C` | Explorer `resourceCount` is an abstract modeled unit and cannot safely be assumed to mean CPUs/task. | Do not map `resourceCount` blindly. | explicit `cpusPerTask`. |
| Node requirement | `--nodes=min[-max]` | Explorer CPU-pool capacity is model capacity, not a node request. | Defer exporter-specific node shape. | `nodes: {min,max?}`. |
| Memory requirement | `--mem`, `--mem-per-cpu`, `--mem-per-gpu` | Explorer currently lacks memory request semantics. These Slurm forms are not interchangeable. | Defer. | typed memory request with `scope: "node" | "cpu" | "gpu"`. |
| GPU requirement | `--gpus[=type:N]`, per-node/task GPU options; GPUs can also be configured as GRES/TRES | Explorer GPU pool says modeled GPU capacity, not Slurm request syntax/type/binding. | Keep generic GPU kind now. | `gpus: {count,type?,scope?}`; adapter selects supported Slurm spelling. |
| Other site-managed resources | GRES; tracked/limited resources may appear as TRES | GRES availability/names are site-configured; TRES includes CPU, memory, node, GRES and accounting types. | Do not hard-code site GRES names. | `genericResources[]` as adapter/site-profile extension. |
| `fixedReservationByPool` | Broadly analogous to resource allocation requested by a batch job | Explorer reservation is simulator accounting, not sufficient to generate nodes/tasks/CPU/memory/GPU requests. | Keep as simulation semantics. | derive/export only after explicit execution resource shape exists. |
| `serviceTime.seconds` / SystemProfile timing | Nearest Slurm concept is a wall-time request/limit, but **not equivalent** | Explorer service time is modeled wall time; Slurm `--time` is a requested limit and does not predict start or actual runtime. | **Do not auto-export service time as exact `--time`.** | optional `wallTimeLimitS` with explicit provenance/safety policy. |
| Positive Explorer dependency communication | Slurm dependency can order jobs; Slurm dependency itself does not encode Explorer latency/bytes/bandwidth model | Data-transfer/staging is separate from job-dependency eligibility. | Keep communication model separate. | optional staging/data intent later. |
| `sbatch`-style phase | Batch job submission + allocation; one batch script runs when allocation is granted | `sbatch --ntasks` describes resources expected for later job steps; `sbatch` itself does not launch N application tasks. | Align terminology in future exporter only. | `launchMode: "batch"`. |
| `srun`-style phase | Parallel execution / job step, optionally inside an existing `sbatch` allocation | `srun` can also create an allocation if needed, so adapter must know context. | Defer command emission. | `launchMode: "step"`, parent allocation/unit ID. |
| Different resource shapes that must run as one coordinated allocation | Slurm **heterogeneous job** with multiple components | Specialized construct: components can have distinct resource options and individual job IDs, while submitted/manipulated as one heterogeneous job. It is **not** a substitute for general DAG phases or heterogeneous array elements. | Defer. | optional `coScheduledGroupId` / heterogeneous component grouping after prototype. |
| REST submission/control | `slurmrestd` | REST schema/API version and auth/site deployment are operational concerns; it is a transport, not a new scheduling semantic. | Defer implementation. | Slurm adapter can later serialize ExecutionPlan -> sbatch scripts or slurmrestd requests. |
| External QPU task in Explorer | Batch script/job step can launch a client/wrapper; Slurm directly schedules it only if the site represents the QPU as a Slurm-managed resource/integration | SchedMD documents GRES as explicitly configured cluster resources. Therefore an external cloud QPU that is not configured in Slurm remains outside Slurm's own queue/capacity accounting; Slurm may only schedule the launcher process. | **Keep QPU execution semantics scheduler-neutral.** | `executionMode: "external"`, service/profile reference, optional launcher resource request. |

---

## Safe to align now

1. **Keep logical multiplicity ×N distinct from actor/rank count and resource units.**  
   This is already the right abstraction. A future exporter may choose an array only after checking independence and homogeneous Slurm request shape.

2. **Preserve stable logical-instance identity.**  
   Explorer compilation ordinals can later map cleanly to array indices/parameter manifests.

3. **Keep pairwise vs global dependency semantics explicit.**  
   Current `pairwise` is structurally compatible with Slurm `aftercorr`; a full-source join is structurally compatible with dependency on the ArrayJobID. Do not bake Slurm's success/failure dependency condition into the current graph.

4. **Keep MPI actors distinct from multiplicity.**  
   An MPI phase is naturally one scheduled allocation/step with `ntasks=N`, not N independent array jobs.

5. **Keep resource intent multidimensional.**  
   Do not reinterpret the existing single `resourceCount` as `--ntasks`, CPU count, node count or GPU count. Future export needs explicit tasks / CPUs-per-task / node / memory / GPU shape.

6. **Keep QPU work explicitly capable of being external.**  
   Slurm may schedule a wrapper/launcher while an external provider schedules the actual QPU job. Only site-specific integration should claim Slurm-managed QPU capacity.

7. **Preserve timing provenance.**  
   Explorer modeled service time can inform planning, but an eventual Slurm wall-time limit should be a separate requested field/policy.

These alignments require **no prototype code change**.

---

## Defer until after the 3-day prototype

- generating `sbatch` scripts;
- generating `srun` command lines / MPI launch policy;
- deciding wall-time-limit derivation or safety margins;
- automatic homogeneous grouping of heterogeneous logical instances;
- Slurm failure/requeue/dependency-condition policy (`afterok` vs `afterany`, etc.);
- memory, node topology, CPU binding, GPU binding/type and site-specific GRES fields;
- heterogeneous-job emission;
- job-step packing within a shared allocation;
- data staging;
- `slurmrestd` client/auth/version handling;
- live cluster discovery;
- provider/QPU-specific Slurm plugins or resource representations;
- any attempt to predict Slurm start time, placement or queue delay.

---

## Minimal scheduler-neutral `ExecutionPlan` sketch

This is intentionally **above** Slurm syntax and below the Explorer design graph.

```ts
type ExecutionMode =
  | "single"
  | "array"
  | "parallel-step"
  | "external";

interface ExecutionPlan {
  schemaVersion: 1;
  sourceWorkflowId: string;
  units: ExecutionUnit[];
  dependencies: ExecutionDependency[];
  warnings: string[];
}

interface ExecutionUnit {
  id: string;
  sourceLogicalTaskIds: string[];
  mode: ExecutionMode;

  // Array-like independent multiplicity only.
  instances?: {
    count: number;
    parameterManifestRef?: string;
    maxConcurrent?: number;
  };

  // Explicit execution resource intent; do not overload WorkflowSpec.resourceCount.
  resources?: {
    nodes?: { min: number; max?: number };
    tasks?: number;
    cpusPerTask?: number;
    memory?: {
      amountMiB: number;
      scope: "node" | "cpu" | "gpu";
    };
    gpus?: {
      count: number;
      type?: string;
      scope?: "job" | "node" | "task";
    };
    generic?: Array<{ name: string; type?: string; count: number }>;
  };

  wallTimeLimitS?: number;

  // External means the scheduler may only launch/host the client.
  externalServiceRef?: string;

  metadata?: Record<string, unknown>;
}

interface ExecutionDependency {
  sourceUnitId: string;
  targetUnitId: string;

  // scheduler-neutral dependency topology
  scope: "whole-source" | "corresponding-instance";
  condition: "complete" | "success";
}
```

### Array/grouping rule

A logical `×N` is a good array candidate when:

- instances are independently schedulable;
- they share one initial resource/time-limit shape;
- instance identity can select distinct parameters/input;
- dependency topology can be represented as whole-group or corresponding-instance relations.

Partition into multiple homogeneous execution units/arrays when instance differences require materially different requested CPUs, memory, GPUs, nodes or wall-time limits.

Do **not** convert an MPI parallel phase into an array merely because it has N ranks.

---

## Scheduling-intent warning

**Do not label `ExecutionPlan` as “the schedule.”**

It would specify requested execution structure and constraints. Slurm remains authoritative for actual admission, priority, start time, node placement, allocation, backfill/preemption behavior and site policy. Even `--begin` makes a job eligible no earlier than a requested time; it does not guarantee second-level dispatch. External QPU services may add an additional scheduler/queue that Slurm does not control.

Recommended user-facing wording:

> **Execution plan** — scheduler-neutral resource, grouping and dependency intent. Actual placement, start times and external-service execution are determined by the target scheduler/provider.

---

## Official SchedMD sources

Current official documentation checked 2026-10-10:

- Job arrays, task identity, array throttle, whole-array dependencies and `aftercorr`:  
  https://slurm.schedmd.com/job_array.html
- `sbatch`: batch submission, dependencies, arrays, nodes/tasks/CPU/memory/GPU/GRES requests:  
  https://slurm.schedmd.com/sbatch.html
- `srun`: parallel jobs/job steps and task/resource launch semantics:  
  https://slurm.schedmd.com/srun.html
- Heterogeneous jobs:  
  https://slurm.schedmd.com/heterogeneous_jobs.html
- `slurmrestd`: REST interface and job submission example:  
  https://slurm.schedmd.com/slurmrestd.html
- GRES:  
  https://slurm.schedmd.com/gres.html
- TRES:  
  https://slurm.schedmd.com/tres.html

## Recommendation

**PORT the conceptual constraints, not Slurm syntax, into future design/export planning.**

No engine/UI changes are required for the prototype. The current separation of logical multiplicity, pairwise/global dependencies, MPI actor semantics, run resource profiles and provenance is sufficient to avoid a future redesign.
