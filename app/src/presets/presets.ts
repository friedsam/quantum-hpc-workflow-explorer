import type { WorkflowSpec } from "../domain/types";
import type { CompilationManifest } from "../design/types";
import { compileWorkflowDesignDetailed } from "../design/compiler.mjs";
import {
  designBundleFromWorkflowSpec,
  type WorkflowDesignBundle
} from "../design/bundle";
import {
  scenarioA,
  scenarioB,
  scenarioC,
  scenarioD
} from "./qamp-scenarios.mjs";

export interface MaterializedPreset {
  spec: WorkflowSpec;
  designBundle?: WorkflowDesignBundle;
  compilationManifest?: CompilationManifest;
}

export interface WorkflowPreset {
  key: string;
  label: string;
  description: string;
  source: "direct" | "design";
  spec?: WorkflowSpec;
  designBundle?: WorkflowDesignBundle;
}

const qampA = designBundleFromWorkflowSpec(scenarioA, {
  source: "Accepted QAMP Scenario A Round-2 fixture",
  actorGroups: [
    { id: "independent-workers", label: "Independent classical workers" },
    { id: "quantum-path", label: "Local quantum-dependent path" }
  ],
  actorGroupIdsByTask: {
    "independent-classical": ["independent-workers"],
    "quantum-prep": ["quantum-path"],
    "quantum-run": ["quantum-path"],
    "local-consumer": ["quantum-path"]
  },
  semanticTypeByTask: {
    "independent-classical": "classical-independent",
    "quantum-prep": "quantum-preparation",
    "quantum-run": "quantum-evaluation",
    "local-consumer": "local-qpu-continuation"
  }
});

const qampB = designBundleFromWorkflowSpec(scenarioB, {
  source: "Accepted QAMP Scenario B Round-2 fixture",
  actorGroups: [
    { id: "submitters", label: "Quantum submitter paths" },
    { id: "collective", label: "Collective continuation group" }
  ],
  actorGroupIdsByTask: {
    "prep-a": ["submitters"],
    "prep-b": ["submitters"],
    "quantum-a": ["submitters"],
    "quantum-b": ["submitters"],
    "collective-continuation": ["collective"]
  },
  semanticTypeByTask: {
    "prep-a": "quantum-preparation",
    "prep-b": "quantum-preparation",
    "quantum-a": "quantum-evaluation",
    "quantum-b": "quantum-evaluation",
    "collective-continuation": "collective-synchronization"
  }
});

const cActorGroups = [1, 2, 3].map((index) => ({
  id: "path-" + index,
  label: "Independent path " + index
}));
const cActorMap = Object.fromEntries(
  [1, 2, 3].flatMap((index) =>
    ["producer-", "quantum-", "consumer-"].map((prefix) => [
      prefix + index,
      ["path-" + index]
    ])
  )
);
const qampC = designBundleFromWorkflowSpec(scenarioC, {
  source: "Accepted QAMP Scenario C Round-2 fixture",
  actorGroups: cActorGroups,
  actorGroupIdsByTask: cActorMap,
  semanticTypeByTask: Object.fromEntries([
    ...[1, 2, 3].map((index) => ["producer-" + index, "classical-producer"]),
    ...[1, 2, 3].map((index) => ["quantum-" + index, "quantum-evaluation"]),
    ...[1, 2, 3].map((index) => ["consumer-" + index, "local-qpu-continuation"])
  ])
});

const dActorGroups = Array.from({ length: 6 }, (_, index) => ({
  id: "path-" + (index + 1),
  label: "Asynchronous path " + (index + 1)
}));
const dActorMap = Object.fromEntries(
  Array.from({ length: 6 }, (_, index) => index + 1).flatMap((index) =>
    ["prep-", "quantum-", "consumer-"].map((prefix) => [
      prefix + index,
      ["path-" + index]
    ])
  )
);
const qampD = designBundleFromWorkflowSpec(scenarioD, {
  source: "Accepted QAMP Scenario D Round-2 fixture",
  actorGroups: dActorGroups,
  actorGroupIdsByTask: dActorMap,
  semanticTypeByTask: Object.fromEntries([
    ...Array.from({ length: 6 }, (_, index) => ["prep-" + (index + 1), "quantum-preparation"]),
    ...Array.from({ length: 6 }, (_, index) => ["quantum-" + (index + 1), "quantum-evaluation"]),
    ...Array.from({ length: 6 }, (_, index) => ["consumer-" + (index + 1), "local-qpu-continuation"])
  ])
});

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
  { key: "custom", label: "Custom starter", description: "Small editable direct WorkflowSpec starter.", source: "direct", spec: starter },
  { key: "scenario-a", label: "Scenario A", description: "Accepted loosely coupled overlap: QPU off the critical path.", source: "design", designBundle: qampA },
  { key: "scenario-b", label: "Scenario B", description: "Accepted fixed-reservation synchronization wall.", source: "design", designBundle: qampB },
  { key: "scenario-c", label: "Scenario C", description: "Accepted communication/data-movement wall.", source: "design", designBundle: qampC },
  { key: "scenario-d", label: "Scenario D", description: "Accepted throughput-limited asynchronous pipeline with bounded admission.", source: "design", designBundle: qampD },
  { key: "ibm-sqd", label: "IBM/QAMP Fe4S4 SQD", description: "Serious structural reference using synthetic scaled acceptance timings.", source: "direct", spec: ibmSqd }
];

export function getPreset(key: string): WorkflowPreset {
  return presets.find((preset) => preset.key === key) ?? presets[0];
}

export function materializePreset(preset: WorkflowPreset): MaterializedPreset {
  if (preset.source === "design" && preset.designBundle) {
    const compiled = compileWorkflowDesignDetailed(
      preset.designBundle.design,
      preset.designBundle.runConfiguration,
      preset.designBundle.systemProfile
    );
    return {
      spec: compiled.workflowSpec,
      designBundle: structuredClone(preset.designBundle),
      compilationManifest: compiled.manifest
    };
  }

  if (!preset.spec) throw new Error("Direct preset is missing WorkflowSpec.");
  return { spec: structuredClone(preset.spec) };
}

export function cloneSpec(spec: WorkflowSpec): WorkflowSpec {
  return structuredClone(spec);
}
