import {
  compileWorkflowDesignDetailed,
} from "../design/compiler.mjs";

const synthetic = (notes) => ({
  kind: "synthetic",
  source: "Round 4J public Scenario D 1000-request throughput demo",
  notes,
});

export const qampScenarioD1000Design = {
  schemaVersion: 1,
  id: "qamp-d-1000-throughput-demo",
  name: "QAMP D — 1,000-rank bounded asynchronous throughput demo",
  actorGroups: [
    {
      id: "ranks",
      label: "HPC ranks",
      kind: "mpi-rank",
    },
  ],
  tasks: [
    {
      id: "prepare",
      label: "Independent classical preparation / off-load work",
      multiplicity: 1000,
      timingKey: "prepare",
      semanticType: "quantum-preparation",
      actorParticipation: [
        {
          actorGroupId: "ranks",
          selection: { kind: "one-per-instance" },
          stateDuringTask: "working",
        },
      ],
    },
    {
      id: "quantum",
      label: "Rate-limited quantum request",
      multiplicity: 1000,
      timingKey: "quantum",
      semanticType: "quantum-evaluation",
    },
    {
      id: "consumer",
      label: "Useful local classical continuation",
      multiplicity: 1000,
      timingKey: "consumer",
      semanticType: "classical-continuation",
      actorParticipation: [
        {
          actorGroupId: "ranks",
          selection: { kind: "one-per-instance" },
          stateDuringTask: "working",
        },
      ],
    },
  ],
  actorWaits: [
    {
      id: "admitted-quantum-result-wait",
      actorGroupId: "ranks",
      selection: { kind: "one-per-instance" },
      activation: {
        kind: "task-event",
        taskId: "quantum",
        event: "queued",
        instance: "matching-instance",
      },
      release: {
        kind: "task-event",
        taskId: "quantum",
        event: "completed",
        instance: "matching-instance",
      },
      reason: "admitted-quantum-result",
    },
  ],
  dependencies: [
    {
      id: "prepare-quantum",
      sourceTaskId: "prepare",
      targetTaskId: "quantum",
      instanceMapping: "pairwise",
    },
    {
      id: "quantum-consumer",
      sourceTaskId: "quantum",
      targetTaskId: "consumer",
      instanceMapping: "pairwise",
    },
  ],
  assumptions: [
    "Synthetic public Scenario D throughput model; no global synchronization gate is present.",
    "An actor becomes Blocked only when its QPU task is admitted and emits task_queued; dependency-ready policy-held actors remain Idle.",
    "QPU capacity 1 plus max-in-flight 50 yields one running task and up to 49 resource-queued admitted tasks.",
    "The single asynchronous drain ends with completed actors Idle after their local continuation; a recurring all-Working cycle would require explicitly authored next work.",
    "No provider queue, hidden transfer phase, or fabricated synchronization is modeled.",
  ],
};

export const qampScenarioD1000RunConfiguration = {
  schemaVersion: 1,
  id: "qamp-d-1000-throughput-demo-run",
  workflowId: "qamp-d-1000-throughput-demo-compiled",
  resources: [
    { id: "cpu", kind: "cpu", capacity: 1000 },
    { id: "qpu", kind: "qpu", capacity: 1 },
  ],
  taskResources: {
    prepare: {
      resourcePoolId: "cpu",
      resourceCount: 1,
    },
    quantum: {
      resourcePoolId: "qpu",
      resourceCount: 1,
    },
    consumer: {
      resourcePoolId: "cpu",
      resourceCount: 1,
    },
  },
  policy: {
    allocation: "release-aware",
    maxInFlightQuantumByPool: { qpu: 50 },
  },
  actorGroupCounts: {
    ranks: 1000,
  },
};

export const qampScenarioD1000Profile = {
  schemaVersion: 1,
  id: "qamp-d-1000-throughput-demo-profile",
  taskServiceTimes: {
    prepare: {
      value: { kind: "constant", seconds: 1 },
      provenance: synthetic(
        "All 1,000 preparations run concurrently for one modeled second."
      ),
    },
    quantum: {
      value: { kind: "constant", seconds: 1 },
      provenance: synthetic(
        "Single-lane QPU service time; no provider queue is modeled."
      ),
    },
    continue: {
      value: { kind: "constant", seconds: 0.5 },
      provenance: synthetic(
        "Local result consumption plus resumed classical progress."
      ),
    },
  },
  assumptions: [
    "All numeric times are synthetic.",
    "This public tutorial demo is illustrative and is not measured production performance.",
  ],
};

export const qampScenarioD1000Compilation =
  compileWorkflowDesignDetailed(
    qampScenarioD1000Design,
    qampScenarioD1000RunConfiguration,
    qampScenarioD1000Profile
  );

export const qampScenarioD1000WorkflowSpec =
  qampScenarioD1000Compilation.workflowSpec;
