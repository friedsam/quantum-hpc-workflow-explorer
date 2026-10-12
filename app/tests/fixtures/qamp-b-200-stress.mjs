import {
  compileWorkflowDesignDetailed,
} from "../../src/design/compiler.mjs";

const synthetic = (notes) => ({
  kind: "synthetic",
  source: "Round 4G Scenario B 1000-actor/200-submit stress",
  notes,
});

export const qampScenarioB200StressDesign = {
  schemaVersion: 1,
  id: "qamp-b-1000-actor-200-submit-stress",
  name: "QAMP B stress — 1,000 actors / 200 serialized quantum results",
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
    "Synthetic stress fixture grounded in Scenario B's synchronization-wall mechanism: a submitting subset waits on serialized quantum results and the full actor group later waits on the complete result set.",
    "The 1,000/200 scale is a prototype stress choice from Round 4G, not a measured production workload.",
    "QPU admission limit 1 is serialization scaffolding; the public explanation remains dependency/global synchronization, not a queue-wall bottleneck.",
  ],
};

export const qampScenarioB200StressRunConfiguration = {
  schemaVersion: 1,
  id: "qamp-b-1000-actor-200-submit-stress-run",
  workflowId: "qamp-b-1000-actor-200-submit-stress-compiled",
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
};

export const qampScenarioB200StressProfile = {
  schemaVersion: 1,
  id: "qamp-b-1000-actor-200-submit-stress-profile",
  taskServiceTimes: {
    prepare: {
      value: { kind: "constant", seconds: 1 },
      provenance: synthetic(
        "Illustrative concurrent preparation wall time."
      ),
    },
    quantum: {
      value: { kind: "constant", seconds: 1 },
      provenance: synthetic(
        "Illustrative serial QPU service time per submitted result."
      ),
    },
    collective: {
      value: { kind: "constant", seconds: 1 },
      provenance: synthetic(
        "Illustrative full-rank collective continuation wall time."
      ),
    },
  },
  assumptions: [
    "All numeric times are synthetic.",
    "No provider queue or stochastic service model is present.",
  ],
};

export const qampScenarioB200StressCompilation =
  compileWorkflowDesignDetailed(
    qampScenarioB200StressDesign,
    qampScenarioB200StressRunConfiguration,
    qampScenarioB200StressProfile
  );

export const qampScenarioB200StressWorkflowSpec =
  qampScenarioB200StressCompilation.workflowSpec;
