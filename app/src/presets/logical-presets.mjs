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
import {
  qampScenarioD1000Design,
  qampScenarioD1000RunConfiguration,
  qampScenarioD1000Profile
} from "./qamp-d-1000-demo.mjs";

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
  design: structuredClone(qampScenarioD1000Design),
  runConfiguration: structuredClone(qampScenarioD1000RunConfiguration),
  systemProfile: structuredClone(qampScenarioD1000Profile)
};

export const logicalPresetBundles = Object.freeze({
  custom: customLogicalBundle,
  A: scenarioALogicalBundle,
  B: scenarioBLogicalBundle,
  C: scenarioCLogicalBundle,
  D: scenarioDLogicalBundle
});
