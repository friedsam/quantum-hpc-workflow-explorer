import { compileWorkflowDesign } from "../design/compile.mjs";

export const qampScenarioADesign = {
  schemaVersion: 1,
  id: "qamp-a-design",
  name: "QAMP A — loosely coupled overlap",
  actorGroups: [
    {
      id: "independent-workers",
      label: "Independent classical workers",
      metadata: { role: "classical-background-work" },
    },
    {
      id: "quantum-path",
      label: "Quantum-dependent actor group",
      metadata: { role: "local-quantum-path" },
    },
  ],
  tasks: [
    {
      id: "independent-classical",
      label: "Independent classical work",
      timingKey: "independent-classical",
      semanticType: "classical-independent",
      actorGroupIds: ["independent-workers"],
    },
    {
      id: "quantum-prep",
      label: "Local quantum preparation",
      timingKey: "quantum-prep",
      semanticType: "quantum-preparation",
      actorGroupIds: ["quantum-path"],
    },
    {
      id: "quantum-run",
      label: "Local quantum evaluation",
      timingKey: "quantum-run",
      semanticType: "quantum-evaluation",
      actorGroupIds: ["quantum-path"],
    },
    {
      id: "local-consumer",
      label: "Local quantum-result consumer",
      timingKey: "local-consumer",
      semanticType: "classical-consumer",
      actorGroupIds: ["quantum-path"],
    },
  ],
  dependencies: [
    {
      id: "prep-run",
      sourceTaskId: "quantum-prep",
      targetTaskId: "quantum-run",
    },
    {
      id: "run-consumer",
      sourceTaskId: "quantum-run",
      targetTaskId: "local-consumer",
    },
  ],
  assumptions: [
    "QAMP Scenario A semantic design: quantum-dependent work is local; no global barrier.",
  ],
};

export const qampScenarioARunConfiguration = {
  schemaVersion: 1,
  id: "qamp-a-scaled-run",
  workflowId: "qamp-a-compiled",
  name: "scaled acceptance run",
  resources: [
    { id: "cpu", kind: "cpu", capacity: 2 },
    { id: "qpu", kind: "qpu", capacity: 1 },
  ],
  taskResources: {
    "independent-classical": { resourcePoolId: "cpu", resourceCount: 1 },
    "quantum-prep": { resourcePoolId: "cpu", resourceCount: 1 },
    "quantum-run": { resourcePoolId: "qpu", resourceCount: 1 },
    "local-consumer": { resourcePoolId: "cpu", resourceCount: 1 },
  },
  policy: { allocation: "release-aware" },
  actorGroupCounts: {
    "independent-workers": 1,
    "quantum-path": 1,
  },
  assumptions: [
    "Resource capacities/counts are synthetic acceptance values.",
  ],
};

const synthetic = (notes) => ({
  kind: "synthetic",
  source: "QAMP Scenario A acceptance fixture",
  notes,
});

export const qampScenarioASystemProfile = {
  schemaVersion: 1,
  id: "qamp-a-synthetic-profile",
  name: "Synthetic QAMP A profile",
  costPerUnitSecond: {
    cpu: {
      value: 0.01,
      provenance: synthetic("Illustrative CPU cost rate; not provider billing."),
    },
    qpu: {
      value: 0.2,
      provenance: synthetic("Illustrative QPU cost rate; not provider billing."),
    },
  },
  taskServiceTimes: {
    "independent-classical": {
      value: { kind: "constant", seconds: 10 },
      provenance: synthetic("Chosen so independent classical work defines the critical path."),
    },
    "quantum-prep": {
      value: { kind: "constant", seconds: 1 },
      provenance: synthetic("Illustrative preparation duration."),
    },
    "quantum-run": {
      value: { kind: "constant", seconds: 4 },
      provenance: synthetic("Illustrative QPU service duration; not provider data."),
    },
    "local-consumer": {
      value: { kind: "constant", seconds: 1 },
      provenance: synthetic("Illustrative local result-consumption duration."),
    },
  },
  assumptions: [
    "All service times are synthetic constants; this profile is not a hardware benchmark.",
  ],
};

export const qampScenarioACompiled = compileWorkflowDesign(
  qampScenarioADesign,
  qampScenarioARunConfiguration,
  qampScenarioASystemProfile
);

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(qampScenarioACompiled, null, 2));
}
