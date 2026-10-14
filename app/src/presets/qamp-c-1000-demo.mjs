import { compileWorkflowDesignDetailed } from "../design/compiler.mjs";

const RANKS = 1000;
const PREPARATION_S = 0.2;
const FIRST_OUTBOUND_LATENCY_S = 5;
const STAGGER_BETWEEN_ARRIVALS_S = 0.7;
const QPU_SERVICE_S = 0.05;
const RETURN_LATENCY_S = 0.25;
const CONTINUATION_S = 0.3;

const synthetic = (notes) => ({
  kind: "synthetic",
  source: "QAMP Scenario C individual-request staggered-transfer prototype",
  notes,
});

export const qampScenarioC1000Design = {
  schemaVersion: 1,
  id: "qamp-c-1000-individual-transfer-demo",
  name: "QAMP C — 1,000-rank transfer-latency wall (individual requests)",
  actorGroups: [
    { id: "ranks", label: "HPC ranks", kind: "mpi-rank" }
  ],
  tasks: [
    {
      id: "prepare",
      label: "All-rank concurrent preparation / off-load",
      multiplicity: RANKS,
      timingKey: "prepare",
      semanticType: "quantum-preparation",
      actorParticipation: [{
        actorGroupId: "ranks",
        selection: { kind: "one-per-instance" },
        stateDuringTask: "working",
      }],
    },
    {
      id: "quantum",
      label: "Individually arriving quantum requests",
      multiplicity: RANKS,
      timingKey: "quantum",
      semanticType: "quantum-evaluation",
    },
    {
      id: "consumer",
      label: "Independent per-rank classical continuation",
      multiplicity: RANKS,
      timingKey: "consumer",
      semanticType: "classical-continuation",
      actorParticipation: [{
        actorGroupId: "ranks",
        selection: { kind: "one-per-instance" },
        stateDuringTask: "working",
      }],
    },
  ],
  actorWaits: [{
    id: "per-rank-transfer-and-result-wait",
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
      taskId: "consumer",
      event: "started",
      instance: "matching-instance",
    },
    reason: "quantum-result",
  }],
  dependencies: [
    {
      id: "prepare-quantum",
      sourceTaskId: "prepare",
      targetTaskId: "quantum",
      communicationKey: "outbound-transfer",
      instanceMapping: "pairwise",
    },
    {
      id: "quantum-consumer",
      sourceTaskId: "quantum",
      targetTaskId: "consumer",
      communicationKey: "return-transfer",
      instanceMapping: "pairwise",
    },
  ],
  assumptions: [
    "1,000 individual quantum requests, 1,000 outbound/return transfer pairs, and 1,000 per-rank waits compile from three logical tasks; there are no aggregated cohorts.",
    "All ranks complete 0.2 s concurrent preparation, then become Blocked while 1,000 outbound transfers are in flight before any QPU task starts.",
    "Synthetic transfer delivery schedule: request k reaches the QPU at t = 0.2 + 5 + (k - 1)*0.7 s.",
    "Each quantum service lasts 0.05 s and return transfer lasts 0.25 s, so the preceding result arrives back before the next request reaches the QPU.",
    "0.7 s synthetic per-instance spacing stands in for an assumed serialized delivery pattern; it is NOT an emulation of a contended network resource, transport queue or measured link latency.",
    "Each rank resumes its own 0.3 s classical continuation after its returned result, without waiting for any other rank; no global barrier.",
    "One QPU lane, no admission limit and no sustained QPU resource queue.",
  ],
  metadata: {
    synchronization: "none",
    requestGranularity: "individual-per-rank",
    transferModel: "synthetic-staggered-dependency-latency",
    tutorialSource: "HPC-Quantum/Documentation-website/scenario-c.md",
  },
};

export const qampScenarioC1000RunConfiguration = {
  schemaVersion: 1,
  id: "qamp-c-1000-individual-transfer-demo-run",
  workflowId: "qamp-c-1000-individual-transfer-demo-compiled",
  resources: [
    { id: "cpu", kind: "cpu", capacity: RANKS },
    { id: "qpu", kind: "qpu", capacity: 1 },
  ],
  taskResources: {
    prepare: { resourcePoolId: "cpu", resourceCount: 1 },
    quantum: { resourcePoolId: "qpu", resourceCount: 1 },
    consumer: { resourcePoolId: "cpu", resourceCount: 1 },
  },
  policy: { allocation: "release-aware" },
  actorGroupCounts: { ranks: RANKS },
  assumptions: [
    "1,000 persistent ranks and 1,000 individual QPU task instances (rather than five cohort-level calls).",
    "QPU capacity one, with no max-in-flight throttling because transfer—not QPU admission—is the wall.",
  ],
};

export const qampScenarioC1000Profile = {
  schemaVersion: 1,
  id: "qamp-c-1000-individual-transfer-demo-profile",
  taskServiceTimes: {
    prepare: {
      value: { kind: "constant", seconds: PREPARATION_S },
      provenance: synthetic("All 1,000 rank preparations execute concurrently for 0.2 s.")
    },
    quantum: {
      value: { kind: "constant", seconds: QPU_SERVICE_S },
      provenance: synthetic("A short 0.05 s per-rank quantum execution interval.")
    },
    consumer: {
      value: { kind: "constant", seconds: CONTINUATION_S },
      provenance: synthetic("A 0.3 s useful classical continuation for each independently returned result.")
    },
  },
  dependencyCommunication: {
    "outbound-transfer": {
      value: {
        fixedLatencyS: FIRST_OUTBOUND_LATENCY_S,
        instanceStaggerS: STAGGER_BETWEEN_ARRIVALS_S,
      },
      provenance: synthetic(
        "Synthetic staggered per-rank transfer deliveries: all transfers begin after preparation, but completion times are 0.7 s apart; not a shared-network contention/transport-queue model."
      ),
    },
    "return-transfer": {
      value: { fixedLatencyS: RETURN_LATENCY_S },
      provenance: synthetic(
        "Each quantum result incurs 0.25 s return delay, without a global barrier."
      ),
    },
  },
  assumptions: [
    "All timings are declared synthetic input assumptions, not inferred from measured network or provider hardware.",
    "A per-instance effective outbound transfer latency schedules strictly separated arrivals. This does not model queueing or bandwidth contention on a shared physical transport.",
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
