import test from "node:test";
import assert from "node:assert/strict";
import { simulateWorkflow, validateWorkflowSpec } from "../src/engine/runtime.mjs";
import {
  scenarioA,
  scenarioB,
  scenarioC,
  scenarioD,
  qampScenarioFixtures,
} from "./fixtures/qamp-scenarios.mjs";

function eventTime(result, type, taskId) {
  const event = result.events.find(
    (candidate) => candidate.type === type && candidate.taskId === taskId
  );
  assert.ok(event, `missing ${type} event for ${taskId}`);
  return event.simTimeS;
}

function runningInterval(result, taskId) {
  const interval = result.taskIntervals.find(
    (candidate) => candidate.taskId === taskId && candidate.state === "running"
  );
  assert.ok(interval, `missing running interval for ${taskId}`);
  return interval;
}

function intervalsOverlap(a, b) {
  return a.startS < b.endS && b.startS < a.endS;
}

function maxQueueDepth(result, poolId) {
  return Math.max(
    0,
    ...result.queueSeries
      .filter((sample) => sample.resourcePoolId === poolId)
      .map((sample) => sample.depth)
  );
}

function totalServiceSeconds(workflow) {
  return workflow.tasks.reduce(
    (sum, task) => sum + task.serviceTime.seconds,
    0
  );
}

test("all QAMP A-D fixtures validate against frozen v1", () => {
  for (const workflow of Object.values(qampScenarioFixtures)) {
    assert.equal(validateWorkflowSpec(workflow), true);
  }
});

test("Scenario A: independent classical work overlaps QPU and remains the critical path", () => {
  const result = simulateWorkflow(scenarioA);
  const classical = runningInterval(result, "independent-classical");
  const quantum = runningInterval(result, "quantum-run");

  assert.ok(intervalsOverlap(classical, quantum));
  assert.equal(quantum.startS, 1);
  assert.equal(quantum.endS, 5);

  const localConsumerComplete = eventTime(
    result,
    "task_completed",
    "local-consumer"
  );
  const independentComplete = eventTime(
    result,
    "task_completed",
    "independent-classical"
  );

  assert.equal(localConsumerComplete, 6);
  assert.equal(independentComplete, 10);
  assert.equal(result.metrics.makespanS, independentComplete);
  assert.ok(localConsumerComplete < result.metrics.makespanS);

  assert.equal(result.metrics.queueWaitSecondsByPool.qpu, 0);
  assert.equal(result.metrics.admissionWaitSecondsByPool.qpu, 0);
  assert.ok(maxQueueDepth(result, "qpu") <= 1);
  assert.equal(
    result.events.filter((event) => event.type === "task_throttled").length,
    0
  );
});

test("Scenario B: collective continuation waits for the complete serialized quantum result set", () => {
  const result = simulateWorkflow(scenarioB);
  const qAComplete = eventTime(result, "task_completed", "quantum-a");
  const qBComplete = eventTime(result, "task_completed", "quantum-b");
  const collectiveStart = eventTime(
    result,
    "task_started",
    "collective-continuation"
  );

  assert.equal(qAComplete, 4);
  assert.equal(qBComplete, 6);
  assert.equal(collectiveStart, Math.max(qAComplete, qBComplete));
  assert.equal(result.metrics.makespanS, 7);

  assert.equal(result.metrics.admissionWaitSecondsByPool.qpu, 0);
  assert.equal(
    result.events.filter((event) => event.type === "task_throttled").length,
    0
  );
  assert.equal(result.metrics.queueWaitSecondsByPool.qpu, 3);

  assert.equal(result.metrics.activeResourceSecondsByPool.cpu, 6);
  assert.equal(result.metrics.allocatedResourceSecondsByPool.cpu, 28);
  assert.equal(result.metrics.idleAllocatedResourceSecondsByPool.cpu, 22);
  assert.ok(result.metrics.idleAllocatedResourceSecondsByPool.cpu > 0);
});

test("Scenario C: communication dominates while QPU queueing stays negligible", () => {
  const result = simulateWorkflow(scenarioC);

  assert.equal(result.metrics.makespanS, 18);
  assert.equal(result.metrics.aggregateCommunicationSeconds, 36);
  assert.ok(
    result.metrics.aggregateCommunicationSeconds >
      totalServiceSeconds(scenarioC)
  );

  assert.equal(result.metrics.queueWaitSecondsByPool.qpu, 0);
  assert.equal(result.metrics.admissionWaitSecondsByPool.qpu, 0);
  assert.ok(maxQueueDepth(result, "qpu") <= 1);
  assert.ok(result.metrics.utilizationByPool.qpu < 0.1);

  assert.deepEqual(
    ["quantum-1", "quantum-2", "quantum-3"].map((taskId) =>
      eventTime(result, "task_started", taskId)
    ),
    [5, 9, 13]
  );

  const firstConsumerStart = eventTime(
    result,
    "task_started",
    "consumer-1"
  );
  const thirdQuantumStart = eventTime(
    result,
    "task_started",
    "quantum-3"
  );
  assert.equal(firstConsumerStart, 9.5);
  assert.ok(firstConsumerStart < thirdQuantumStart);

  assert.equal(
    result.assumptions.some((text) =>
      text.toLowerCase().includes("provider queue delay")
    ),
    true
  );
});

test("Scenario D: bounded asynchronous pipeline separates admission wait from QPU queueing", () => {
  const result = simulateWorkflow(scenarioD);

  assert.equal(result.metrics.makespanS, 13);
  assert.equal(maxQueueDepth(result, "qpu"), 1);
  assert.equal(result.metrics.queueWaitSecondsByPool.qpu, 10);
  assert.equal(result.metrics.admissionWaitSecondsByPool.qpu, 20);
  assert.ok(result.metrics.admissionWaitSecondsByPool.qpu > 0);
  assert.ok(result.metrics.utilizationByPool.qpu > 0.9);

  const inflightSamples = result.events
    .filter((event) => event.metadata?.qpuInFlight !== undefined)
    .map((event) => event.metadata.qpuInFlight);
  assert.ok(inflightSamples.length > 0);
  assert.ok(inflightSamples.every((value) => value <= 2));

  const firstConsumerStart = eventTime(
    result,
    "task_started",
    "consumer-1"
  );
  const lastQuantumComplete = eventTime(
    result,
    "task_completed",
    "quantum-6"
  );
  assert.equal(firstConsumerStart, 2.5);
  assert.equal(lastQuantumComplete, 12.5);
  assert.ok(firstConsumerStart < lastQuantumComplete);

  assert.equal(
    result.events.filter((event) => event.type === "task_throttled").length,
    4
  );
  assert.deepEqual(
    ["consumer-1", "consumer-2", "consumer-3"].map((taskId) =>
      eventTime(result, "task_started", taskId)
    ),
    [2.5, 4.5, 6.5]
  );
});
