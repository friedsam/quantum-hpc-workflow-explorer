import test from "node:test";
import assert from "node:assert/strict";

import { simulateWorkflow, validateWorkflowSpec } from "../index.mjs";
import {
  deriveActorStateAt,
  deriveActorStateCountsAt,
} from "../design/actor-state.mjs";
import {
  qampScenarioBActorDesign,
  qampScenarioBActorRunConfiguration,
  qampScenarioBActorCompilation,
  qampScenarioBActorWorkflowSpec,
} from "../examples/qamp-b-actor-model.mjs";

function startedAt(result, taskId) {
  return result.events.find(
    (event) => event.type === "task_started" && event.taskId === taskId
  )?.simTimeS;
}

test("Scenario B compact design keeps task multiplicity, actor count, and resourceCount distinct", () => {
  const { workflowSpec, manifest } = qampScenarioBActorCompilation;

  assert.equal(qampScenarioBActorDesign.tasks.length, 3);
  assert.equal(workflowSpec.tasks.length, 5);
  assert.equal(
    qampScenarioBActorRunConfiguration.actorGroupCounts.ranks,
    4
  );

  assert.deepEqual(
    workflowSpec.tasks.map((task) => [task.id, task.resourceCount]),
    [
      ["prepare#1", 1],
      ["prepare#2", 1],
      ["quantum#1", 1],
      ["quantum#2", 1],
      ["collective", 4],
    ]
  );

  assert.equal(manifest.actorGroups.ranks.count, 4);
  assert.equal(manifest.actorGroups.ranks.kind, "mpi-rank");

  assert.deepEqual(
    manifest.tasks["prepare#1"].actorAssignments,
    [
      {
        actorGroupId: "ranks",
        selection: { kind: "one", actorOrdinal: 1 },
        stateDuringTask: "working",
      },
    ]
  );
  assert.deepEqual(
    manifest.tasks["quantum#1"].actorAssignments,
    [
      {
        actorGroupId: "ranks",
        selection: { kind: "one", actorOrdinal: 1 },
        stateDuringTask: "blocked",
      },
    ]
  );
  assert.deepEqual(
    manifest.tasks.collective.actorAssignments,
    [
      {
        actorGroupId: "ranks",
        selection: { kind: "all" },
        stateDuringTask: "working",
      },
    ]
  );
});

test("Scenario B logical multiplicity compiles to pairwise prep paths and a full-result collective join", () => {
  const { workflowSpec, manifest } = qampScenarioBActorCompilation;

  assert.equal(validateWorkflowSpec(workflowSpec), true);
  assert.deepEqual(
    workflowSpec.dependencies.map((dep) => [
      dep.id,
      dep.sourceTaskId,
      dep.targetTaskId,
    ]),
    [
      ["prepare-quantum#1", "prepare#1", "quantum#1"],
      ["prepare-quantum#2", "prepare#2", "quantum#2"],
      ["quantum-collective#1->1", "quantum#1", "collective"],
      ["quantum-collective#2->1", "quantum#2", "collective"],
    ]
  );

  assert.deepEqual(
    manifest.dependencies["quantum-collective#2->1"],
    {
      kind: "design-dependency",
      designDependencyId: "quantum-collective",
      sourceLogicalInstanceOrdinal: 2,
      targetLogicalInstanceOrdinal: 1,
      communicationKey: "quantum-collective",
    }
  );
});

test("Scenario B remains QPU-serialized and collective continuation waits for both results", () => {
  const result = simulateWorkflow(qampScenarioBActorWorkflowSpec);

  assert.equal(startedAt(result, "prepare#1"), 0);
  assert.equal(startedAt(result, "prepare#2"), 0);
  assert.equal(startedAt(result, "quantum#1"), 1);
  assert.equal(startedAt(result, "quantum#2"), 4);
  assert.equal(startedAt(result, "collective"), 7);
  assert.equal(result.metrics.makespanS, 8);

  assert.equal(result.metrics.queueWaitSecondsByPool.qpu, 3);
  assert.equal(result.metrics.admissionWaitSecondsByPool.qpu, 0);
  assert.equal(
    result.events.filter((event) => event.type === "task_throttled").length,
    0
  );
});

test("Scenario B persistent actor Working/Blocked/Idle states are derivable without rank nodes in WorkflowSpec", () => {
  const { manifest, workflowSpec } = qampScenarioBActorCompilation;
  const result = simulateWorkflow(workflowSpec);

  assert.deepEqual(
    deriveActorStateCountsAt(manifest, result, "ranks", 0.5),
    {
      actorGroupId: "ranks",
      simTimeS: 0.5,
      working: 2,
      blocked: 0,
      idle: 2,
    }
  );

  assert.deepEqual(
    deriveActorStateCountsAt(manifest, result, "ranks", 2),
    {
      actorGroupId: "ranks",
      simTimeS: 2,
      working: 0,
      blocked: 2,
      idle: 2,
    }
  );

  assert.deepEqual(
    deriveActorStateCountsAt(manifest, result, "ranks", 5),
    {
      actorGroupId: "ranks",
      simTimeS: 5,
      working: 0,
      blocked: 1,
      idle: 3,
    }
  );

  assert.equal(
    deriveActorStateAt(manifest, result, "ranks", 1, 5),
    "idle"
  );
  assert.equal(
    deriveActorStateAt(manifest, result, "ranks", 2, 5),
    "blocked"
  );

  assert.deepEqual(
    deriveActorStateCountsAt(manifest, result, "ranks", 7.5),
    {
      actorGroupId: "ranks",
      simTimeS: 7.5,
      working: 4,
      blocked: 0,
      idle: 0,
    }
  );

  assert.equal(workflowSpec.tasks.length, 5);
  assert.equal(manifest.actorGroups.ranks.count, 4);
});
