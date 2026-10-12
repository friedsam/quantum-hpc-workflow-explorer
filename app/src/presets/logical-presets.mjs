import {
  qampScenarioA1000Design,
  qampScenarioA1000RunConfiguration,
  qampScenarioA1000Profile
} from "./qamp-a-1000-demo.mjs";
import {
  qampScenarioBActorDesign,
  qampScenarioBActorRunConfiguration,
  qampScenarioBActorSystemProfile
} from "./qamp-b-actor.mjs";

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
  design: structuredClone(qampScenarioBActorDesign),
  runConfiguration: structuredClone(qampScenarioBActorRunConfiguration),
  systemProfile: structuredClone(qampScenarioBActorSystemProfile)
};

export const scenarioCLogicalBundle = {
  design: {
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
  runConfiguration: {
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
  systemProfile: {
    schemaVersion: 1,
    id: "qamp-c-logical-profile",
    taskServiceTimes: {
      producer: {
        value: { kind: "constant", seconds: 1 },
        provenance: synthetic(
          "QAMP C logical preset",
          "Illustrative producer duration."
        )
      },
      quantum: {
        value: { kind: "constant", seconds: 0.5 },
        provenance: synthetic(
          "QAMP C logical preset",
          "Illustrative short QPU duration."
        )
      },
      consumer: {
        value: { kind: "constant", seconds: 0.5 },
        provenance: synthetic(
          "QAMP C logical preset",
          "Illustrative consumer duration."
        )
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
