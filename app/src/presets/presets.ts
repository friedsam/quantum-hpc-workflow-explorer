import type { WorkflowSpec } from "../domain/types";
import type {
  CompilationManifest,
  RunConfiguration,
  SystemProfile,
  WorkflowDesign
} from "../design/types";
import { compileWorkflowDesignDetailed } from "../design/compiler.mjs";
import type { WorkflowDesignBundle } from "../design/bundle";
import {
  qampScenarioBActorDesign,
  qampScenarioBActorRunConfiguration,
  qampScenarioBActorSystemProfile
} from "./qamp-b-actor.mjs";

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

const synthetic = (source: string, notes: string) => ({
  kind: "synthetic" as const,
  source,
  notes
});

function bundle(
  design: WorkflowDesign,
  runConfiguration: RunConfiguration,
  systemProfile: SystemProfile
): WorkflowDesignBundle {
  return { design, runConfiguration, systemProfile };
}

const custom = bundle(
  {
    schemaVersion: 1,
    id: "custom-logical-design",
    name: "Custom workflow",
    tasks: [
      {
        id: "classical",
        label: "Classical task",
        multiplicity: 1,
        timingKey: "classical",
        semanticType: "classical"
      },
      {
        id: "quantum",
        label: "Quantum task",
        multiplicity: 1,
        timingKey: "quantum",
        semanticType: "quantum-evaluation"
      }
    ],
    dependencies: [
      {
        id: "classical-quantum",
        sourceTaskId: "classical",
        targetTaskId: "quantum"
      }
    ],
    assumptions: [
      "Editable logical starter. Default values are illustrative and may be replaced by the user."
    ],
    metadata: { synchronization: "none" }
  },
  {
    schemaVersion: 1,
    id: "custom-logical-run",
    workflowId: "custom-logical-compiled",
    resources: [
      { id: "cpu", kind: "cpu", capacity: 4 },
      { id: "qpu", kind: "qpu", capacity: 1 }
    ],
    taskResources: {
      classical: { resourcePoolId: "cpu", resourceCount: 1 },
      quantum: { resourcePoolId: "qpu", resourceCount: 1 }
    },
    policy: {
      allocation: "release-aware",
      maxInFlightQuantumByPool: { qpu: 1 }
    }
  },
  {
    schemaVersion: 1,
    id: "custom-logical-profile",
    taskServiceTimes: {
      classical: {
        value: { kind: "constant", seconds: 1 },
        provenance: synthetic(
          "Custom starter",
          "Initial illustrative service time; Builder edits become user-entered provenance."
        )
      },
      quantum: {
        value: { kind: "constant", seconds: 1 },
        provenance: synthetic(
          "Custom starter",
          "Initial illustrative service time; Builder edits become user-entered provenance."
        )
      }
    }
  }
);

const scenarioA = bundle(
  {
    schemaVersion: 1,
    id: "qamp-a-logical-design",
    name: "QAMP A — loosely coupled overlap",
    tasks: [
      {
        id: "independent-classical",
        label: "Independent classical work",
        timingKey: "independent-classical",
        semanticType: "classical-independent"
      },
      {
        id: "quantum-prep",
        label: "Local quantum preparation",
        timingKey: "quantum-prep",
        semanticType: "quantum-preparation"
      },
      {
        id: "quantum-run",
        label: "Local quantum evaluation",
        timingKey: "quantum-run",
        semanticType: "quantum-evaluation"
      },
      {
        id: "local-consumer",
        label: "Local quantum-result consumer",
        timingKey: "local-consumer",
        semanticType: "classical-continuation"
      }
    ],
    dependencies: [
      {
        id: "a-prep-run",
        sourceTaskId: "quantum-prep",
        targetTaskId: "quantum-run"
      },
      {
        id: "a-run-consumer",
        sourceTaskId: "quantum-run",
        targetTaskId: "local-consumer"
      }
    ],
    assumptions: [
      "Synthetic logical Scenario A: quantum-dependent work is local and off the overall critical path."
    ],
    metadata: { synchronization: "none" }
  },
  {
    schemaVersion: 1,
    id: "qamp-a-logical-run",
    workflowId: "qamp-a-logical-compiled",
    resources: [
      { id: "cpu", kind: "cpu", capacity: 2 },
      { id: "qpu", kind: "qpu", capacity: 1 }
    ],
    taskResources: {
      "independent-classical": { resourcePoolId: "cpu", resourceCount: 1 },
      "quantum-prep": { resourcePoolId: "cpu", resourceCount: 1 },
      "quantum-run": { resourcePoolId: "qpu", resourceCount: 1 },
      "local-consumer": { resourcePoolId: "cpu", resourceCount: 1 }
    },
    policy: { allocation: "release-aware" }
  },
  {
    schemaVersion: 1,
    id: "qamp-a-logical-profile",
    taskServiceTimes: {
      "independent-classical": {
        value: { kind: "constant", seconds: 10 },
        provenance: synthetic("QAMP A acceptance", "Critical-path classical duration.")
      },
      "quantum-prep": {
        value: { kind: "constant", seconds: 1 },
        provenance: synthetic("QAMP A acceptance", "Illustrative preparation duration.")
      },
      "quantum-run": {
        value: { kind: "constant", seconds: 4 },
        provenance: synthetic("QAMP A acceptance", "Illustrative QPU service duration.")
      },
      "local-consumer": {
        value: { kind: "constant", seconds: 1 },
        provenance: synthetic("QAMP A acceptance", "Illustrative result-consumption duration.")
      }
    },
    assumptions: ["Synthetic acceptance profile; not measured production performance."]
  }
);

const scenarioB = bundle(
  structuredClone(qampScenarioBActorDesign),
  structuredClone(qampScenarioBActorRunConfiguration),
  structuredClone(qampScenarioBActorSystemProfile)
);

const scenarioC = bundle(
  {
    schemaVersion: 1,
    id: "qamp-c-logical-design",
    name: "QAMP C — communication/data-movement wall",
    tasks: [
      {
        id: "producer",
        label: "Independent producer",
        multiplicity: 3,
        timingKey: "producer",
        semanticType: "classical-producer"
      },
      {
        id: "quantum",
        label: "Quantum evaluation",
        multiplicity: 3,
        timingKey: "quantum",
        semanticType: "quantum-evaluation"
      },
      {
        id: "consumer",
        label: "Independent result consumer",
        multiplicity: 3,
        timingKey: "consumer",
        semanticType: "classical-continuation"
      }
    ],
    dependencies: [
      {
        id: "c-producer-quantum",
        sourceTaskId: "producer",
        targetTaskId: "quantum",
        instanceMapping: "pairwise",
        communicationKey: "producer-quantum"
      },
      {
        id: "c-quantum-consumer",
        sourceTaskId: "quantum",
        targetTaskId: "consumer",
        instanceMapping: "pairwise",
        communicationKey: "quantum-consumer"
      }
    ],
    assumptions: [
      "Synthetic compact Scenario C: communication dominates service time; independent paths have no global barrier."
    ],
    metadata: { synchronization: "none" }
  },
  {
    schemaVersion: 1,
    id: "qamp-c-logical-run",
    workflowId: "qamp-c-logical-compiled",
    resources: [
      { id: "cpu", kind: "cpu", capacity: 3 },
      { id: "qpu", kind: "qpu", capacity: 3 }
    ],
    taskResources: {
      producer: { resourcePoolId: "cpu", resourceCount: 1 },
      quantum: { resourcePoolId: "qpu", resourceCount: 1 },
      consumer: { resourcePoolId: "cpu", resourceCount: 1 }
    },
    policy: { allocation: "release-aware" }
  },
  {
    schemaVersion: 1,
    id: "qamp-c-logical-profile",
    taskServiceTimes: {
      producer: {
        value: { kind: "constant", seconds: 1 },
        provenance: synthetic("QAMP C logical preset", "Illustrative producer duration.")
      },
      quantum: {
        value: { kind: "constant", seconds: 0.5 },
        provenance: synthetic("QAMP C logical preset", "Illustrative short QPU duration.")
      },
      consumer: {
        value: { kind: "constant", seconds: 0.5 },
        provenance: synthetic("QAMP C logical preset", "Illustrative consumer duration.")
      }
    },
    dependencyCommunication: {
      "producer-quantum": {
        value: { fixedLatencyS: 8 },
        provenance: synthetic(
          "QAMP C logical preset",
          "Synthetic communication delay chosen to dominate task service time; not provider queue delay."
        )
      },
      "quantum-consumer": {
        value: { fixedLatencyS: 4 },
        provenance: synthetic(
          "QAMP C logical preset",
          "Synthetic result-transfer delay; not provider queue delay."
        )
      }
    },
    assumptions: [
      "Compact logical Scenario C preserves the communication-dominated/no-global-sync mechanism; timings are synthetic."
    ]
  }
);

const scenarioD = bundle(
  {
    schemaVersion: 1,
    id: "qamp-d-logical-design",
    name: "QAMP D — throughput-limited asynchronous workflow",
    tasks: [
      {
        id: "prep",
        label: "Preparation",
        multiplicity: 6,
        timingKey: "prep",
        semanticType: "quantum-preparation"
      },
      {
        id: "quantum",
        label: "Quantum evaluation",
        multiplicity: 6,
        timingKey: "quantum",
        semanticType: "quantum-evaluation"
      },
      {
        id: "consumer",
        label: "Classical continuation",
        multiplicity: 6,
        timingKey: "consumer",
        semanticType: "classical-continuation"
      }
    ],
    dependencies: [
      {
        id: "d-prep-quantum",
        sourceTaskId: "prep",
        targetTaskId: "quantum",
        instanceMapping: "pairwise"
      },
      {
        id: "d-quantum-consumer",
        sourceTaskId: "quantum",
        targetTaskId: "consumer",
        instanceMapping: "pairwise"
      }
    ],
    assumptions: [
      "Synthetic compact Scenario D: six independent paths share one QPU with bounded in-flight quantum work."
    ],
    metadata: { synchronization: "none" }
  },
  {
    schemaVersion: 1,
    id: "qamp-d-logical-run",
    workflowId: "qamp-d-logical-compiled",
    resources: [
      { id: "cpu", kind: "cpu", capacity: 6 },
      { id: "qpu", kind: "qpu", capacity: 1 }
    ],
    taskResources: {
      prep: { resourcePoolId: "cpu", resourceCount: 1 },
      quantum: { resourcePoolId: "qpu", resourceCount: 1 },
      consumer: { resourcePoolId: "cpu", resourceCount: 1 }
    },
    policy: {
      allocation: "release-aware",
      maxInFlightQuantumByPool: { qpu: 2 }
    }
  },
  {
    schemaVersion: 1,
    id: "qamp-d-logical-profile",
    taskServiceTimes: {
      prep: {
        value: { kind: "constant", seconds: 0.5 },
        provenance: synthetic("QAMP D acceptance", "Illustrative path preparation.")
      },
      quantum: {
        value: { kind: "constant", seconds: 2 },
        provenance: synthetic("QAMP D acceptance", "Illustrative serialized QPU service.")
      },
      consumer: {
        value: { kind: "constant", seconds: 0.5 },
        provenance: synthetic("QAMP D acceptance", "Illustrative local continuation.")
      }
    },
    assumptions: ["No global synchronization or external/provider queue delay is modeled."]
  }
);

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
    designBundle: custom
  },
  {
    key: "scenario-a",
    label: "Scenario A",
    description: "Local overlap: QPU path remains off the overall critical path.",
    source: "design",
    designBundle: scenarioA
  },
  {
    key: "scenario-b",
    label: "Scenario B",
    description: "Actor-aware synchronization wall with 4 persistent MPI ranks.",
    source: "design",
    designBundle: scenarioB
  },
  {
    key: "scenario-c",
    label: "Scenario C",
    description: "Compact communication/data-movement wall with independent paths.",
    source: "design",
    designBundle: scenarioC
  },
  {
    key: "scenario-d",
    label: "Scenario D",
    description: "Compact asynchronous pipeline with QPU queue and separate policy hold.",
    source: "design",
    designBundle: scenarioD
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
