import test from "node:test";
import assert from "node:assert/strict";

import {
  deriveActorGroupSummaryAt,
  deriveActorStateCountsAt
} from "../src/design/actor-state.mjs";
import { deriveSystemStateSnapshot } from "../src/causal/systemState.mjs";
import { simulateWorkflow } from "../src/engine/runtime.mjs";
import {
  qampScenarioC1000Compilation,
  qampScenarioC1000Design,
  qampScenarioC1000RunConfiguration,
  qampScenarioC1000WorkflowSpec
} from "../src/presets/qamp-c-1000-demo.mjs";

const compiled = qampScenarioC1000Compilation;
const spec = qampScenarioC1000WorkflowSpec;
const result = simulateWorkflow(spec);

function approx(actual, expected, epsilon = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `expected ${actual} ≈ ${expected}`
  );
}

function actorCounts(simTimeS) {
  return deriveActorStateCountsAt(
    compiled.manifest,
    result,
    "ranks",
    simTimeS
  );
}

test("public C is a 1,000-actor five-cohort transfer model with QPU capacity one", () => {
  assert.equal(qampScenarioC1000Design.tasks.length, 15);
  assert.equal(spec.tasks.length, 15);
  assert.equal(
    qampScenarioC1000RunConfiguration.actorGroupCounts.ranks,
    1000
  );
  assert.equal(
    qampScenarioC1000RunConfiguration.resources.find(
      (resource) => resource.kind === "qpu"
    ).capacity,
    1
  );
  assert.equal(
    qampScenarioC1000RunConfiguration.policy
      .maxInFlightQuantumByPool,
    undefined
  );

  assert.deepEqual(actorCounts(3.5), {
    actorGroupId: "ranks",
    simTimeS: 3.5,
    working: 200,
    blocked: 800,
    idle: 0
  });

  assert.deepEqual(actorCounts(4.5), {
    actorGroupId: "ranks",
    simTimeS: 4.5,
    working: 0,
    blocked: 1000,
    idle: 0
  });
});

test("transfer wall can block all actors while QPU is idle and queue-free", () => {
  const snapshot = deriveSystemStateSnapshot(spec, result, 4.5);

  assert.equal(snapshot.resources.qpuByPool.qpu.activeUnits, 0);
  assert.equal(snapshot.resources.qpuByPool.qpu.queueDepth, 0);
  assert.equal(
    snapshot.causal.policyHeldQuantumTasks.length,
    0
  );
  assert.equal(
    snapshot.causal.activeCommunications.length,
    5
  );

  assert.equal(result.metrics.queueWaitSecondsByPool.qpu, 0);
  assert.equal(
    result.metrics.admissionWaitSecondsByPool.qpu,
    0
  );
});

test("C has intermittent QPU execution and independent continuation before the final QPU result", () => {
  const duringFirstQpu = deriveSystemStateSnapshot(
    spec,
    result,
    5.25
  );
  assert.equal(
    duringFirstQpu.resources.qpuByPool.qpu.activeUnits,
    1
  );
  assert.equal(
    duringFirstQpu.resources.qpuByPool.qpu.queueDepth,
    0
  );
  assert.deepEqual(actorCounts(5.25), {
    actorGroupId: "ranks",
    simTimeS: 5.25,
    working: 0,
    blocked: 1000,
    idle: 0
  });

  const resumed = deriveSystemStateSnapshot(spec, result, 8.5);
  assert.equal(resumed.resources.qpuByPool.qpu.activeUnits, 0);
  assert.equal(resumed.resources.qpuByPool.qpu.queueDepth, 0);
  assert.ok(resumed.causal.activeCommunications.length > 0);
  assert.deepEqual(actorCounts(8.5), {
    actorGroupId: "ranks",
    simTimeS: 8.5,
    working: 200,
    blocked: 800,
    idle: 0
  });

  const firstConsumerStart = result.events.find(
    (event) =>
      event.type === "task_started" &&
      event.taskId === "cohort-1-consumer"
  ).simTimeS;
  const finalQuantumComplete = result.events.find(
    (event) =>
      event.type === "task_completed" &&
      event.taskId === "cohort-5-quantum"
  ).simTimeS;

  approx(firstConsumerStart, 8.3);
  approx(finalQuantumComplete, 9.3);
  assert.ok(firstConsumerStart < finalQuantumComplete);
});

test("actor result wait releases at consumer start after positive return transfer", () => {
  assert.deepEqual(actorCounts(8.299), {
    actorGroupId: "ranks",
    simTimeS: 8.299,
    working: 0,
    blocked: 1000,
    idle: 0
  });
  assert.deepEqual(actorCounts(8.3), {
    actorGroupId: "ranks",
    simTimeS: 8.3,
    working: 200,
    blocked: 800,
    idle: 0
  });

  const returnCompleted = result.events.find(
    (event) =>
      event.type === "communication_completed" &&
      event.metadata?.dependencyId ===
        "cohort-1-return-transfer"
  );
  const consumerReady = result.events.find(
    (event) =>
      event.type === "task_ready" &&
      event.taskId === "cohort-1-consumer"
  );
  const consumerStarted = result.events.find(
    (event) =>
      event.type === "task_started" &&
      event.taskId === "cohort-1-consumer"
  );

  approx(returnCompleted.simTimeS, 8.3);
  approx(consumerReady.simTimeS, 8.3);
  approx(consumerStarted.simTimeS, 8.3);
});

test("communication dominates service while QPU utilization remains low", () => {
  const serviceSeconds = spec.tasks.reduce(
    (sum, task) => sum + task.serviceTime.seconds,
    0
  );

  approx(result.metrics.makespanS, 12.8);
  assert.ok(
    result.metrics.aggregateCommunicationSeconds >
      serviceSeconds
  );
  assert.ok(result.metrics.utilizationByPool.qpu < 0.05);

  const summary = deriveActorGroupSummaryAt(
    compiled.manifest,
    result,
    "ranks",
    4.5
  );
  assert.equal(summary.blocked, 1000);
  assert.equal(
    summary.blockedReasonCounts["quantum-result"],
    1000
  );
  assert.equal(
    summary.blockedReasonCounts["global-synchronization"] ?? 0,
    0
  );
});
