import { compileWorkflowDesignDetailed } from "../design/compile.mjs";

const synthetic = (source, notes) => ({
  kind: "synthetic",
  source,
  notes,
});

export const qampScenarioAActorDesign = {
  schemaVersion: 1,
  id: "qamp-a-actor-design",
  name: "QAMP A — local quantum wait with independent classical progress",
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
            kind: "ordinals",
            actorOrdinals: [2, 3, 4],
          },
          stateDuringTask: "working",
        },
      ],
    },
    {
      id: "submit",
      label: "Local quantum preparation / submission",
      timingKey: "submit",
      semanticType: "quantum-preparation",
      actorParticipation: [
        {
          actorGroupId: "ranks",
          selection: {
            kind: "ordinals",
            actorOrdinals: [1],
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
      id: "local-consume",
      label: "Local result consumption",
      timingKey: "local-consume",
      semanticType: "classical-consumer",
      actorParticipation: [
        {
          actorGroupId: "ranks",
          selection: {
            kind: "ordinals",
            actorOrdinals: [1],
          },
          stateDuringTask: "working",
        },
      ],
    },
  ],
  actorWaits: [
    {
      id: "local-quantum-result",
      actorGroupId: "ranks",
      selection: {
        kind: "ordinals",
        actorOrdinals: [1],
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
      id: "quantum-local-consume",
      sourceTaskId: "quantum",
      targetTaskId: "local-consume",
    },
  ],
  assumptions: [
    "Scaled Scenario A actor fixture: one submitting rank waits only on its own quantum result.",
    "Ranks 2-4 continue independent useful classical work; no full-group result gate is present.",
  ],
};

export const qampScenarioAActorRunConfiguration = {
  schemaVersion: 1,
  id: "qamp-a-actor-run",
  workflowId: "qamp-a-actor-compiled",
  resources: [
    { id: "cpu", kind: "cpu", capacity: 4 },
    { id: "qpu", kind: "qpu", capacity: 1 },
  ],
  taskResources: {
    "classical-background": {
      resourcePoolId: "cpu",
      resourceCount: 3,
    },
    submit: {
      resourcePoolId: "cpu",
      resourceCount: 1,
    },
    quantum: {
      resourcePoolId: "qpu",
      resourceCount: 1,
    },
    "local-consume": {
      resourcePoolId: "cpu",
      resourceCount: 1,
    },
  },
  policy: {
    allocation: "release-aware",
    maxInFlightQuantumByPool: { qpu: 1 },
  },
  actorGroupCounts: {
    ranks: 4,
  },
  assumptions: [
    "Actor count, task multiplicity, and resourceCount are independent model inputs.",
  ],
};

export function makeScenarioASingleRequestProfile({
  id = "qamp-a-baseline-profile",
  quantumSeconds = 2,
  backgroundSeconds = 8,
} = {}) {
  return {
    schemaVersion: 1,
    id,
    taskServiceTimes: {
      "classical-background": {
        value: {
          kind: "constant",
          seconds: backgroundSeconds,
        },
        provenance: synthetic(
          id,
          "Modeled wall time for independent classical work."
        ),
      },
      submit: {
        value: { kind: "constant", seconds: 1 },
        provenance: synthetic(
          id,
          "Modeled wall time for local preparation/submission."
        ),
      },
      quantum: {
        value: {
          kind: "constant",
          seconds: quantumSeconds,
        },
        provenance: synthetic(
          id,
          "Modeled QPU service wall time; not provider queue time."
        ),
      },
      "local-consume": {
        value: { kind: "constant", seconds: 0.5 },
        provenance: synthetic(
          id,
          "Modeled wall time for local result consumption."
        ),
      },
    },
    assumptions: [
      "All serviceTime seconds are modeled task-instance wall times.",
      "Internal MPI/communication cost may be folded into a phase wall time unless represented explicitly as a dependency/phase.",
    ],
  };
}

export const qampScenarioABaselineProfile =
  makeScenarioASingleRequestProfile();

export const qampScenarioALongQuantumProfile =
  makeScenarioASingleRequestProfile({
    id: "qamp-a-long-quantum-profile",
    quantumSeconds: 5,
  });

export const qampScenarioAActorCompilation =
  compileWorkflowDesignDetailed(
    qampScenarioAActorDesign,
    qampScenarioAActorRunConfiguration,
    qampScenarioABaselineProfile
  );

export const qampScenarioAActorWorkflowSpec =
  qampScenarioAActorCompilation.workflowSpec;

// Fixed topology for deterministic offered-load regime tests.
export const qampScenarioAMultiRequestDesign = {
  schemaVersion: 1,
  id: "qamp-a-multi-request-design",
  name: "QAMP A-like local requests — fixed three-request topology",
  actorGroups: [
    {
      id: "ranks",
      label: "HPC ranks",
      kind: "mpi-rank",
    },
  ],
  tasks: [
    {
      id: "background",
      label: "Independent background work",
      timingKey: "background",
      actorParticipation: [
        {
          actorGroupId: "ranks",
          selection: {
            kind: "ordinals",
            actorOrdinals: [4],
          },
          stateDuringTask: "working",
        },
      ],
    },
    ...[1, 2, 3].flatMap((ordinal) => [
      {
        id: `submit-${ordinal}`,
        label: `Submit local request ${ordinal}`,
        timingKey: `submit-${ordinal}`,
        actorParticipation: [
          {
            actorGroupId: "ranks",
            selection: {
              kind: "ordinals",
              actorOrdinals: [ordinal],
            },
            stateDuringTask: "working",
          },
        ],
      },
      {
        id: `quantum-${ordinal}`,
        label: `Quantum request ${ordinal}`,
        timingKey: `quantum-${ordinal}`,
      },
      {
        id: `consume-${ordinal}`,
        label: `Consume local result ${ordinal}`,
        timingKey: `consume-${ordinal}`,
        actorParticipation: [
          {
            actorGroupId: "ranks",
            selection: {
              kind: "ordinals",
              actorOrdinals: [ordinal],
            },
            stateDuringTask: "working",
          },
        ],
      },
    ]),
  ],
  actorWaits: [1, 2, 3].map((ordinal) => ({
    id: `local-result-${ordinal}`,
    actorGroupId: "ranks",
    selection: {
      kind: "ordinals",
      actorOrdinals: [ordinal],
    },
    activation: {
      kind: "task-event",
      taskId: `submit-${ordinal}`,
      event: "completed",
      instance: "all-instances",
    },
    release: {
      kind: "task-event",
      taskId: `quantum-${ordinal}`,
      event: "completed",
      instance: "all-instances",
    },
    reason: "quantum-result",
  })),
  dependencies: [1, 2, 3].flatMap((ordinal) => [
    {
      id: `submit-${ordinal}-quantum-${ordinal}`,
      sourceTaskId: `submit-${ordinal}`,
      targetTaskId: `quantum-${ordinal}`,
    },
    {
      id: `quantum-${ordinal}-consume-${ordinal}`,
      sourceTaskId: `quantum-${ordinal}`,
      targetTaskId: `consume-${ordinal}`,
    },
  ]),
  assumptions: [
    "Three independent local result paths share one QPU lane and have no global synchronization gate.",
  ],
};

export const qampScenarioAMultiRequestRunConfiguration = {
  schemaVersion: 1,
  id: "qamp-a-multi-request-run",
  workflowId: "qamp-a-multi-request-compiled",
  resources: [
    { id: "cpu", kind: "cpu", capacity: 4 },
    { id: "qpu", kind: "qpu", capacity: 1 },
  ],
  taskResources: {
    background: {
      resourcePoolId: "cpu",
      resourceCount: 1,
    },
    ...Object.fromEntries(
      [1, 2, 3].flatMap((ordinal) => [
        [
          `submit-${ordinal}`,
          { resourcePoolId: "cpu", resourceCount: 1 },
        ],
        [
          `quantum-${ordinal}`,
          { resourcePoolId: "qpu", resourceCount: 1 },
        ],
        [
          `consume-${ordinal}`,
          { resourcePoolId: "cpu", resourceCount: 1 },
        ],
      ])
    ),
  },
  policy: {
    allocation: "release-aware",
    maxInFlightQuantumByPool: { qpu: 3 },
  },
  actorGroupCounts: {
    ranks: 4,
  },
};

export function makeScenarioAMultiRequestProfile({
  id,
  submitSeconds,
  quantumSeconds,
  backgroundSeconds = 9,
} = {}) {
  if (!id || !Array.isArray(submitSeconds) ||
      submitSeconds.length !== 3 ||
      !Array.isArray(quantumSeconds) ||
      quantumSeconds.length !== 3) {
    throw new Error(
      "multi-request profile requires id plus three submit and three quantum times"
    );
  }

  const taskServiceTimes = {
    background: {
      value: {
        kind: "constant",
        seconds: backgroundSeconds,
      },
      provenance: synthetic(
        id,
        "Modeled independent classical wall time."
      ),
    },
  };

  for (const ordinal of [1, 2, 3]) {
    taskServiceTimes[`submit-${ordinal}`] = {
      value: {
        kind: "constant",
        seconds: submitSeconds[ordinal - 1],
      },
      provenance: synthetic(
        id,
        "Modeled wall time determining deterministic request arrival."
      ),
    };
    taskServiceTimes[`quantum-${ordinal}`] = {
      value: {
        kind: "constant",
        seconds: quantumSeconds[ordinal - 1],
      },
      provenance: synthetic(
        id,
        "Modeled QPU service wall time."
      ),
    };
    taskServiceTimes[`consume-${ordinal}`] = {
      value: { kind: "constant", seconds: 0.5 },
      provenance: synthetic(
        id,
        "Modeled local result-consumption wall time."
      ),
    };
  }

  return {
    schemaVersion: 1,
    id,
    taskServiceTimes,
    assumptions: [
      "Same authored topology/run configuration is used across offered-load profiles; only deterministic wall-time parameters change.",
    ],
  };
}

export const qampScenarioAMultiBelowCapacityProfile =
  makeScenarioAMultiRequestProfile({
    id: "qamp-a-multi-below-capacity",
    submitSeconds: [1, 3, 5],
    quantumSeconds: [1, 1, 1],
  });

export const qampScenarioAMultiOverloadProfile =
  makeScenarioAMultiRequestProfile({
    id: "qamp-a-multi-overload",
    submitSeconds: [1, 2, 3],
    quantumSeconds: [3, 3, 3],
  });

export function compileScenarioAProfile(profile) {
  return compileWorkflowDesignDetailed(
    qampScenarioAActorDesign,
    qampScenarioAActorRunConfiguration,
    profile
  );
}

export function compileScenarioAMultiProfile(profile) {
  return compileWorkflowDesignDetailed(
    qampScenarioAMultiRequestDesign,
    qampScenarioAMultiRequestRunConfiguration,
    profile
  );
}
