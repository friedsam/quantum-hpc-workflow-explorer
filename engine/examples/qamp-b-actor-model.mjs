import { compileWorkflowDesignDetailed } from "../design/compile.mjs";

export const qampScenarioBActorDesign = {
  schemaVersion: 1,
  id: "qamp-b-actor-design",
  name: "QAMP B — synchronization wall with persistent actors",
  actorGroups: [
    {
      id: "ranks",
      label: "MPI ranks",
      kind: "mpi-rank",
      metadata: {
        semantics: "persistent logical MPI-rank identities for actor accounting",
      },
    },
  ],
  tasks: [
    {
      id: "prepare",
      label: "Subset preparation",
      multiplicity: 2,
      timingKey: "prepare",
      semanticType: "quantum-preparation",
      actorParticipation: [
        {
          actorGroupId: "ranks",
          selection: { kind: "one-per-instance" },
          stateDuringTask: "working",
        },
      ],
    },
    {
      id: "quantum",
      label: "Serialized quantum evaluation",
      multiplicity: 2,
      timingKey: "quantum",
      semanticType: "quantum-evaluation",
      actorParticipation: [
        {
          actorGroupId: "ranks",
          selection: { kind: "one-per-instance" },
          stateDuringTask: "blocked",
        },
      ],
    },
    {
      id: "collective",
      label: "Full collective continuation",
      timingKey: "collective",
      semanticType: "collective-classical",
      actorParticipation: [
        {
          actorGroupId: "ranks",
          selection: { kind: "all" },
          stateDuringTask: "working",
        },
      ],
    },
  ],
  dependencies: [
    {
      id: "prepare-quantum",
      sourceTaskId: "prepare",
      targetTaskId: "quantum",
      instanceMapping: "pairwise",
    },
    {
      id: "quantum-collective",
      sourceTaskId: "quantum",
      targetTaskId: "collective",
      instanceMapping: "all-to-all",
    },
  ],
  assumptions: [
    "Synthetic scaled Scenario B actor fixture; no provider queue model.",
    "Two of four persistent ranks prepare/submit quantum work; the later collective includes all four ranks.",
  ],
};

export const qampScenarioBActorRunConfiguration = {
  schemaVersion: 1,
  id: "qamp-b-actor-run",
  workflowId: "qamp-b-actor-compiled",
  resources: [
    { id: "cpu", kind: "cpu", capacity: 4 },
    { id: "qpu", kind: "qpu", capacity: 1 },
  ],
  taskResources: {
    prepare: { resourcePoolId: "cpu", resourceCount: 1 },
    quantum: { resourcePoolId: "qpu", resourceCount: 1 },
    collective: { resourcePoolId: "cpu", resourceCount: 4 },
  },
  policy: {
    allocation: "fixed",
    fixedReservationByPool: { cpu: 4 },
    maxInFlightQuantumByPool: { qpu: 2 },
  },
  actorGroupCounts: {
    ranks: 4,
  },
  assumptions: [
    "Task multiplicity, actor count, and resourceCount are independent inputs.",
  ],
};

const synthetic = (notes) => ({
  kind: "synthetic",
  source: "Round 4A Scenario B actor acceptance fixture",
  notes,
});

export const qampScenarioBActorSystemProfile = {
  schemaVersion: 1,
  id: "qamp-b-actor-profile",
  taskServiceTimes: {
    prepare: {
      value: { kind: "constant", seconds: 1 },
      provenance: synthetic("Illustrative subset preparation duration."),
    },
    quantum: {
      value: { kind: "constant", seconds: 3 },
      provenance: synthetic("Illustrative serialized QPU service duration."),
    },
    collective: {
      value: { kind: "constant", seconds: 1 },
      provenance: synthetic("Illustrative full collective duration."),
    },
  },
  assumptions: [
    "All service times are synthetic constants used only to expose Scenario B semantics.",
  ],
};

export const qampScenarioBActorCompilation = compileWorkflowDesignDetailed(
  qampScenarioBActorDesign,
  qampScenarioBActorRunConfiguration,
  qampScenarioBActorSystemProfile
);

export const qampScenarioBActorWorkflowSpec =
  qampScenarioBActorCompilation.workflowSpec;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(
    JSON.stringify(qampScenarioBActorCompilation, null, 2)
  );
}
