/**
 * Scaled QAMP Scenario A-D acceptance fixtures.
 *
 * These are synthetic semantic fixtures, not measured production timings.
 * They deliberately use frozen engine-v1 primitives only.
 */

export const scenarioA = {
  id: "qamp-a-loosely-coupled-overlap",
  name: "QAMP A — loosely coupled overlap",
  resources: [
    { id: "cpu", kind: "cpu", capacity: 2 },
    { id: "qpu", kind: "qpu", capacity: 1 },
  ],
  policy: { allocation: "release-aware" },
  tasks: [
    {
      id: "independent-classical",
      label: "Independent classical work",
      resourcePoolId: "cpu",
      resourceCount: 1,
      serviceTime: { kind: "constant", seconds: 10 },
    },
    {
      id: "quantum-prep",
      label: "Local quantum preparation",
      resourcePoolId: "cpu",
      resourceCount: 1,
      serviceTime: { kind: "constant", seconds: 1 },
    },
    {
      id: "quantum-run",
      label: "Local quantum evaluation",
      resourcePoolId: "qpu",
      resourceCount: 1,
      serviceTime: { kind: "constant", seconds: 4 },
    },
    {
      id: "local-consumer",
      label: "Local quantum-result consumer",
      resourcePoolId: "cpu",
      resourceCount: 1,
      serviceTime: { kind: "constant", seconds: 1 },
    },
  ],
  dependencies: [
    {
      id: "a-prep-run",
      sourceTaskId: "quantum-prep",
      targetTaskId: "quantum-run",
    },
    {
      id: "a-run-consumer",
      sourceTaskId: "quantum-run",
      targetTaskId: "local-consumer",
    },
  ],
  assumptions: [
    "Synthetic scaled QAMP Scenario A fixture; timings are illustrative, not measured.",
    "Independent classical work is intentionally longer than the local quantum path so the quantum work is off the critical path.",
    "No global synchronization and no external/provider queue delay are modeled.",
  ],
};

export const scenarioB = {
  id: "qamp-b-synchronization-wall",
  name: "QAMP B — synchronization wall",
  resources: [
    { id: "cpu", kind: "cpu", capacity: 4 },
    { id: "qpu", kind: "qpu", capacity: 1 },
  ],
  policy: {
    allocation: "fixed",
    fixedReservationByPool: { cpu: 4 },
    maxInFlightQuantumByPool: { qpu: 2 },
  },
  tasks: [
    {
      id: "prep-a",
      label: "Submitter A preparation",
      resourcePoolId: "cpu",
      resourceCount: 1,
      serviceTime: { kind: "constant", seconds: 1 },
    },
    {
      id: "prep-b",
      label: "Submitter B preparation",
      resourcePoolId: "cpu",
      resourceCount: 1,
      serviceTime: { kind: "constant", seconds: 1 },
    },
    {
      id: "quantum-a",
      label: "Serialized quantum evaluation A",
      resourcePoolId: "qpu",
      resourceCount: 1,
      serviceTime: { kind: "constant", seconds: 3 },
    },
    {
      id: "quantum-b",
      label: "Serialized quantum evaluation B",
      resourcePoolId: "qpu",
      resourceCount: 1,
      serviceTime: { kind: "constant", seconds: 2 },
    },
    {
      id: "collective-continuation",
      label: "Collective classical continuation",
      resourcePoolId: "cpu",
      resourceCount: 4,
      serviceTime: { kind: "constant", seconds: 1 },
    },
  ],
  dependencies: [
    { id: "b-prep-a-q", sourceTaskId: "prep-a", targetTaskId: "quantum-a" },
    { id: "b-prep-b-q", sourceTaskId: "prep-b", targetTaskId: "quantum-b" },
    { id: "b-q-a-join", sourceTaskId: "quantum-a", targetTaskId: "collective-continuation" },
    { id: "b-q-b-join", sourceTaskId: "quantum-b", targetTaskId: "collective-continuation" },
  ],
  assumptions: [
    "Synthetic scaled QAMP Scenario B fixture; timings are illustrative, not measured.",
    "Only two of four reserved classical units perform preparation; the full reservation is retained.",
    "The QPU is serial for this preset; both quantum tasks are admitted, so the synchronization stall is not caused by admission throttling.",
    "The collective continuation depends on the complete required quantum result set.",
  ],
};

export const scenarioC = {
  id: "qamp-c-latency-data-movement-wall",
  name: "QAMP C — latency/data-movement wall",
  resources: [
    { id: "cpu", kind: "cpu", capacity: 3 },
    { id: "qpu", kind: "qpu", capacity: 1 },
  ],
  policy: { allocation: "release-aware" },
  tasks: [
    ...[1, 2, 3].map((index) => ({
      id: `producer-${index}`,
      label: `Independent producer ${index}`,
      resourcePoolId: "cpu",
      resourceCount: 1,
      serviceTime: { kind: "constant", seconds: 1 },
    })),
    ...[1, 2, 3].map((index) => ({
      id: `quantum-${index}`,
      label: `Quantum evaluation ${index}`,
      resourcePoolId: "qpu",
      resourceCount: 1,
      serviceTime: { kind: "constant", seconds: 0.5 },
    })),
    ...[1, 2, 3].map((index) => ({
      id: `consumer-${index}`,
      label: `Independent result consumer ${index}`,
      resourcePoolId: "cpu",
      resourceCount: 1,
      serviceTime: { kind: "constant", seconds: 0.5 },
    })),
  ],
  dependencies: [
    {
      id: "c-producer-1-q",
      sourceTaskId: "producer-1",
      targetTaskId: "quantum-1",
      fixedLatencyS: 4,
    },
    {
      id: "c-producer-2-q",
      sourceTaskId: "producer-2",
      targetTaskId: "quantum-2",
      fixedLatencyS: 8,
    },
    {
      id: "c-producer-3-q",
      sourceTaskId: "producer-3",
      targetTaskId: "quantum-3",
      fixedLatencyS: 12,
    },
    ...[1, 2, 3].map((index) => ({
      id: `c-q-${index}-consumer`,
      sourceTaskId: `quantum-${index}`,
      targetTaskId: `consumer-${index}`,
      fixedLatencyS: 4,
    })),
  ],
  assumptions: [
    "Synthetic scaled QAMP Scenario C fixture; timings are illustrative, not measured.",
    "Long dependency latencies represent modeled data movement/communication, not provider queue delay.",
    "Each quantum result has its own consumer; there is no global result barrier.",
  ],
};

export const scenarioD = {
  id: "qamp-d-throughput-limited-async",
  name: "QAMP D — throughput-limited asynchronous workflow",
  resources: [
    { id: "cpu", kind: "cpu", capacity: 6 },
    { id: "qpu", kind: "qpu", capacity: 1 },
  ],
  policy: {
    allocation: "release-aware",
    maxInFlightQuantumByPool: { qpu: 2 },
  },
  tasks: [
    ...Array.from({ length: 6 }, (_, index) => ({
      id: `prep-${index + 1}`,
      label: `Independent preparation ${index + 1}`,
      resourcePoolId: "cpu",
      resourceCount: 1,
      serviceTime: { kind: "constant", seconds: 0.5 },
    })),
    ...Array.from({ length: 6 }, (_, index) => ({
      id: `quantum-${index + 1}`,
      label: `Serialized quantum evaluation ${index + 1}`,
      resourcePoolId: "qpu",
      resourceCount: 1,
      serviceTime: { kind: "constant", seconds: 2 },
    })),
    ...Array.from({ length: 6 }, (_, index) => ({
      id: `consumer-${index + 1}`,
      label: `Independent continuation ${index + 1}`,
      resourcePoolId: "cpu",
      resourceCount: 1,
      serviceTime: { kind: "constant", seconds: 0.5 },
    })),
  ],
  dependencies: [
    ...Array.from({ length: 6 }, (_, index) => ({
      id: `d-prep-${index + 1}-q`,
      sourceTaskId: `prep-${index + 1}`,
      targetTaskId: `quantum-${index + 1}`,
    })),
    ...Array.from({ length: 6 }, (_, index) => ({
      id: `d-q-${index + 1}-consumer`,
      sourceTaskId: `quantum-${index + 1}`,
      targetTaskId: `consumer-${index + 1}`,
    })),
  ],
  assumptions: [
    "Synthetic scaled QAMP Scenario D fixture; timings are illustrative, not measured.",
    "QPU capacity is one for this preset and in-flight quantum work is bounded at two.",
    "Each completed quantum path releases only its own continuation; no global synchronization is modeled.",
    "No external/provider queue delay is modeled.",
  ],
};

export const qampScenarioFixtures = {
  A: scenarioA,
  B: scenarioB,
  C: scenarioC,
  D: scenarioD,
};
