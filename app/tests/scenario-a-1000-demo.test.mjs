import test from "node:test";
import assert from "node:assert/strict";

import { simulateWorkflow } from "../src/engine/runtime.mjs";
import {
  compileWorkflowDesignDetailed,
} from "../src/design/compiler.mjs";
import {
  deriveActorStateAt,
  deriveActorStateCountsAt,
} from "../src/design/actor-state.mjs";
import {
  qampScenarioA1000Design,
  qampScenarioA1000RunConfiguration,
  qampScenarioA1000Profile,
  qampScenarioA1000Compilation,
  qampScenarioA1000WorkflowSpec,
} from "../src/presets/qamp-a-1000-demo.mjs";

function eventTime(result, type, taskId) {
  return result.events.find(
    (event) =>
      event.type === type &&
      event.taskId === taskId
  )?.simTimeS;
}

function resourceActiveAt(result, poolId, simTimeS) {
  return result.resourceIntervals.some(
    (interval) =>
      interval.resourcePoolId === poolId &&
      interval.state === "active" &&
      interval.startS <= simTimeS &&
      simTimeS < interval.endS
  );
}

test("1000-rank Scenario A remains compact and keeps actor/task/resource counts distinct", () => {
  const { workflowSpec, manifest } =
    qampScenarioA1000Compilation;

  assert.equal(
    qampScenarioA1000RunConfiguration.actorGroupCounts.ranks,
    1000
  );
  assert.equal(qampScenarioA1000Design.tasks.length, 4);
  assert.equal(workflowSpec.tasks.length, 4);

  assert.equal(
    workflowSpec.tasks.find(
      (task) => task.id === "classical-background"
    ).resourceCount,
    999
  );
  assert.equal(
    workflowSpec.tasks.find(
      (task) => task.id === "classical-background"
    ).metadata.logicalMultiplicity,
    1
  );

  assert.deepEqual(
    manifest.tasks["classical-background"]
      .actorAssignments[0].selection,
    {
      kind: "all-except",
      actorOrdinals: [1],
    }
  );
  assert.deepEqual(
    manifest.tasks.submit.actorAssignments[0].selection,
    {
      kind: "range",
      startActorOrdinal: 1,
      endActorOrdinal: 1,
    }
  );
  assert.deepEqual(
    manifest.actorWaits["rank-1-result-wait"].selection,
    {
      kind: "range",
      startActorOrdinal: 1,
      endActorOrdinal: 1,
    }
  );

  assert.equal(
    JSON.stringify(
      manifest.tasks["classical-background"]
        .actorAssignments[0].selection
    ).includes("1000"),
    false
  );
});

test("1000-rank Scenario A matches tutorial-scale actor snapshots and stays queue-free", () => {
  const { manifest, workflowSpec } =
    qampScenarioA1000Compilation;
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
      working: 1000,
      blocked: 0,
      idle: 0,
    }
  );

  assert.deepEqual(
    deriveActorStateCountsAt(
      manifest,
      result,
      "ranks",
      1.5
    ),
    {
      actorGroupId: "ranks",
      simTimeS: 1.5,
      working: 999,
      blocked: 1,
      idle: 0,
    }
  );

  for (const simTimeS of [4, 7]) {
    assert.deepEqual(
      deriveActorStateCountsAt(
        manifest,
        result,
        "ranks",
        simTimeS
      ),
      {
        actorGroupId: "ranks",
        simTimeS,
        working: 1000,
        blocked: 0,
        idle: 0,
      }
    );
    assert.equal(
      resourceActiveAt(result, "qpu", simTimeS),
      false
    );
  }

  assert.equal(
    deriveActorStateAt(
      manifest,
      result,
      "ranks",
      1000,
      1.5
    ),
    "working"
  );

  assert.equal(
    result.metrics.queueWaitSecondsByPool.qpu,
    0
  );
  assert.equal(
    result.metrics.admissionWaitSecondsByPool.qpu,
    0
  );
  assert.equal(
    workflowSpec.policy.maxInFlightQuantumByPool,
    undefined
  );
  assert.equal(
    Object.values(manifest.actorWaits).some(
      (wait) => wait.selection.kind === "all"
    ),
    false
  );
});

test("1000-rank Scenario A quantum branch is strictly off the critical path", () => {
  const result = simulateWorkflow(
    qampScenarioA1000WorkflowSpec
  );

  const localComplete = eventTime(
    result,
    "task_completed",
    "local-resume"
  );
  const backgroundComplete = eventTime(
    result,
    "task_completed",
    "classical-background"
  );

  assert.equal(localComplete, 8);
  assert.equal(backgroundComplete, 10);
  assert.equal(result.metrics.makespanS, 10);
  assert.ok(localComplete < backgroundComplete);
});

test("range selector validates positive ordered in-range bounds", () => {
  const invalidStart = structuredClone(
    qampScenarioA1000Design
  );
  invalidStart.tasks[1].actorParticipation[0].selection = {
    kind: "range",
    startActorOrdinal: 0,
    endActorOrdinal: 1,
  };
  assert.throws(
    () =>
      compileWorkflowDesignDetailed(
        invalidStart,
        qampScenarioA1000RunConfiguration,
        qampScenarioA1000Profile
      ),
    /range bounds must be positive integers/
  );

  const reversed = structuredClone(
    qampScenarioA1000Design
  );
  reversed.tasks[1].actorParticipation[0].selection = {
    kind: "range",
    startActorOrdinal: 2,
    endActorOrdinal: 1,
  };
  assert.throws(
    () =>
      compileWorkflowDesignDetailed(
        reversed,
        qampScenarioA1000RunConfiguration,
        qampScenarioA1000Profile
      ),
    /start <= end/
  );

  const outOfRange = structuredClone(
    qampScenarioA1000Design
  );
  outOfRange.tasks[1].actorParticipation[0].selection = {
    kind: "range",
    startActorOrdinal: 1,
    endActorOrdinal: 1001,
  };
  assert.throws(
    () =>
      compileWorkflowDesignDetailed(
        outOfRange,
        qampScenarioA1000RunConfiguration,
        qampScenarioA1000Profile
      ),
    /range end 1001 exceeds actor count 1000/
  );
});

test("all-except selector validates unique in-range exclusions", () => {
  const duplicate = structuredClone(
    qampScenarioA1000Design
  );
  duplicate.tasks[0].actorParticipation[0].selection = {
    kind: "all-except",
    actorOrdinals: [1, 1],
  };
  assert.throws(
    () =>
      compileWorkflowDesignDetailed(
        duplicate,
        qampScenarioA1000RunConfiguration,
        qampScenarioA1000Profile
      ),
    /unique positive integers/
  );

  const outOfRange = structuredClone(
    qampScenarioA1000Design
  );
  outOfRange.tasks[0].actorParticipation[0].selection = {
    kind: "all-except",
    actorOrdinals: [1001],
  };
  assert.throws(
    () =>
      compileWorkflowDesignDetailed(
        outOfRange,
        qampScenarioA1000RunConfiguration,
        qampScenarioA1000Profile
      ),
    /actor ordinal 1001 exceeds actor count 1000/
  );
});
