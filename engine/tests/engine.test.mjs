import test from "node:test";
import assert from "node:assert/strict";
import { simulateWorkflow, validateWorkflowSpec } from "../index.mjs";
import { minimalWorkflow } from "../examples/minimal.mjs";

function clone(value) {
  return structuredClone(value);
}

function starts(result) {
  return Object.fromEntries(
    result.events.filter((e) => e.type === "task_started").map((e) => [e.taskId, e.simTimeS])
  );
}

function completions(result) {
  return Object.fromEntries(
    result.events.filter((e) => e.type === "task_completed").map((e) => [e.taskId, e.simTimeS])
  );
}

function activeCapacityAtBoundaries(result, workflow, poolId) {
  const pool = workflow.resources.find((x) => x.id === poolId);
  const active = result.resourceIntervals.filter((x) => x.resourcePoolId === poolId && x.state === "active");
  const boundaries = [...new Set(active.flatMap((x) => [x.startS, x.endS]))].sort((a, b) => a - b);
  for (let i = 0; i < boundaries.length - 1; i += 1) {
    const start = boundaries[i];
    const end = boundaries[i + 1];
    if (end <= start) continue;
    const probe = start + (end - start) / 2;
    const units = active.filter((x) => x.startS <= probe && probe < x.endS).reduce((sum, x) => sum + x.units, 0);
    assert.ok(units <= pool.capacity, `${poolId} active units ${units} exceed ${pool.capacity}`);
  }
}

function integrate(intervals, poolId, state) {
  return intervals
    .filter((x) => x.resourcePoolId === poolId && x.state === state)
    .reduce((sum, x) => sum + (x.endS - x.startS) * x.units, 0);
}

test("minimal deterministic example has expected critical path and queue wait", () => {
  const result = simulateWorkflow(minimalWorkflow);
  assert.equal(result.metrics.makespanS, 9.25);
  assert.equal(result.metrics.queueWaitSecondsByPool.qpu, 3);
  assert.equal(result.metrics.admissionWaitSecondsByPool.qpu, 0);
  assert.equal(result.metrics.communicationSeconds, 1.5);
  assert.equal(result.metrics.activeResourceSecondsByPool.cpu, 5.5);
  assert.equal(result.metrics.allocatedResourceSecondsByPool.cpu, 18.5);
  assert.equal(result.metrics.idleAllocatedResourceSecondsByPool.cpu, 13);
  assert.equal(result.metrics.activeResourceSecondsByPool.qpu, 5);

  assert.deepEqual(starts(result), { prep: 0, q1: 2.5, q2: 5.5, join: 7.75 });
  assert.deepEqual(completions(result), { prep: 2, q1: 5.5, q2: 7.5, join: 9.25 });
});

test("dependency safety includes edge communication time", () => {
  const result = simulateWorkflow(minimalWorkflow);
  const start = starts(result);
  const complete = completions(result);
  for (const dep of minimalWorkflow.dependencies) {
    const duration = (dep.fixedLatencyS ?? 0) + ((dep.dataBytes ?? 0) / (dep.bandwidthBytesPerS ?? Infinity));
    assert.ok(start[dep.targetTaskId] >= complete[dep.sourceTaskId] + duration);
  }
});

test("resource capacity is never exceeded", () => {
  const result = simulateWorkflow(minimalWorkflow);
  for (const pool of minimalWorkflow.resources) activeCapacityAtBoundaries(result, minimalWorkflow, pool.id);
});

test("event times are monotonic and deterministic", () => {
  const a = simulateWorkflow(minimalWorkflow);
  const b = simulateWorkflow(clone(minimalWorkflow));
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  for (let i = 1; i < a.events.length; i += 1) {
    assert.ok(a.events[i].simTimeS >= a.events[i - 1].simTimeS);
    assert.equal(a.events[i].seq, i);
  }
});

test("resource interval accounting integrates to reported metrics", () => {
  const result = simulateWorkflow(minimalWorkflow);
  for (const pool of minimalWorkflow.resources) {
    assert.equal(integrate(result.resourceIntervals, pool.id, "active"), result.metrics.activeResourceSecondsByPool[pool.id]);
    assert.equal(integrate(result.resourceIntervals, pool.id, "allocated-idle"), result.metrics.idleAllocatedResourceSecondsByPool[pool.id]);
    assert.equal(integrate(result.resourceIntervals, pool.id, "released"), result.metrics.releasedResourceSecondsByPool[pool.id]);
    assert.equal(
      result.metrics.activeResourceSecondsByPool[pool.id] + result.metrics.idleAllocatedResourceSecondsByPool[pool.id],
      result.metrics.allocatedResourceSecondsByPool[pool.id]
    );
  }
});

test("makespan equals final required completion time", () => {
  const result = simulateWorkflow(minimalWorkflow);
  const finalCompletion = Math.max(...result.events.filter((e) => e.type === "task_completed").map((e) => e.simTimeS));
  assert.equal(result.metrics.makespanS, finalCompletion);
});

test("zero-latency strictly serial graph has additive makespan", () => {
  const workflow = {
    id: "serial",
    name: "serial",
    resources: [{ id: "cpu", kind: "cpu", capacity: 1 }],
    policy: { allocation: "release-aware" },
    tasks: [
      { id: "a", label: "a", resourcePoolId: "cpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 1 } },
      { id: "b", label: "b", resourcePoolId: "cpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 2 } },
    ],
    dependencies: [{ id: "a-b", sourceTaskId: "a", targetTaskId: "b", fixedLatencyS: 0 }],
  };
  const result = simulateWorkflow(workflow);
  assert.equal(result.metrics.makespanS, 3);
  assert.deepEqual(starts(result), { a: 0, b: 1 });
});

test("QPU capacity is configurable and permits concurrent tasks", () => {
  const workflow = {
    id: "qpu-capacity-two",
    name: "qpu capacity two",
    resources: [{ id: "qpu", kind: "qpu", capacity: 2 }],
    policy: { allocation: "release-aware", maxInFlightQuantum: 10 },
    tasks: [
      { id: "q1", label: "q1", resourcePoolId: "qpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 3 } },
      { id: "q2", label: "q2", resourcePoolId: "qpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 2 } },
    ],
    dependencies: [],
  };
  const result = simulateWorkflow(workflow);
  assert.equal(result.metrics.makespanS, 3);
  assert.deepEqual(starts(result), { q1: 0, q2: 0 });
  assert.equal(result.metrics.queueWaitSecondsByPool.qpu, 0);
});

test("saturated capacity-1 QPU serializes independent tasks", () => {
  const workflow = {
    id: "qpu-saturated",
    name: "qpu saturated",
    resources: [{ id: "qpu", kind: "qpu", capacity: 1 }],
    policy: { allocation: "release-aware", maxInFlightQuantum: 10 },
    tasks: [
      { id: "q1", label: "q1", resourcePoolId: "qpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 3 } },
      { id: "q2", label: "q2", resourcePoolId: "qpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 2 } },
    ],
    dependencies: [],
  };
  const result = simulateWorkflow(workflow);
  assert.equal(result.metrics.makespanS, 5);
  assert.deepEqual(starts(result), { q1: 0, q2: 3 });
  assert.equal(result.metrics.queueWaitSecondsByPool.qpu, 3);
  assert.ok(result.queueSeries.every((sample) => sample.depth >= 0));
});

test("maxInFlightQuantum creates admission wait distinct from queue wait", () => {
  const workflow = {
    id: "qpu-throttle",
    name: "qpu throttle",
    resources: [{ id: "qpu", kind: "qpu", capacity: 1 }],
    policy: { allocation: "release-aware", maxInFlightQuantum: 1 },
    tasks: [
      { id: "q1", label: "q1", resourcePoolId: "qpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 3 } },
      { id: "q2", label: "q2", resourcePoolId: "qpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 2 } },
    ],
    dependencies: [],
  };
  const result = simulateWorkflow(workflow);
  assert.equal(result.metrics.makespanS, 5);
  assert.equal(result.metrics.queueWaitSecondsByPool.qpu, 0);
  assert.equal(result.metrics.admissionWaitSecondsByPool.qpu, 3);
  assert.equal(result.events.filter((e) => e.type === "task_throttled" && e.taskId === "q2").length, 1);
  const qpuInflight = result.events
    .filter((e) => e.metadata?.qpuInFlight !== undefined)
    .map((e) => e.metadata.qpuInFlight);
  assert.deepEqual(qpuInflight, [1, 0, 1, 0]);
});

test("fixed vs release-aware changes classical allocation accounting, not makespan", () => {
  const fixed = clone(minimalWorkflow);
  fixed.id = "fixed";
  fixed.policy.allocation = "fixed";
  const releaseAware = clone(minimalWorkflow);
  releaseAware.id = "release-aware";
  releaseAware.policy.allocation = "release-aware";

  const a = simulateWorkflow(fixed);
  const b = simulateWorkflow(releaseAware);
  assert.equal(a.metrics.makespanS, b.metrics.makespanS);
  assert.equal(a.metrics.activeResourceSecondsByPool.cpu, b.metrics.activeResourceSecondsByPool.cpu);
  assert.ok(a.metrics.idleAllocatedResourceSecondsByPool.cpu > 0);
  assert.equal(b.metrics.idleAllocatedResourceSecondsByPool.cpu, 0);
  assert.equal(b.metrics.allocatedResourceSecondsByPool.cpu, b.metrics.activeResourceSecondsByPool.cpu);
});

test("workflow validation rejects cycles and over-capacity tasks", () => {
  const cycle = {
    id: "cycle",
    name: "cycle",
    resources: [{ id: "cpu", kind: "cpu", capacity: 1 }],
    policy: { allocation: "fixed" },
    tasks: [
      { id: "a", label: "a", resourcePoolId: "cpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 1 } },
      { id: "b", label: "b", resourcePoolId: "cpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 1 } },
    ],
    dependencies: [
      { id: "a-b", sourceTaskId: "a", targetTaskId: "b" },
      { id: "b-a", sourceTaskId: "b", targetTaskId: "a" },
    ],
  };
  assert.throws(() => validateWorkflowSpec(cycle), /must form a DAG/);

  const over = clone(cycle);
  over.id = "over";
  over.dependencies = [];
  over.tasks[0].resourceCount = 2;
  assert.throws(() => validateWorkflowSpec(over), /exceeds pool/);
});
