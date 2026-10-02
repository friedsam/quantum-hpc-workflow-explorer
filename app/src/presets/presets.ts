import type { WorkflowSpec } from "../domain/types";

export interface WorkflowPreset {
  key: string;
  label: string;
  description: string;
  spec: WorkflowSpec;
}

const scenarioA: WorkflowSpec = {
  id: "scenario-a-handoff",
  name: "Scenario A — classical / quantum handoff",
  resources: [
    { id: "cpu", kind: "cpu", capacity: 4, costPerUnitSecond: 0.001 },
    { id: "qpu", kind: "qpu", capacity: 1, costPerUnitSecond: 0.2 }
  ],
  tasks: [
    { id: "prepare", label: "Classical prepare", resourcePoolId: "cpu", resourceCount: 2, serviceTime: { kind: "constant", seconds: 2 } },
    { id: "sample", label: "Quantum sample", resourcePoolId: "qpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 1.5 } },
    { id: "post", label: "Classical post-process", resourcePoolId: "cpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 1 } }
  ],
  dependencies: [
    { id: "prepare-sample", sourceTaskId: "prepare", targetTaskId: "sample", fixedLatencyS: 0.1 },
    { id: "sample-post", sourceTaskId: "sample", targetTaskId: "post", fixedLatencyS: 0.1 }
  ],
  policy: { allocation: "fixed", fixedReservationByPool: { cpu: 4 }, maxInFlightQuantumByPool: { qpu: 1 } },
  assumptions: ["Synthetic Scenario A acceptance preset; service and transfer times are illustrative."]
};

const scenarioB: WorkflowSpec = {
  id: "scenario-b-fork-join",
  name: "Scenario B — fork / join synchronization",
  resources: [
    { id: "cpu", kind: "cpu", capacity: 4 },
    { id: "qpu", kind: "qpu", capacity: 2 }
  ],
  tasks: [
    { id: "root", label: "Prepare branches", resourcePoolId: "cpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 1 } },
    { id: "qa", label: "Quantum branch A", resourcePoolId: "qpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 2 } },
    { id: "qb", label: "Quantum branch B", resourcePoolId: "qpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 4 } },
    { id: "classical", label: "Classical branch", resourcePoolId: "cpu", resourceCount: 2, serviceTime: { kind: "constant", seconds: 3 } },
    { id: "join", label: "Join / consume all results", resourcePoolId: "cpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 1 } }
  ],
  dependencies: [
    { id: "root-qa", sourceTaskId: "root", targetTaskId: "qa" },
    { id: "root-qb", sourceTaskId: "root", targetTaskId: "qb" },
    { id: "root-classical", sourceTaskId: "root", targetTaskId: "classical" },
    { id: "qa-join", sourceTaskId: "qa", targetTaskId: "join" },
    { id: "qb-join", sourceTaskId: "qb", targetTaskId: "join" },
    { id: "classical-join", sourceTaskId: "classical", targetTaskId: "join" }
  ],
  policy: { allocation: "release-aware" },
  assumptions: ["Synthetic Scenario B fork/join preset. Join semantics come from DAG dependencies, not a special barrier state."]
};

const scenarioC: WorkflowSpec = {
  id: "scenario-c-latency",
  name: "Scenario C — communication latency stress",
  resources: [
    { id: "cpu", kind: "cpu", capacity: 2 },
    { id: "qpu", kind: "qpu", capacity: 1 }
  ],
  tasks: [
    { id: "prepare", label: "Prepare request", resourcePoolId: "cpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 0.5 } },
    { id: "quantum", label: "Quantum work", resourcePoolId: "qpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 0.5 } },
    { id: "consume", label: "Consume result", resourcePoolId: "cpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 0.5 } }
  ],
  dependencies: [
    { id: "prepare-quantum", sourceTaskId: "prepare", targetTaskId: "quantum", fixedLatencyS: 3 },
    { id: "quantum-consume", sourceTaskId: "quantum", targetTaskId: "consume", fixedLatencyS: 3 }
  ],
  policy: { allocation: "release-aware", maxInFlightQuantumByPool: { qpu: 1 } },
  assumptions: ["Synthetic Scenario C latency-dominated stress preset. The 3 s dependency latencies are illustrative, not provider queue measurements."]
};

const scenarioD: WorkflowSpec = {
  id: "scenario-d-bounded-admission",
  name: "Scenario D — bounded quantum admission",
  resources: [{ id: "qpu", kind: "qpu", capacity: 1 }],
  tasks: Array.from({ length: 6 }, (_, index) => ({
    id: "q" + (index + 1),
    label: "Quantum task " + (index + 1),
    resourcePoolId: "qpu",
    resourceCount: 1,
    serviceTime: { kind: "constant" as const, seconds: 2 }
  })),
  dependencies: [],
  policy: { allocation: "release-aware", maxInFlightQuantumByPool: { qpu: 2 } },
  assumptions: ["Synthetic Scenario D / E4 policy stress preset: six 2 s QPU tasks, capacity 1, max in-flight 2."]
};

const ibmSqd: WorkflowSpec = {
  id: "ibm-sqd-fe4s4-reference",
  name: "IBM/QAMP Fe4S4 SQD — structural reference",
  resources: [
    { id: "cpu", kind: "cpu", capacity: 4 },
    { id: "qpu", kind: "qpu", capacity: 1 }
  ],
  tasks: [
    { id: "load", label: "Rank 0 load/setup", resourcePoolId: "cpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 1 } },
    { id: "build", label: "Rank 0 build LUCJ", resourcePoolId: "cpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 2 } },
    { id: "transpile", label: "Rank 0 transpile", resourcePoolId: "cpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 2 } },
    { id: "sample", label: "QPU sample once", resourcePoolId: "qpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 4 } },
    { id: "recover0", label: "Recovery 0", resourcePoolId: "cpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 1 } },
    { id: "sbd0", label: "All-rank SBD 0", resourcePoolId: "cpu", resourceCount: 4, serviceTime: { kind: "constant", seconds: 3 } },
    { id: "book0", label: "Occupancy update 0", resourcePoolId: "cpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 0.5 } },
    { id: "recover1", label: "Recovery 1", resourcePoolId: "cpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 1 } },
    { id: "sbd1", label: "All-rank SBD 1", resourcePoolId: "cpu", resourceCount: 4, serviceTime: { kind: "constant", seconds: 3 } },
    { id: "book1", label: "Occupancy update 1", resourcePoolId: "cpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 0.5 } }
  ],
  dependencies: [
    ["load","build"],["build","transpile"],["transpile","sample"],["sample","recover0"],["recover0","sbd0"],
    ["sbd0","book0"],["book0","recover1"],["recover1","sbd1"],["sbd1","book1"]
  ].map(([sourceTaskId,targetTaskId]) => ({ id: sourceTaskId + "-" + targetTaskId, sourceTaskId, targetTaskId })),
  policy: { allocation: "fixed", fixedReservationByPool: { cpu: 4 }, maxInFlightQuantumByPool: { qpu: 1 } },
  assumptions: [
    "IBM/QAMP structural reference topology; numeric service times are the synthetic scaled E5 acceptance fixture, not production IBM measurements.",
    "Provider queue delay is excluded.",
    "Fixed CPU reservation represents the abstract MPI allocation remaining reserved while rank 0 alone performs some stages."
  ]
};

const starter: WorkflowSpec = {
  id: "custom-starter",
  name: "Custom workflow",
  resources: [
    { id: "cpu", kind: "cpu", capacity: 4 },
    { id: "qpu", kind: "qpu", capacity: 1 }
  ],
  tasks: [
    { id: "task-1", label: "Classical task", resourcePoolId: "cpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 1 } },
    { id: "task-2", label: "Quantum task", resourcePoolId: "qpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 1 } }
  ],
  dependencies: [{ id: "dep-1", sourceTaskId: "task-1", targetTaskId: "task-2" }],
  policy: { allocation: "release-aware", maxInFlightQuantumByPool: { qpu: 1 } },
  assumptions: ["User-editable starter; all values are illustrative until changed."]
};

export const presets: WorkflowPreset[] = [
  { key: "custom", label: "Custom starter", description: "Small editable starter workflow.", spec: starter },
  { key: "scenario-a", label: "Scenario A", description: "Classical → quantum → classical handoff.", spec: scenarioA },
  { key: "scenario-b", label: "Scenario B", description: "Fork/join synchronization stress case.", spec: scenarioB },
  { key: "scenario-c", label: "Scenario C", description: "Latency-dominated synthetic stress case.", spec: scenarioC },
  { key: "scenario-d", label: "Scenario D", description: "Bounded quantum admission / policy-wait stress case.", spec: scenarioD },
  { key: "ibm-sqd", label: "IBM/QAMP Fe4S4 SQD", description: "Serious structural reference preset using synthetic E5 timings.", spec: ibmSqd }
];

export function getPreset(key: string): WorkflowPreset {
  return presets.find((preset) => preset.key === key) ?? presets[0];
}

export function cloneSpec(spec: WorkflowSpec): WorkflowSpec {
  return structuredClone(spec);
}
