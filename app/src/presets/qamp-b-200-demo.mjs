import {
  compileWorkflowDesignDetailed,
} from "../design/compiler.mjs";

const synthetic = (notes) => ({
  kind: "synthetic",
  source: "Round 4H public Scenario B 1000-actor/200-submit demo",
  notes,
});

export const qampScenarioB200Design = {
  schemaVersion: 1,
  id: "qamp-b-1000-actor-200-submit-demo",
  name: "QAMP B — 1,000-rank synchronization-wall demo",
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
      label: "Submitting-rank preparation",
      multiplicity: 200,
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
      label: "Serialized quantum evaluation",
      multiplicity: 200,
      timingKey: "quantum",
      semanticType: "quantum-evaluation",
    },
    {
      id: "collective",
      label: "Full collective continuation",
      timingKey: "collective",
      semanticType: "collective-classical",
      actorParticipation: [
        {
          actorGroupId: "ranks",
          selection: { kind: "all" },
          stateDuringTask: "working",
        },
      ],
    },
  ],
  actorWaits: [
    {
      id: "submitter-result-wait",
      actorGroupId: "ranks",
      selection: { kind: "one-per-instance" },
      activation: {
        kind: "task-event",
        taskId: "prepare",
        event: "completed",
        instance: "matching-instance",
      },
      release: {
        kind: "task-event",
        taskId: "quantum",
        event: "completed",
        instance: "matching-instance",
      },
      reason: "quantum-result",
    },
    {
      id: "global-result-gate",
      actorGroupId: "ranks",
      selection: { kind: "all" },
      activation: {
        kind: "task-event",
        taskId: "quantum",
        event: "completed",
        instance: "any-instance",
      },
      release: {
        kind: "task-event",
        taskId: "quantum",
        event: "completed",
        instance: "all-instances",
      },
      reason: "global-synchronization",
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
      id: "quantum-collective",
      sourceTaskId: "quantum",
      targetTaskId: "collective",
      instanceMapping: "all-to-all",
    },
  ],
  assumptions: [
    "Synthetic public Scenario B demo with 1,000 persistent logical ranks and 200 submitting ranks.",
    "The submitting subset waits on serialized quantum results; after the first result, the full actor group waits on the complete result set before collective recovery.",
    "QPU max-in-flight 1 is service-serialization scaffolding. The explanatory wall is the authored complete-result dependency/global synchronization, not a QPU resource queue.",
    "No provider queue or stochastic service model is present.",
  ],
  metadata: {
    synchronization: "complete-result-global-gate",
  },
};

export const qampScenarioB200RunConfiguration = {
  schemaVersion: 1,
  id: "qamp-b-1000-actor-200-submit-demo-run",
  workflowId: "qamp-b-1000-actor-200-submit-demo-compiled",
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
    collective: {
      resourcePoolId: "cpu",
      resourceCount: 1000,
    },
  },
  policy: {
    allocation: "fixed",
    fixedReservationByPool: { cpu: 1000 },
    maxInFlightQuantumByPool: { qpu: 1 },
  },
  actorGroupCounts: {
    ranks: 1000,
  },
  assumptions: [
    "Actor count 1,000, task multiplicity 200/200/1, and per-instance resource demand are separate model quantities.",
    "The QPU admission limit serializes submitted service but is not the source of the collective synchronization wall.",
  ],
};

export const qampScenarioB200Profile = {
  schemaVersion: 1,
  id: "qamp-b-1000-actor-200-submit-demo-profile",
  taskServiceTimes: {
    prepare: {
      value: { kind: "constant", seconds: 1 },
      provenance: synthetic(
        "Illustrative concurrent preparation wall time for each submitting rank."
      ),
    },
    quantum: {
      value: { kind: "constant", seconds: 1 },
      provenance: synthetic(
        "Illustrative serial QPU service wall time per submitted result."
      ),
    },
    collective: {
      value: { kind: "constant", seconds: 1 },
      provenance: synthetic(
        "Illustrative full-rank collective recovery wall time after all results are complete."
      ),
    },
  },
  assumptions: [
    "All numeric times are synthetic and illustrative.",
    "Modeled wall times are task-instance assumptions, not hardware instruction-speed measurements.",
  ],
};

export const qampScenarioB200Compilation =
  compileWorkflowDesignDetailed(
    qampScenarioB200Design,
    qampScenarioB200RunConfiguration,
    qampScenarioB200Profile
  );

export const qampScenarioB200WorkflowSpec =
  qampScenarioB200Compilation.workflowSpec;
