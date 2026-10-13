import test from "node:test";
import assert from "node:assert/strict";
import "./round4j-d-all.test.mjs";

import { simulateWorkflow } from "../src/engine/runtime.mjs";
import {
  createActorStateProjector,
  deriveActorStateDetailAt,
  deriveActorStateCountsAt,
} from "../src/design/actor-state.mjs";
import {
  deriveActorStateDetailAtReference,
} from "./helpers/actor-state-reference.mjs";
import {
  qampScenarioD1000StressCompilation,
  qampScenarioD1000StressWorkflowSpec,
} from "./fixtures/qamp-d-1000-stress.mjs";

const dCompilation =
  qampScenarioD1000StressCompilation;
const dManifest = dCompilation.manifest;
const dWorkflowSpec = dCompilation.workflowSpec;
const dResult = simulateWorkflow(dWorkflowSpec);
const dProjector = createActorStateProjector(
  dManifest,
  dResult
);

function intervalContains(interval, simTimeS) {
  return (
    interval.startS <= simTimeS &&
    simTimeS < interval.endS
  );
}

function qpuTaskStateCountsAt(
  result,
  simTimeS
) {
  const qpuIds = new Set(
    qampScenarioD1000StressWorkflowSpec.tasks
      .filter(
        (task) => task.resourcePoolId === "qpu"
      )
      .map((task) => task.id)
  );

  const counts = {
    running: 0,
    queued: 0,
    policyHeld: 0,
  };

  for (const taskId of qpuIds) {
    const running = result.taskIntervals.some(
      (interval) =>
        interval.taskId === taskId &&
        interval.state === "running" &&
        intervalContains(interval, simTimeS)
    );
    if (running) {
      counts.running += 1;
      continue;
    }

    const queued = result.taskIntervals.some(
      (interval) =>
        interval.taskId === taskId &&
        interval.state === "queued" &&
        intervalContains(interval, simTimeS)
    );
    if (queued) {
      counts.queued += 1;
      continue;
    }

    const ready = result.taskIntervals.some(
      (interval) =>
        interval.taskId === taskId &&
        interval.state === "ready" &&
        intervalContains(interval, simTimeS)
    );
    if (ready) counts.policyHeld += 1;
  }

  return counts;
}

function eventFor(
  result,
  type,
  taskId
) {
  return result.events.find(
    (event) =>
      event.type === type &&
      event.taskId === taskId
  );
}

test("queued actor-wait boundary compiles to existing task_queued event", () => {
  const { manifest } =
    qampScenarioD1000StressCompilation;

  assert.equal(
    Object.keys(manifest.actorWaits).length,
    1000
  );

  assert.deepEqual(
    manifest.actorWaits[
      "admitted-quantum-result-wait#1"
    ],
    {
      designWaitId:
        "admitted-quantum-result-wait",
      actorGroupId: "ranks",
      selection: {
        kind: "one",
        actorOrdinal: 1,
      },
      logicalInstanceOrdinal: 1,
      activation: {
        eventType: "task_queued",
        taskIds: ["quantum#1"],
        quantifier: "all",
      },
      release: {
        eventType: "task_completed",
        taskIds: ["quantum#1"],
        quantifier: "all",
      },
      reason: "admitted-quantum-result",
    }
  );
});

test("D1000 initial preparation has all actors Working", () => {
  const manifest = dManifest;
  const workflowSpec = dWorkflowSpec;
  const result = dResult;

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
});

test("D1000 admission creates exactly 1 running +49 resource-queued, 50 Blocked actors and 950 policy-held Idle", () => {
  const manifest = dManifest;
  const workflowSpec = dWorkflowSpec;
  const result = dResult;

  assert.deepEqual(
    qpuTaskStateCountsAt(result, 1),
    {
      running: 1,
      queued: 49,
      policyHeld: 950,
    }
  );

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
      blocked: 50,
      idle: 950,
    }
  );

  assert.equal(
    deriveActorStateDetailAt(
      manifest,
      result,
      "ranks",
      50,
      1
    ).state,
    "blocked"
  );
  assert.equal(
    deriveActorStateDetailAt(
      manifest,
      result,
      "ranks",
      51,
      1
    ).state,
    "idle"
  );
});

test("immediate task_queued -> task_started at one timestamp still creates a nonzero actor wait interval", () => {
  const manifest = dManifest;
  const workflowSpec = dWorkflowSpec;
  const result = dResult;

  const queued = eventFor(
    result,
    "task_queued",
    "quantum#1"
  );
  const started = eventFor(
    result,
    "task_started",
    "quantum#1"
  );

  assert.equal(queued.simTimeS, 1);
  assert.equal(started.simTimeS, 1);
  assert.ok(queued.seq < started.seq);

  assert.equal(
    result.taskIntervals.some(
      (interval) =>
        interval.taskId === "quantum#1" &&
        interval.state === "queued"
    ),
    false
  );

  assert.deepEqual(
    deriveActorStateDetailAt(
      manifest,
      result,
      "ranks",
      1,
      1
    ),
    {
      actorGroupId: "ranks",
      actorOrdinal: 1,
      simTimeS: 1,
      state: "blocked",
      blockedReasons: [
        "admitted-quantum-result",
      ],
    }
  );

  assert.deepEqual(
    deriveActorStateDetailAt(
      manifest,
      result,
      "ranks",
      1,
      1.5
    ),
    {
      actorGroupId: "ranks",
      actorOrdinal: 1,
      simTimeS: 1.5,
      state: "blocked",
      blockedReasons: [
        "admitted-quantum-result",
      ],
    }
  );
});

test("D1000 first completion resumes one actor and replenishes the 50 admitted slots without collisions", () => {
  const manifest = dManifest;
  const workflowSpec = dWorkflowSpec;
  const result = dResult;

  assert.deepEqual(
    qpuTaskStateCountsAt(result, 2),
    {
      running: 1,
      queued: 49,
      policyHeld: 949,
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
      working: 1,
      blocked: 50,
      idle: 949,
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
      state: "working",
      blockedReasons: [],
    }
  );

  assert.equal(
    deriveActorStateDetailAt(
      manifest,
      result,
      "ranks",
      51,
      2
    ).state,
    "blocked"
  );
  assert.equal(
    deriveActorStateDetailAt(
      manifest,
      result,
      "ranks",
      52,
      2
    ).state,
    "idle"
  );

  assert.deepEqual(
    deriveActorStateCountsAt(
      manifest,
      result,
      "ranks",
      2.25
    ),
    {
      actorGroupId: "ranks",
      simTimeS: 2.25,
      working: 1,
      blocked: 50,
      idle: 949,
    }
  );

  assert.deepEqual(
    deriveActorStateCountsAt(
      manifest,
      result,
      "ranks",
      2.5
    ),
    {
      actorGroupId: "ranks",
      simTimeS: 2.5,
      working: 0,
      blocked: 50,
      idle: 950,
    }
  );
});

test("D1000 queued-wait lifecycle remains equivalent to the pre-index semantic oracle for selected actors", () => {
  const manifest = dManifest;
  const workflowSpec = dWorkflowSpec;
  const result = dResult;

  for (const simTimeS of [
    0.5,
    1,
    1.5,
    2,
    2.25,
    2.5,
    50.5,
    951,
    1001,
    1001.25,
    1001.5,
  ]) {
    for (const actorOrdinal of [
      1,
      2,
      50,
      51,
      52,
      999,
      1000,
    ]) {
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
        )
      );
    }
  }
});

test("D1000 eventually restores completed actors to Working then Idle with no Blocked collision", () => {
  const manifest = dManifest;
  const workflowSpec = dWorkflowSpec;
  const result = dResult;
  const projector = dProjector;

  assert.equal(result.metrics.makespanS, 1001.5);

  assert.deepEqual(
    projector.countsAt(
      "ranks",
      1001
    ),
    {
      actorGroupId: "ranks",
      simTimeS: 1001,
      working: 1,
      blocked: 0,
      idle: 999,
    }
  );

  assert.deepEqual(
    projector.countsAt(
      "ranks",
      1001.25
    ),
    {
      actorGroupId: "ranks",
      simTimeS: 1001.25,
      working: 1,
      blocked: 0,
      idle: 999,
    }
  );

  assert.deepEqual(
    projector.countsAt(
      "ranks",
      1001.5
    ),
    {
      actorGroupId: "ranks",
      simTimeS: 1001.5,
      working: 0,
      blocked: 0,
      idle: 1000,
    }
  );

  assert.equal(
    projector.stats.actorCount,
    1000
  );
  assert.equal(
    projector.stats.waitClaimCount,
    1000
  );
});
