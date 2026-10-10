import test from "node:test";
import assert from "node:assert/strict";

import { simulateWorkflow } from "../index.mjs";
import {
  compileWorkflowDesignDetailed,
} from "../design/compile.mjs";
import {
  deriveActorStateAt,
  deriveActorStateCountsAt,
} from "../design/actor-state.mjs";
import {
  qampScenarioAActorDesign,
  qampScenarioAActorRunConfiguration,
  qampScenarioABaselineProfile,
  qampScenarioALongQuantumProfile,
  qampScenarioAActorCompilation,
  qampScenarioAMultiRequestDesign,
  qampScenarioAMultiRequestRunConfiguration,
  qampScenarioAMultiBelowCapacityProfile,
  qampScenarioAMultiOverloadProfile,
  compileScenarioAProfile,
  compileScenarioAMultiProfile,
} from "../examples/qamp-a-actor-regimes.mjs";
import {
  qampScenarioBActorCompilation,
} from "../examples/qamp-b-actor-model.mjs";

function eventTime(result, type, taskId) {
  return result.events.find(
    (event) =>
      event.type === type &&
      event.taskId === taskId
  )?.simTimeS;
}

function runningInterval(result, taskId) {
  return result.taskIntervals.find(
    (interval) =>
      interval.taskId === taskId &&
      interval.state === "running"
  );
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

function maxQueueDepth(result, poolId) {
  return Math.max(
    0,
    ...result.queueSeries
      .filter(
        (sample) => sample.resourcePoolId === poolId
      )
      .map((sample) => sample.depth)
  );
}

test("Scenario A explicit ordinal selection gives one blocked submitter while complementary ranks keep working", () => {
  const { workflowSpec, manifest } =
    qampScenarioAActorCompilation;
  const result = simulateWorkflow(workflowSpec);

  assert.equal(qampScenarioAActorDesign.tasks.length, 4);
  assert.equal(workflowSpec.tasks.length, 4);
  assert.equal(manifest.actorGroups.ranks.count, 4);

  assert.deepEqual(
    manifest.tasks["classical-background"].actorAssignments,
    [
      {
        actorGroupId: "ranks",
        selection: {
          kind: "ordinals",
          actorOrdinals: [2, 3, 4],
        },
        stateDuringTask: "working",
      },
    ]
  );
  assert.deepEqual(
    manifest.tasks.submit.actorAssignments,
    [
      {
        actorGroupId: "ranks",
        selection: {
          kind: "ordinals",
          actorOrdinals: [1],
        },
        stateDuringTask: "working",
      },
    ]
  );
  assert.deepEqual(
    manifest.actorWaits["local-quantum-result"].selection,
    {
      kind: "ordinals",
      actorOrdinals: [1],
    }
  );

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
      working: 4,
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
      working: 3,
      blocked: 1,
      idle: 0,
    }
  );
  assert.deepEqual(
    deriveActorStateCountsAt(
      manifest,
      result,
      "ranks",
      4
    ),
    {
      actorGroupId: "ranks",
      simTimeS: 4,
      working: 4,
      blocked: 0,
      idle: 0,
    }
  );
  assert.equal(resourceActiveAt(result, "qpu", 4), false);
  assert.deepEqual(
    deriveActorStateCountsAt(manifest, result, "ranks", 7),
    { actorGroupId: "ranks", simTimeS: 7, working: 4, blocked: 0, idle: 0 }
  );

  assert.equal(
    qampScenarioAActorRunConfiguration.policy
      .maxInFlightQuantumByPool,
    undefined
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
    eventTime(result, "task_started", "local-consume"),
    3
  );
  assert.equal(
    eventTime(result, "task_completed", "local-consume"),
    8
  );
  assert.equal(
    eventTime(
      result,
      "task_completed",
      "classical-background"
    ),
    8
  );
  assert.ok(
    eventTime(result, "task_started", "local-consume") <
      eventTime(
        result,
        "task_completed",
        "classical-background"
      )
  );

  const background = runningInterval(
    result,
    "classical-background"
  );
  assert.equal(background.endS - background.startS, 8);
  assert.equal(
    workflowSpec.tasks.find(
      (task) => task.id === "classical-background"
    ).resourceCount,
    3
  );
});

test("longer QPU wall time with one local request lengthens only the local block, without queue or global wall", () => {
  const baseline = compileScenarioAProfile(
    qampScenarioABaselineProfile
  );
  const longer = compileScenarioAProfile(
    qampScenarioALongQuantumProfile
  );

  const baselineResult = simulateWorkflow(
    baseline.workflowSpec
  );
  const longerResult = simulateWorkflow(
    longer.workflowSpec
  );

  const baselineBlockedSeconds =
    eventTime(
      baselineResult,
      "task_completed",
      "quantum"
    ) -
    eventTime(
      baselineResult,
      "task_completed",
      "submit"
    );
  const longerBlockedSeconds =
    eventTime(
      longerResult,
      "task_completed",
      "quantum"
    ) -
    eventTime(
      longerResult,
      "task_completed",
      "submit"
    );

  assert.equal(baselineBlockedSeconds, 2);
  assert.equal(longerBlockedSeconds, 5);

  assert.equal(
    deriveActorStateAt(
      baseline.manifest,
      baselineResult,
      "ranks",
      1,
      4
    ),
    "working"
  );
  assert.equal(
    deriveActorStateAt(
      longer.manifest,
      longerResult,
      "ranks",
      1,
      4
    ),
    "blocked"
  );
  assert.equal(
    deriveActorStateAt(
      longer.manifest,
      longerResult,
      "ranks",
      2,
      4
    ),
    "working"
  );

  for (const result of [baselineResult, longerResult]) {
    assert.equal(
      result.metrics.queueWaitSecondsByPool.qpu,
      0
    );
    assert.equal(
      result.metrics.admissionWaitSecondsByPool.qpu,
      0
    );
  }

  assert.equal(
    Object.values(longer.manifest.actorWaits).some(
      (wait) =>
        wait.actorGroupId === "ranks" &&
        wait.selection.kind === "all"
    ),
    false
  );
});

test("fixed multi-request topology stays A-like when staggered offered load remains below QPU service capacity", () => {
  const compiled = compileScenarioAMultiProfile(
    qampScenarioAMultiBelowCapacityProfile
  );
  const result = simulateWorkflow(
    compiled.workflowSpec
  );

  assert.deepEqual(
    ["quantum-1", "quantum-2", "quantum-3"].map(
      (taskId) =>
        eventTime(
          result,
          "task_started",
          taskId
        )
    ),
    [1, 3, 5]
  );

  assert.equal(
    result.metrics.queueWaitSecondsByPool.qpu,
    0
  );
  assert.equal(
    result.metrics.admissionWaitSecondsByPool.qpu,
    0
  );
  assert.ok(maxQueueDepth(result, "qpu") <= 1);

  assert.equal(
    Object.values(compiled.manifest.actorWaits).some(
      (wait) => wait.selection.kind === "all"
    ),
    false
  );
});

test("same multi-request topology crosses into a queue/throughput regime from timing parameters alone", () => {
  const below = compileScenarioAMultiProfile(
    qampScenarioAMultiBelowCapacityProfile
  );
  const overloaded = compileScenarioAMultiProfile(
    qampScenarioAMultiOverloadProfile
  );

  assert.deepEqual(
    below.workflowSpec.tasks.map((task) => task.id),
    overloaded.workflowSpec.tasks.map(
      (task) => task.id
    )
  );
  assert.deepEqual(
    below.workflowSpec.dependencies.map(
      (dep) => [
        dep.id,
        dep.sourceTaskId,
        dep.targetTaskId,
      ]
    ),
    overloaded.workflowSpec.dependencies.map(
      (dep) => [
        dep.id,
        dep.sourceTaskId,
        dep.targetTaskId,
      ]
    )
  );
  assert.deepEqual(
    below.workflowSpec.policy,
    overloaded.workflowSpec.policy
  );

  const belowResult = simulateWorkflow(
    below.workflowSpec
  );
  const overloadResult = simulateWorkflow(
    overloaded.workflowSpec
  );

  assert.equal(
    belowResult.metrics.queueWaitSecondsByPool.qpu,
    0
  );
  assert.equal(
    overloadResult.metrics.queueWaitSecondsByPool.qpu,
    6
  );
  assert.equal(
    overloadResult.metrics.admissionWaitSecondsByPool.qpu,
    0
  );
  assert.equal(maxQueueDepth(overloadResult, "qpu"), 2);
  assert.deepEqual(
    ["quantum-1", "quantum-2", "quantum-3"].map(
      (taskId) =>
        eventTime(
          overloadResult,
          "task_started",
          taskId
        )
    ),
    [1, 4, 7]
  );
  assert.ok(
    overloadResult.metrics.utilizationByPool.qpu > 0.8
  );

  assert.equal(
    Object.values(overloaded.manifest.actorWaits).some(
      (wait) => wait.selection.kind === "all"
    ),
    false
  );
});

test("B-like global synchronization requires an explicit full-group gate; QPU timing alone does not create it", () => {
  const longA = compileScenarioAProfile(
    qampScenarioALongQuantumProfile
  );
  const longAResult = simulateWorkflow(
    longA.workflowSpec
  );

  assert.equal(
    Object.values(longA.manifest.actorWaits).some(
      (wait) => wait.selection.kind === "all"
    ),
    false
  );
  assert.notEqual(
    deriveActorStateCountsAt(
      longA.manifest,
      longAResult,
      "ranks",
      4
    ).blocked,
    4
  );

  const {
    manifest: bManifest,
    workflowSpec: bWorkflowSpec,
  } = qampScenarioBActorCompilation;
  const bResult = simulateWorkflow(bWorkflowSpec);

  assert.equal(
    Object.values(bManifest.actorWaits).some(
      (wait) =>
        wait.selection.kind === "all" &&
        wait.reason === "global-synchronization"
    ),
    true
  );
  assert.equal(
    deriveActorStateCountsAt(
      bManifest,
      bResult,
      "ranks",
      5
    ).blocked,
    4
  );
});

test("ordinal-set selection rejects actors outside the persistent group", () => {
  const design = structuredClone(
    qampScenarioAActorDesign
  );
  design.tasks[0].actorParticipation[0].selection = {
    kind: "ordinals",
    actorOrdinals: [2, 3, 5],
  };

  assert.throws(
    () =>
      compileWorkflowDesignDetailed(
        design,
        qampScenarioAActorRunConfiguration,
        qampScenarioABaselineProfile
      ),
    /actor ordinal 5 exceeds actor count 4/
  );
});

test("parameter-regime fixtures hold authored topology fixed between below-capacity and overload profiles", () => {
  assert.equal(
    qampScenarioAMultiRequestDesign.id,
    "qamp-a-multi-request-design"
  );
  assert.equal(
    qampScenarioAMultiRequestRunConfiguration.id,
    "qamp-a-multi-request-run"
  );

  const below = compileScenarioAMultiProfile(
    qampScenarioAMultiBelowCapacityProfile
  );
  const overload = compileScenarioAMultiProfile(
    qampScenarioAMultiOverloadProfile
  );

  assert.equal(
    below.manifest.designId,
    overload.manifest.designId
  );
  assert.equal(
    below.manifest.runConfigurationId,
    overload.manifest.runConfigurationId
  );
  assert.notEqual(
    below.manifest.systemProfileId,
    overload.manifest.systemProfileId
  );
});
