import { compileWorkflowDesignDetailed } from "../design/compiler.mjs";

const COHORTS = Object.freeze([
  { id: 1, start: 1, end: 200, prepSeconds: 0.2 },
  { id: 2, start: 201, end: 400, prepSeconds: 1.2 },
  { id: 3, start: 401, end: 600, prepSeconds: 2.2 },
  { id: 4, start: 601, end: 800, prepSeconds: 3.2 },
  { id: 5, start: 801, end: 1000, prepSeconds: 4.2 },
]);

const OUTBOUND_LATENCY_S = 5;
const QPU_SERVICE_S = 0.1;
const RETURN_LATENCY_S = 3;
const CONTINUATION_S = 0.5;

const synthetic = (notes) => ({
  kind: "synthetic",
  source: "Round 4I public Scenario C 1000-rank cohort transfer-wall demo",
  notes,
});

const range = (startActorOrdinal, endActorOrdinal) => ({
  kind: "range",
  startActorOrdinal,
  endActorOrdinal,
});

const cohortLabel = (cohort) =>
  `Cohort ${cohort.id} · ranks ${cohort.start}–${cohort.end}`;

const tasks = [];
const dependencies = [];
const actorWaits = [];
const taskResources = {};
const taskServiceTimes = {};
const dependencyCommunication = {};

for (const cohort of COHORTS) {
  const prepareId = `cohort-${cohort.id}-prepare`;
  const quantumId = `cohort-${cohort.id}-quantum`;
  const consumerId = `cohort-${cohort.id}-consumer`;
  const outboundId = `cohort-${cohort.id}-outbound-transfer`;
  const returnId = `cohort-${cohort.id}-return-transfer`;

  tasks.push(
    {
      id: prepareId,
      label: `${cohortLabel(cohort)} preparation`,
      timingKey: prepareId,
      semanticType: "classical-preparation-cohort",
      actorParticipation: [
        {
          actorGroupId: "ranks",
          selection: range(cohort.start, cohort.end),
          stateDuringTask: "working",
        },
      ],
      metadata: {
        aggregation: "synthetic-cohort",
        representedActors: 200,
      },
    },
    {
      id: quantumId,
      label: `${cohortLabel(cohort)} aggregate quantum request`,
      timingKey: quantumId,
      semanticType: "quantum-evaluation-cohort",
      metadata: {
        aggregation: "synthetic-cohort-request",
        representedActors: 200,
      },
    },
    {
      id: consumerId,
      label: `${cohortLabel(cohort)} independent continuation`,
      timingKey: consumerId,
      semanticType: "classical-continuation-cohort",
      actorParticipation: [
        {
          actorGroupId: "ranks",
          selection: range(cohort.start, cohort.end),
          stateDuringTask: "working",
        },
      ],
      metadata: {
        aggregation: "synthetic-cohort",
        representedActors: 200,
      },
    }
  );

  actorWaits.push({
    id: `cohort-${cohort.id}-result-wait`,
    actorGroupId: "ranks",
    selection: range(cohort.start, cohort.end),
    activation: {
      kind: "task-event",
      taskId: prepareId,
      event: "completed",
    },
    release: {
      kind: "task-event",
      taskId: consumerId,
      event: "started",
    },
    reason: "quantum-result",
  });

  dependencies.push(
    {
      id: outboundId,
      sourceTaskId: prepareId,
      targetTaskId: quantumId,
      communicationKey: "outbound-transfer",
    },
    {
      id: returnId,
      sourceTaskId: quantumId,
      targetTaskId: consumerId,
      communicationKey: "return-transfer",
    }
  );

  taskResources[prepareId] = {
    resourcePoolId: "cpu",
    resourceCount: 200,
  };
  taskResources[quantumId] = {
    resourcePoolId: "qpu",
    resourceCount: 1,
  };
  taskResources[consumerId] = {
    resourcePoolId: "cpu",
    resourceCount: 200,
  };

  taskServiceTimes[prepareId] = {
    value: { kind: "constant", seconds: cohort.prepSeconds },
    provenance: synthetic(
      `Staggered cohort preparation wall time; cohort ${cohort.id} represents 200 ranks and is not a per-rank timing measurement.`
    ),
  };
  taskServiceTimes[quantumId] = {
    value: { kind: "constant", seconds: QPU_SERVICE_S },
    provenance: synthetic(
      "Short aggregate QPU service chosen to keep transfer, not backend service or queueing, dominant."
    ),
  };
  taskServiceTimes[consumerId] = {
    value: { kind: "constant", seconds: CONTINUATION_S },
    provenance: synthetic(
      "Short independent classical continuation after the cohort result has returned."
    ),
  };
}

dependencyCommunication["outbound-transfer"] = {
  value: { fixedLatencyS: OUTBOUND_LATENCY_S },
  provenance: synthetic(
    "Positive outbound transfer latency; no provider/backend queue delay is represented."
  ),
};

dependencyCommunication["return-transfer"] = {
  value: { fixedLatencyS: RETURN_LATENCY_S },
  provenance: synthetic(
    "Positive result-return transfer latency; actor waits release only when the consumer starts after this dependency completes."
  ),
};

export const qampScenarioC1000Design = {
  schemaVersion: 1,
  id: "qamp-c-1000-cohort-transfer-demo",
  name: "QAMP C — 1,000-rank transfer-dominated cohort demo",
  actorGroups: [
    {
      id: "ranks",
      label: "HPC ranks",
      kind: "mpi-rank",
    },
  ],
  tasks,
  actorWaits,
  dependencies,
  assumptions: [
    "Synthetic public Scenario C using five explicitly declared 200-rank cohorts instead of 1,000 simultaneous QPU-ready requests.",
    "Each cohort quantum task is an aggregate modeled request used to preserve the transfer-wall mechanism without inventing per-rank request timing.",
    "Outbound and return dependency transfers dominate short QPU/classical service; no global synchronization or provider queue is modeled.",
    "Cohort results release independent classical continuation as soon as their positive return-transfer dependency completes.",
  ],
  metadata: {
    synchronization: "none",
    aggregation: "5 cohorts × 200 persistent actors",
    tutorialSource:
      "HPC-Quantum/Documentation-website/scenario-c.md",
  },
};

export const qampScenarioC1000RunConfiguration = {
  schemaVersion: 1,
  id: "qamp-c-1000-cohort-transfer-demo-run",
  workflowId: "qamp-c-1000-cohort-transfer-demo-compiled",
  resources: [
    { id: "cpu", kind: "cpu", capacity: 1000 },
    { id: "qpu", kind: "qpu", capacity: 1 },
  ],
  taskResources,
  policy: {
    allocation: "release-aware",
  },
  actorGroupCounts: {
    ranks: 1000,
  },
  assumptions: [
    "QPU capacity remains one execution lane as in the tutorial.",
    "No max-in-flight admission policy is configured because Scenario C is not a throttling/admission bottleneck.",
  ],
};

export const qampScenarioC1000Profile = {
  schemaVersion: 1,
  id: "qamp-c-1000-cohort-transfer-demo-profile",
  taskServiceTimes,
  dependencyCommunication,
  assumptions: [
    "All numeric task and transfer times are synthetic and illustrative.",
    "Transfer latency is a modeled dependency cost, not a network-resource or provider-queue model.",
  ],
};

export const qampScenarioC1000Compilation =
  compileWorkflowDesignDetailed(
    qampScenarioC1000Design,
    qampScenarioC1000RunConfiguration,
    qampScenarioC1000Profile
  );

export const qampScenarioC1000WorkflowSpec =
  qampScenarioC1000Compilation.workflowSpec;
