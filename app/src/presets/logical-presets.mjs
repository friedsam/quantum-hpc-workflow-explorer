import {
  qampScenarioA1000Design,
  qampScenarioA1000RunConfiguration,
  qampScenarioA1000Profile
} from "./qamp-a-1000-demo.mjs";
import {
  qampScenarioB200Design,
  qampScenarioB200RunConfiguration,
  qampScenarioB200Profile
} from "./qamp-b-200-demo.mjs";
import {
  qampScenarioC1000Design,
  qampScenarioC1000RunConfiguration,
  qampScenarioC1000Profile
} from "./qamp-c-1000-demo.mjs";

const synthetic = (source, notes) => ({
  kind: "synthetic",
  source,
  notes
});

export const customLogicalBundle = {
  design: {
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
  runConfiguration: {
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
  systemProfile: {
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
};

export const scenarioALogicalBundle = {
  design: structuredClone(qampScenarioA1000Design),
  runConfiguration: structuredClone(qampScenarioA1000RunConfiguration),
  systemProfile: structuredClone(qampScenarioA1000Profile)
};

export const scenarioBLogicalBundle = {
  design: structuredClone(qampScenarioB200Design),
  runConfiguration: structuredClone(qampScenarioB200RunConfiguration),
  systemProfile: structuredClone(qampScenarioB200Profile)
};

export const scenarioCLogicalBundle = {
  design: structuredClone(qampScenarioC1000Design),
  runConfiguration: structuredClone(qampScenarioC1000RunConfiguration),
  systemProfile: structuredClone(qampScenarioC1000Profile)
};

export const scenarioDLogicalBundle = {
  design: {
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
  runConfiguration: {
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
  systemProfile: {
    schemaVersion: 1,
    id: "qamp-d-logical-profile",
    taskServiceTimes: {
      prep: {
        value: { kind: "constant", seconds: 0.5 },
        provenance: synthetic(
          "QAMP D acceptance",
          "Illustrative path preparation."
        )
      },
      quantum: {
        value: { kind: "constant", seconds: 2 },
        provenance: synthetic(
          "QAMP D acceptance",
          "Illustrative serialized QPU service."
        )
      },
      consumer: {
        value: { kind: "constant", seconds: 0.5 },
        provenance: synthetic(
          "QAMP D acceptance",
          "Illustrative local continuation."
        )
      }
    },
    assumptions: [
      "No global synchronization or external/provider queue delay is modeled."
    ]
  }
};

export const logicalPresetBundles = Object.freeze({
  custom: customLogicalBundle,
  A: scenarioALogicalBundle,
  B: scenarioBLogicalBundle,
  C: scenarioCLogicalBundle,
  D: scenarioDLogicalBundle
});
