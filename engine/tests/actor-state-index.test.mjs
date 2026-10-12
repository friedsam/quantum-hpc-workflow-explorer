import test from "node:test";
import assert from "node:assert/strict";

import { simulateWorkflow } from "../index.mjs";
import {
  createActorStateProjector,
  deriveActorStateDetailAt,
  deriveActorStateCountsAt,
  deriveActorGroupSummaryAt,
  actorStateTransitionTimes,
} from "../design/actor-state.mjs";
import {
  deriveActorStateDetailAtReference,
  deriveActorStateCountsAtReference,
  deriveActorSummaryAtReference,
} from "./helpers/actor-state-reference.mjs";
import {
  qampScenarioAActorCompilation,
} from "../examples/qamp-a-actor-regimes.mjs";
import {
  qampScenarioA1000Compilation,
} from "../examples/qamp-a-1000-demo.mjs";
import {
  qampScenarioBActorCompilation,
} from "../examples/qamp-b-actor-model.mjs";
import {
  qampScenarioB200StressCompilation,
} from "../examples/qamp-b-200-stress.mjs";

function assertFixtureEquivalent(
  compilation,
  times,
  actorOrdinals
) {
  const { manifest, workflowSpec } = compilation;
  const result = simulateWorkflow(workflowSpec);

  for (const simTimeS of times) {
    assert.deepEqual(
      deriveActorStateCountsAt(
        manifest,
        result,
        "ranks",
        simTimeS
      ),
      deriveActorStateCountsAtReference(
        manifest,
        result,
        "ranks",
        simTimeS
      ),
      `count mismatch at t=${simTimeS}`
    );

    assert.deepEqual(
      deriveActorGroupSummaryAt(
        manifest,
        result,
        "ranks",
        simTimeS
      ),
      deriveActorSummaryAtReference(
        manifest,
        result,
        "ranks",
        simTimeS
      ),
      `summary mismatch at t=${simTimeS}`
    );

    for (const actorOrdinal of actorOrdinals) {
      assert.deepEqual(
        deriveActorStateDetailAt(
          manifest,
          result,
          "ranks",
          actorOrdinal,
          simTimeS
        ),
        deriveActorStateDetailAtReference(
          manifest,
          result,
          "ranks",
          actorOrdinal,
          simTimeS
        ),
        `detail mismatch for actor ${actorOrdinal} at t=${simTimeS}`
      );
    }
  }
}

test("indexed projector matches reference semantics on 4-rank Scenario A", () => {
  assertFixtureEquivalent(
    qampScenarioAActorCompilation,
    [0, 0.5, 1, 1.5, 3, 4, 7, 8, 10],
    [1, 2, 3, 4]
  );
});

test("indexed projector matches reference semantics on 4-rank Scenario B", () => {
  assertFixtureEquivalent(
    qampScenarioBActorCompilation,
    [0, 0.5, 1, 2, 4, 5, 7, 7.5, 8],
    [1, 2, 3, 4]
  );
});

test("indexed projector matches reference semantics on 1000-rank Scenario A", () => {
  assertFixtureEquivalent(
    qampScenarioA1000Compilation,
    [0, 0.5, 1, 1.5, 3, 4, 7, 8, 10],
    [1, 2, 500, 1000]
  );
});

test("B-200 stress model has 1000 actors, 401 tasks, 201 actor waits, and serialized QPU", () => {
  const { manifest, workflowSpec } =
    qampScenarioB200StressCompilation;
  const result = simulateWorkflow(workflowSpec);

  assert.equal(manifest.actorGroups.ranks.count, 1000);
  assert.equal(workflowSpec.tasks.length, 401);
  assert.equal(
    Object.keys(manifest.actorWaits).length,
    201
  );

  assert.equal(
    result.metrics.queueWaitSecondsByPool.qpu,
    0
  );
  assert.ok(
    result.metrics.admissionWaitSecondsByPool.qpu > 0
  );

  const started = result.events
    .filter(
      (event) =>
        event.type === "task_started" &&
        event.resourcePoolId === "qpu"
    )
    .map((event) => event.simTimeS);

  assert.equal(started.length, 200);
  assert.equal(started[0], 1);
  assert.equal(started[1], 2);
  assert.equal(started[199], 200);
  assert.equal(result.metrics.makespanS, 202);
});

test("indexed projector exactly matches reference counts/details/reasons on B-200 stress", () => {
  assertFixtureEquivalent(
    qampScenarioB200StressCompilation,
    [
      0,
      0.5,
      1,
      1.5,
      2,
      2.5,
      100,
      200.5,
      201,
      201.5,
      202,
    ],
    [1, 2, 199, 200, 201, 1000]
  );
});

test("B-200 exact transition boundaries preserve half-open waits and overlapping reasons", () => {
  const { manifest, workflowSpec } =
    qampScenarioB200StressCompilation;
  const result = simulateWorkflow(workflowSpec);

  assert.deepEqual(
    deriveActorStateCountsAt(
      manifest,
      result,
      "ranks",
      1
    ),
    {
      actorGroupId: "ranks",
      simTimeS: 1,
      working: 0,
      blocked: 200,
      idle: 800,
    }
  );

  assert.deepEqual(
    deriveActorStateDetailAt(
      manifest,
      result,
      "ranks",
      1,
      2
    ),
    {
      actorGroupId: "ranks",
      actorOrdinal: 1,
      simTimeS: 2,
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
      2
    ),
    {
      actorGroupId: "ranks",
      actorOrdinal: 2,
      simTimeS: 2,
      state: "blocked",
      blockedReasons: [
        "global-synchronization",
        "quantum-result",
      ],
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
      blocked: 1000,
      idle: 0,
    }
  );

  assert.deepEqual(
    deriveActorStateCountsAt(
      manifest,
      result,
      "ranks",
      201
    ),
    {
      actorGroupId: "ranks",
      simTimeS: 201,
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
      202
    ),
    {
      actorGroupId: "ranks",
      simTimeS: 202,
      working: 0,
      blocked: 0,
      idle: 1000,
    }
  );
});

test("indexed projector preserves Working+Blocked conflict rejection lazily at the queried interval", () => {
  const { manifest, workflowSpec } =
    qampScenarioBActorCompilation;
  const result = simulateWorkflow(workflowSpec);
  const conflictingManifest = structuredClone(manifest);

  conflictingManifest.actorWaits[
    "global-result-gate"
  ].release = {
    eventType: "task_completed",
    taskIds: ["collective"],
    quantifier: "all",
  };

  const projector = createActorStateProjector(
    conflictingManifest,
    result
  );

  assert.equal(
    projector.detailAt("ranks", 1, 2).state,
    "blocked"
  );

  assert.throws(
    () =>
      projector.detailAt(
        "ranks",
        1,
        7.5
      ),
    /both working and blocked/
  );

  assert.throws(
    () =>
      projector.countsAt(
        "ranks",
        7.5
      ),
    /both working and blocked/
  );
});

test("projector exposes deterministic transition times and indexed statistics", () => {
  const { manifest, workflowSpec } =
    qampScenarioB200StressCompilation;
  const result = simulateWorkflow(workflowSpec);
  const projector = createActorStateProjector(
    manifest,
    result
  );

  const times = projector.transitionTimes("ranks");
  assert.equal(times[0], 0);
  assert.equal(times[times.length - 1], 202);
  assert.ok(times.includes(1));
  assert.ok(times.includes(2));
  assert.ok(times.includes(201));

  assert.equal(projector.stats.actorCount, 1000);
  assert.equal(
    projector.stats.participationClaimCount,
    201
  );
  assert.equal(projector.stats.waitClaimCount, 201);
  assert.ok(projector.stats.actorSegmentCount > 1000);
  assert.ok(projector.stats.summarySegmentCount > 1);

  assert.deepEqual(
    actorStateTransitionTimes(
      manifest,
      result,
      "ranks"
    ),
    times
  );
});
