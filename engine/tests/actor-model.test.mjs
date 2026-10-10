import test from "node:test";
import assert from "node:assert/strict";

import { simulateWorkflow, validateWorkflowSpec } from "../index.mjs";
import {
  deriveActorStateAt,
  deriveActorStateDetailAt,
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
    (event) =>
      event.type === "task_started" &&
      event.taskId === taskId
  )?.simTimeS;
}

test("Scenario B compact design keeps task multiplicity, actor count, and resourceCount distinct", () => {
  const { workflowSpec, manifest } =
    qampScenarioBActorCompilation;

  assert.equal(qampScenarioBActorDesign.tasks.length, 3);
  assert.equal(workflowSpec.tasks.length, 5);
  assert.equal(
    qampScenarioBActorRunConfiguration.actorGroupCounts.ranks,
    4
  );

  assert.deepEqual(
    workflowSpec.tasks.map((task) => [
      task.id,
      task.resourceCount,
    ]),
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
  assert.equal(
    manifest.tasks["quantum#1"].actorAssignments,
    undefined
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

test("Scenario B actor wait manifest separates result waits from task participation", () => {
  const { manifest } = qampScenarioBActorCompilation;

  assert.deepEqual(
    manifest.actorWaits["submitter-result-wait#1"],
    {
      designWaitId: "submitter-result-wait",
      actorGroupId: "ranks",
      selection: { kind: "one", actorOrdinal: 1 },
      logicalInstanceOrdinal: 1,
      activation: {
        eventType: "task_completed",
        taskIds: ["prepare#1"],
        quantifier: "all",
      },
      release: {
        eventType: "task_completed",
        taskIds: ["quantum#1"],
        quantifier: "all",
      },
      reason: "quantum-result",
    }
  );

  assert.deepEqual(
    manifest.actorWaits["global-result-gate"],
    {
      designWaitId: "global-result-gate",
      actorGroupId: "ranks",
      selection: { kind: "all" },
      activation: {
        eventType: "task_completed",
        taskIds: ["quantum#1", "quantum#2"],
        quantifier: "any",
      },
      release: {
        eventType: "task_completed",
        taskIds: ["quantum#1", "quantum#2"],
        quantifier: "all",
      },
      reason: "global-synchronization",
    }
  );
});

test("Scenario B logical multiplicity compiles to pairwise prep paths and a full-result collective join", () => {
  const { workflowSpec, manifest } =
    qampScenarioBActorCompilation;

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
      [
        "quantum-collective#1->1",
        "quantum#1",
        "collective",
      ],
      [
        "quantum-collective#2->1",
        "quantum#2",
        "collective",
      ],
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

test("Scenario B serialized quantum phase has no resource-queue wait and collective waits for both results", () => {
  const result = simulateWorkflow(
    qampScenarioBActorWorkflowSpec
  );

  assert.equal(startedAt(result, "prepare#1"), 0);
  assert.equal(startedAt(result, "prepare#2"), 0);
  assert.equal(startedAt(result, "quantum#1"), 1);
  assert.equal(startedAt(result, "quantum#2"), 4);
  assert.equal(startedAt(result, "collective"), 7);
  assert.equal(result.metrics.makespanS, 8);

  assert.equal(result.metrics.queueWaitSecondsByPool.qpu, 0);
  assert.equal(
    result.metrics.admissionWaitSecondsByPool.qpu,
    3
  );
  assert.equal(
    result.events.filter(
      (event) =>
        event.type === "task_throttled" &&
        event.taskId === "quantum#2"
    ).length,
    1
  );
  assert.equal(
    result.taskIntervals.some(
      (interval) =>
        interval.taskId === "quantum#2" &&
        interval.state === "queued"
    ),
    false
  );
});

test("Scenario B scaled actor sequence is subset working -> submitters blocked -> all blocked -> all working", () => {
  const { manifest, workflowSpec } =
    qampScenarioBActorCompilation;
  const result = simulateWorkflow(workflowSpec);

  assert.deepEqual(
    deriveActorStateCountsAt(
      manifest,
      result,
      "ranks",
      0.5
    ),
    {
      actorGroupId: "ranks",
      simTimeS: 0.5,
      working: 2,
      blocked: 0,
      idle: 2,
    }
  );

  assert.deepEqual(
    deriveActorStateCountsAt(
      manifest,
      result,
      "ranks",
      2
    ),
    {
      actorGroupId: "ranks",
      simTimeS: 2,
      working: 0,
      blocked: 2,
      idle: 2,
    }
  );

  assert.deepEqual(
    deriveActorStateCountsAt(
      manifest,
      result,
      "ranks",
      5
    ),
    {
      actorGroupId: "ranks",
      simTimeS: 5,
      working: 0,
      blocked: 4,
      idle: 0,
    }
  );

  assert.deepEqual(
    deriveActorStateCountsAt(
      manifest,
      result,
      "ranks",
      7.5
    ),
    {
      actorGroupId: "ranks",
      simTimeS: 7.5,
      working: 4,
      blocked: 0,
      idle: 0,
    }
  );
});

test("overlapping blocked claims coalesce reasons while working+blocked remains an error", () => {
  const { manifest, workflowSpec } =
    qampScenarioBActorCompilation;
  const result = simulateWorkflow(workflowSpec);

  assert.deepEqual(
    deriveActorStateDetailAt(
      manifest,
      result,
      "ranks",
      1,
      5
    ),
    {
      actorGroupId: "ranks",
      actorOrdinal: 1,
      simTimeS: 5,
      state: "blocked",
      blockedReasons: ["global-synchronization"],
    }
  );

  assert.deepEqual(
    deriveActorStateDetailAt(
      manifest,
      result,
      "ranks",
      2,
      5
    ),
    {
      actorGroupId: "ranks",
      actorOrdinal: 2,
      simTimeS: 5,
      state: "blocked",
      blockedReasons: [
        "global-synchronization",
        "quantum-result",
      ],
    }
  );

  assert.equal(
    deriveActorStateAt(
      manifest,
      result,
      "ranks",
      3,
      5
    ),
    "blocked"
  );

  const conflictingManifest = structuredClone(manifest);
  conflictingManifest.actorWaits["global-result-gate"].release = {
    eventType: "task_completed",
    taskIds: ["collective"],
    quantifier: "all",
  };

  assert.throws(
    () =>
      deriveActorStateDetailAt(
        conflictingManifest,
        result,
        "ranks",
        1,
        7.5
      ),
    /both working and blocked/
  );
});
