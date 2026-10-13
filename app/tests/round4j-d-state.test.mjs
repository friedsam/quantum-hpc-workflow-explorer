import test from "node:test";
import assert from "node:assert/strict";

import { simulateWorkflow } from "../src/engine/runtime.mjs";
import {
  deriveActorStateCountsAt
} from "../src/design/actor-state.mjs";
import { deriveSystemStateSnapshot } from "../src/causal/systemState.mjs";
import {
  qampScenarioD1000Compilation,
  qampScenarioD1000WorkflowSpec
} from "../src/presets/qamp-d-1000-demo.mjs";

const compiled = qampScenarioD1000Compilation;
const spec = qampScenarioD1000WorkflowSpec;
const result = simulateWorkflow(spec);

function actors(time) {
  return deriveActorStateCountsAt(
    compiled.manifest,
    result,
    "ranks",
    time
  );
}

test("public D1000 has compact authored topology and 3000 compiled tasks", () => {
  assert.equal(spec.tasks.length, 3000);
  assert.equal(compiled.manifest.actorGroups.ranks.count, 1000);
  assert.equal(spec.policy.maxInFlightQuantumByPool.qpu, 50);
  assert.equal(spec.resources.find((pool) => pool.kind === "qpu").capacity, 1);
});

test("public D1000 preserves bounded queue, policy hold, and local progress", () => {
  assert.deepEqual(actors(0.5), {
    actorGroupId: "ranks",
    simTimeS: 0.5,
    working: 1000,
    blocked: 0,
    idle: 0
  });

  const at1 = deriveSystemStateSnapshot(spec, result, 1);
  assert.deepEqual(actors(1), {
    actorGroupId: "ranks",
    simTimeS: 1,
    working: 0,
    blocked: 50,
    idle: 950
  });
  assert.equal(at1.resources.qpuByPool.qpu.activeUnits, 1);
  assert.equal(at1.resources.qpuByPool.qpu.queueDepth, 49);
  assert.equal(at1.causal.policyHeldQuantumTasks.length, 950);

  assert.deepEqual(actors(2), {
    actorGroupId: "ranks",
    simTimeS: 2,
    working: 1,
    blocked: 50,
    idle: 949
  });

  const maxQueue = Math.max(
    ...result.queueSeries
      .filter((sample) => sample.resourcePoolId === "qpu")
      .map((sample) => sample.depth)
  );
  assert.equal(maxQueue, 49);
  assert.ok(result.metrics.admissionWaitSecondsByPool.qpu > 0);
  assert.ok(result.metrics.queueWaitSecondsByPool.qpu > 0);
  assert.ok(result.metrics.utilizationByPool.qpu > 0.99);
});

test("public D1000 resumes locally before drain end and finishes Idle", () => {
  const firstContinue = result.events.find(
    (event) =>
      event.type === "task_started" &&
      event.taskId === "consumer#1"
  ).simTimeS;
  const lastQuantum = result.events.find(
    (event) =>
      event.type === "task_completed" &&
      event.taskId === "quantum#1000"
  ).simTimeS;

  assert.equal(firstContinue, 2);
  assert.equal(lastQuantum, 1001);
  assert.ok(firstContinue < lastQuantum);

  assert.deepEqual(actors(1001), {
    actorGroupId: "ranks",
    simTimeS: 1001,
    working: 1,
    blocked: 0,
    idle: 999
  });
  assert.deepEqual(actors(1001.5), {
    actorGroupId: "ranks",
    simTimeS: 1001.5,
    working: 0,
    blocked: 0,
    idle: 1000
  });
  assert.equal(result.metrics.makespanS, 1001.5);
});
