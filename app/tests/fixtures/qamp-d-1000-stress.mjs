import {
  compileWorkflowDesignDetailed,
} from "../../src/design/compiler.mjs";

const synthetic = (notes) => ({
  kind: "synthetic",
  source: "Round 4H Scenario D 1000-actor admission stress",
  notes,
});

export const qampScenarioD1000StressDesign = {
  schemaVersion: 1,
  id: "qamp-d-1000-actor-admission-stress",
  name: "QAMP D stress — 1,000 actors / 50 admitted quantum jobs",
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
      label: "Independent classical preparation",
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
      id: "continue",
      label: "Local classical continuation",
      multiplicity: 1000,
      timingKey: "continue",
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
      id: "quantum-continue",
      sourceTaskId: "quantum",
      targetTaskId: "continue",
      instanceMapping: "pairwise",
    },
  ],
  assumptions: [
    "Synthetic stress fixture for Scenario D throttled execution; no global synchronization gate is present.",
    "An actor becomes Blocked only when its QPU task is admitted and emits task_queued; dependency-ready policy-held actors remain Idle.",
    "QPU capacity 1 plus max-in-flight 50 yields one running task and up to 49 resource-queued admitted tasks.",
  ],
};

export const qampScenarioD1000StressRunConfiguration = {
  schemaVersion: 1,
  id: "qamp-d-1000-actor-admission-stress-run",
  workflowId: "qamp-d-1000-actor-admission-stress-compiled",
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
    continue: {
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

export const qampScenarioD1000StressProfile = {
  schemaVersion: 1,
  id: "qamp-d-1000-actor-admission-stress-profile",
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
    "This fixture validates actor admission semantics, not production performance.",
  ],
};

export const qampScenarioD1000StressCompilation =
  compileWorkflowDesignDetailed(
    qampScenarioD1000StressDesign,
    qampScenarioD1000StressRunConfiguration,
    qampScenarioD1000StressProfile
  );

export const qampScenarioD1000StressWorkflowSpec =
  qampScenarioD1000StressCompilation.workflowSpec;
