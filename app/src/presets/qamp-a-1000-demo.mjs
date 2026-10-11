import { compileWorkflowDesignDetailed } from "../design/compiler.mjs";

const synthetic = (notes) => ({
  kind: "synthetic",
  source: "Round 4F Scenario A 1000-rank demo",
  notes,
});

export const qampScenarioA1000Design = {
  schemaVersion: 1,
  id: "qamp-a-1000-demo-design",
  name: "QAMP A — 1,000-rank local quantum overlap demo",
  actorGroups: [
    {
      id: "ranks",
      label: "HPC ranks",
      kind: "mpi-rank",
    },
  ],
  tasks: [
    {
      id: "classical-background",
      label: "Independent classical work",
      timingKey: "classical-background",
      semanticType: "classical-independent",
      actorParticipation: [
        {
          actorGroupId: "ranks",
          selection: {
            kind: "all-except",
            actorOrdinals: [1],
          },
          stateDuringTask: "working",
        },
      ],
      metadata: {
        aggregation:
          "One modeled task aggregates concurrent useful work by ranks 2-1000; it is not 999 independent DES tasks.",
      },
    },
    {
      id: "submit",
      label: "Rank 1 quantum preparation / submission",
      timingKey: "submit",
      semanticType: "quantum-preparation",
      actorParticipation: [
        {
          actorGroupId: "ranks",
          selection: {
            kind: "range",
            startActorOrdinal: 1,
            endActorOrdinal: 1,
          },
          stateDuringTask: "working",
        },
      ],
    },
    {
      id: "quantum",
      label: "Local quantum request",
      timingKey: "quantum",
      semanticType: "quantum-evaluation",
    },
    {
      id: "local-resume",
      label: "Rank 1 local result consumption / resumed classical work",
      timingKey: "local-resume",
      semanticType: "classical-consumer",
      actorParticipation: [
        {
          actorGroupId: "ranks",
          selection: {
            kind: "range",
            startActorOrdinal: 1,
            endActorOrdinal: 1,
          },
          stateDuringTask: "working",
        },
      ],
    },
  ],
  actorWaits: [
    {
      id: "rank-1-result-wait",
      actorGroupId: "ranks",
      selection: {
        kind: "range",
        startActorOrdinal: 1,
        endActorOrdinal: 1,
      },
      activation: {
        kind: "task-event",
        taskId: "submit",
        event: "completed",
        instance: "all-instances",
      },
      release: {
        kind: "task-event",
        taskId: "quantum",
        event: "completed",
        instance: "all-instances",
      },
      reason: "quantum-result",
    },
  ],
  dependencies: [
    {
      id: "submit-quantum",
      sourceTaskId: "submit",
      targetTaskId: "quantum",
    },
    {
      id: "quantum-local-resume",
      sourceTaskId: "quantum",
      targetTaskId: "local-resume",
    },
  ],
  assumptions: [
    "Synthetic tutorial-scale Scenario A demo with 1,000 persistent logical ranks.",
    "Rank 1 submits one local quantum request and waits only for its own result.",
    "Ranks 2-1000 continue useful classical work with no full-group synchronization gate.",
    "The classical-background task is an aggregate approximation for 999 concurrently working ranks, not 999 independent DES task instances.",
  ],
};

export const qampScenarioA1000RunConfiguration = {
  schemaVersion: 1,
  id: "qamp-a-1000-demo-run",
  workflowId: "qamp-a-1000-demo-compiled",
  resources: [
    { id: "cpu", kind: "cpu", capacity: 1000 },
    { id: "qpu", kind: "qpu", capacity: 1 },
  ],
  taskResources: {
    "classical-background": {
      resourcePoolId: "cpu",
      resourceCount: 999,
    },
    submit: {
      resourcePoolId: "cpu",
      resourceCount: 1,
    },
    quantum: {
      resourcePoolId: "qpu",
      resourceCount: 1,
    },
    "local-resume": {
      resourcePoolId: "cpu",
      resourceCount: 1,
    },
  },
  policy: {
    allocation: "release-aware",
  },
  actorGroupCounts: {
    ranks: 1000,
  },
  assumptions: [
    "Actor count 1000, four logical tasks, and per-task resource units are separate model quantities.",
    "No admission-control/throttling limit is configured for the baseline.",
  ],
};

export const qampScenarioA1000Profile = {
  schemaVersion: 1,
  id: "qamp-a-1000-demo-synthetic-profile",
  taskServiceTimes: {
    "classical-background": {
      value: { kind: "constant", seconds: 10 },
      provenance: synthetic(
        "Modeled wall time for aggregate independent classical work; chosen strictly longer than the 8 s local quantum branch."
      ),
    },
    submit: {
      value: { kind: "constant", seconds: 1 },
      provenance: synthetic(
        "Modeled wall time for rank-1 quantum preparation/submission."
      ),
    },
    quantum: {
      value: { kind: "constant", seconds: 2 },
      provenance: synthetic(
        "Modeled QPU service wall time; no provider queue is modeled."
      ),
    },
    "local-resume": {
      value: { kind: "constant", seconds: 5 },
      provenance: synthetic(
        "Modeled wall time for result consumption plus resumed useful classical work through t=8."
      ),
    },
  },
  assumptions: [
    "All numeric times are synthetic and illustrative.",
    "Task service time is modeled wall time for one concrete task instance, not CPU speed or instruction latency.",
  ],
};

export const qampScenarioA1000Compilation =
  compileWorkflowDesignDetailed(
    qampScenarioA1000Design,
    qampScenarioA1000RunConfiguration,
    qampScenarioA1000Profile
  );

export const qampScenarioA1000WorkflowSpec =
  qampScenarioA1000Compilation.workflowSpec;
