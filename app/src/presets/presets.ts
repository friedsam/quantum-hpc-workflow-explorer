import type { WorkflowSpec } from "../domain/types";
import type { CompilationManifest } from "../design/types";
import { compileWorkflowDesignDetailed } from "../design/compiler.mjs";
import type { WorkflowDesignBundle } from "../design/bundle";
import {
  customLogicalBundle,
  scenarioALogicalBundle,
  scenarioBLogicalBundle,
  scenarioCLogicalBundle,
  scenarioDLogicalBundle
} from "./logical-presets.mjs";

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
  ].map(([sourceTaskId,targetTaskId]) => ({
    id: sourceTaskId + "-" + targetTaskId,
    sourceTaskId,
    targetTaskId
  })),
  policy: {
    allocation: "fixed",
    fixedReservationByPool: { cpu: 4 },
    maxInFlightQuantumByPool: { qpu: 1 }
  },
  assumptions: [
    "IBM/QAMP structural reference topology; numeric service times are synthetic scaled acceptance values, not production IBM measurements.",
    "Provider queue delay is excluded."
  ]
};

export const presets: WorkflowPreset[] = [
  {
    key: "custom",
    label: "Custom starter",
    description: "Editable logical workflow with multiplicity support.",
    source: "design",
    designBundle: customLogicalBundle
  },
  {
    key: "scenario-a",
    label: "Scenario A",
    description: "Synthetic 1,000-rank actor-aware local overlap; one rank uses the QPU while 999 continue useful classical work.",
    source: "design",
    designBundle: scenarioALogicalBundle
  },
  {
    key: "scenario-b",
    label: "Scenario B",
    description: "Synthetic 1,000-rank / 200-submitter complete-result synchronization wall with one serial QPU lane.",
    source: "design",
    designBundle: scenarioBLogicalBundle
  },
  {
    key: "scenario-c",
    label: "Scenario C",
    description: "Synthetic 1,000-rank transfer wall using five staggered 200-rank cohorts, low QPU load, and independent result return.",
    source: "design",
    designBundle: scenarioCLogicalBundle
  },
  {
    key: "scenario-d",
    label: "Scenario D",
    description: "Synthetic 1,000-rank asynchronous QPU throughput demo with bounded admitted work.",
    source: "design",
    designBundle: scenarioDLogicalBundle
  },
  {
    key: "ibm-sqd",
    label: "IBM/QAMP Fe4S4 SQD",
    description: "Advanced direct WorkflowSpec structural reference.",
    source: "direct",
    spec: ibmSqd
  }
];

export function getPreset(key: string): WorkflowPreset {
  return presets.find((preset) => preset.key === key) ?? presets[0];
}

export function materializePreset(
  preset: WorkflowPreset
): MaterializedPreset {
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

  if (!preset.spec) {
    throw new Error("Direct preset is missing WorkflowSpec.");
  }
  return { spec: structuredClone(preset.spec) };
}

export function cloneSpec(spec: WorkflowSpec): WorkflowSpec {
  return structuredClone(spec);
}
