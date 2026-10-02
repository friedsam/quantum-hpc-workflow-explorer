import { simulateWorkflow } from "../index.mjs";

export const minimalWorkflow = {
  id: "fanout-qpu-join",
  name: "CPU prep -> serialized QPU fan-out -> CPU join",
  resources: [
    { id: "cpu", kind: "cpu", capacity: 2, costPerUnitSecond: 0.01 },
    { id: "qpu", kind: "qpu", capacity: 1, costPerUnitSecond: 0.2 },
  ],
  policy: {
    allocation: "fixed",
    maxInFlightQuantum: 2,
  },
  tasks: [
    { id: "prep", label: "Classical prepare", resourcePoolId: "cpu", resourceCount: 2, serviceTime: { kind: "constant", seconds: 2 } },
    { id: "q1", label: "Quantum branch 1", resourcePoolId: "qpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 3 } },
    { id: "q2", label: "Quantum branch 2", resourcePoolId: "qpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 2 } },
    { id: "join", label: "Classical join", resourcePoolId: "cpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 1.5 } },
  ],
  dependencies: [
    { id: "prep-q1", sourceTaskId: "prep", targetTaskId: "q1", fixedLatencyS: 0.5 },
    { id: "prep-q2", sourceTaskId: "prep", targetTaskId: "q2", fixedLatencyS: 0.5 },
    { id: "q1-join", sourceTaskId: "q1", targetTaskId: "join", fixedLatencyS: 0.25 },
    { id: "q2-join", sourceTaskId: "q2", targetTaskId: "join", fixedLatencyS: 0.25 },
  ],
  assumptions: [
    "Illustrative deterministic service times; not measured production predictions.",
    "Dependency transfers may overlap; network contention is outside engine v1.",
  ],
};

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(simulateWorkflow(minimalWorkflow), null, 2));
}
