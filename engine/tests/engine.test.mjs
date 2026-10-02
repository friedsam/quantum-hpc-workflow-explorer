import test from "node:test";
import assert from "node:assert/strict";
import { simulateWorkflow, validateWorkflowSpec } from "../index.mjs";
import { minimalWorkflow } from "../examples/minimal.mjs";

function clone(value) {
  return structuredClone(value);
}

function starts(result) {
  return Object.fromEntries(
    result.events
      .filter((event) => event.type === "task_started")
      .map((event) => [event.taskId, event.simTimeS])
  );
}

function completions(result) {
  return Object.fromEntries(
    result.events
      .filter((event) => event.type === "task_completed")
      .map((event) => [event.taskId, event.simTimeS])
  );
}

function integrate(intervals, poolId, state) {
  return intervals
    .filter((interval) => interval.resourcePoolId === poolId && interval.state === state)
    .reduce(
      (sum, interval) =>
        sum + (interval.endS - interval.startS) * interval.units,
      0
    );
}

function maxActiveUnits(result, poolId) {
  const active = result.resourceIntervals.filter(
    (interval) => interval.resourcePoolId === poolId && interval.state === "active"
  );
  const boundaries = [...new Set(
    active.flatMap((interval) => [interval.startS, interval.endS])
  )].sort((a, b) => a - b);

  let maximum = 0;
  for (let i = 0; i < boundaries.length - 1; i += 1) {
    const startS = boundaries[i];
    const endS = boundaries[i + 1];
    if (endS <= startS) continue;
    const probe = startS + (endS - startS) / 2;
    const units = active
      .filter((interval) => interval.startS <= probe && probe < interval.endS)
      .reduce((sum, interval) => sum + interval.units, 0);
    maximum = Math.max(maximum, units);
  }
  return maximum;
}

function qpuTasks(count, poolId = "qpu", seconds = 2) {
  return Array.from({ length: count }, (_, index) => ({
    id: `q${index + 1}`,
    label: `q${index + 1}`,
    resourcePoolId: poolId,
    resourceCount: 1,
    serviceTime: { kind: "constant", seconds },
  }));
}

test("minimal deterministic example has expected critical path and accounting", () => {
  const result = simulateWorkflow(minimalWorkflow);

  assert.equal(result.metrics.makespanS, 9.25);
  assert.equal(result.metrics.queueWaitSecondsByPool.qpu, 3);
  assert.equal(result.metrics.admissionWaitSecondsByPool.qpu, 0);
  assert.equal(result.metrics.aggregateCommunicationSeconds, 1.5);
  assert.equal(result.metrics.activeResourceSecondsByPool.cpu, 5.5);
  assert.equal(result.metrics.allocatedResourceSecondsByPool.cpu, 18.5);
  assert.equal(result.metrics.idleAllocatedResourceSecondsByPool.cpu, 13);
  assert.equal(result.metrics.activeResourceSecondsByPool.qpu, 5);

  assert.deepEqual(starts(result), {
    prep: 0,
    q1: 2.5,
    q2: 5.5,
    join: 7.75,
  });
  assert.deepEqual(completions(result), {
    prep: 2,
    q1: 5.5,
    q2: 7.5,
    join: 9.25,
  });
});

test("dependency safety includes positive communication time", () => {
  const result = simulateWorkflow(minimalWorkflow);
  const start = starts(result);
  const complete = completions(result);

  for (const dep of minimalWorkflow.dependencies) {
    const communicationS =
      (dep.fixedLatencyS ?? 0) +
      ((dep.dataBytes ?? 0) / (dep.bandwidthBytesPerS ?? Infinity));
    assert.ok(
      start[dep.targetTaskId] >= complete[dep.sourceTaskId] + communicationS
    );
  }
});

test("active resource use never exceeds configured pool capacity", () => {
  const result = simulateWorkflow(minimalWorkflow);
  for (const pool of minimalWorkflow.resources) {
    assert.ok(maxActiveUnits(result, pool.id) <= pool.capacity);
  }
});

test("identical deterministic inputs produce identical monotonic event traces", () => {
  const a = simulateWorkflow(minimalWorkflow);
  const b = simulateWorkflow(clone(minimalWorkflow));

  assert.equal(JSON.stringify(a), JSON.stringify(b));
  for (let i = 1; i < a.events.length; i += 1) {
    assert.ok(a.events[i].simTimeS >= a.events[i - 1].simTimeS);
    assert.equal(a.events[i].seq, i);
  }
});

test("resource intervals integrate to reported resource-time metrics", () => {
  const result = simulateWorkflow(minimalWorkflow);

  for (const pool of minimalWorkflow.resources) {
    assert.equal(
      integrate(result.resourceIntervals, pool.id, "active"),
      result.metrics.activeResourceSecondsByPool[pool.id]
    );
    assert.equal(
      integrate(result.resourceIntervals, pool.id, "allocated-idle"),
      result.metrics.idleAllocatedResourceSecondsByPool[pool.id]
    );
    assert.equal(
      integrate(result.resourceIntervals, pool.id, "released"),
      result.metrics.releasedResourceSecondsByPool[pool.id]
    );
    assert.equal(
      result.metrics.activeResourceSecondsByPool[pool.id] +
        result.metrics.idleAllocatedResourceSecondsByPool[pool.id],
      result.metrics.allocatedResourceSecondsByPool[pool.id]
    );
  }
});

test("makespan equals the final required task completion time", () => {
  const result = simulateWorkflow(minimalWorkflow);
  const finalCompletion = Math.max(
    ...result.events
      .filter((event) => event.type === "task_completed")
      .map((event) => event.simTimeS)
  );
  assert.equal(result.metrics.makespanS, finalCompletion);
});

test("zero-cost control dependencies are immediate and emit no communication events", () => {
  const workflow = {
    id: "serial-zero-control-edge",
    name: "serial zero control edge",
    resources: [{ id: "cpu", kind: "cpu", capacity: 1 }],
    policy: { allocation: "release-aware" },
    tasks: [
      {
        id: "a",
        label: "a",
        resourcePoolId: "cpu",
        resourceCount: 1,
        serviceTime: { kind: "constant", seconds: 1 },
      },
      {
        id: "b",
        label: "b",
        resourcePoolId: "cpu",
        resourceCount: 1,
        serviceTime: { kind: "constant", seconds: 2 },
      },
    ],
    dependencies: [
      { id: "a-b", sourceTaskId: "a", targetTaskId: "b" },
    ],
  };

  const result = simulateWorkflow(workflow);
  assert.equal(result.metrics.makespanS, 3);
  assert.deepEqual(starts(result), { a: 0, b: 1 });
  assert.equal(result.metrics.aggregateCommunicationSeconds, 0);
  assert.equal(
    result.events.filter((event) => event.type.startsWith("communication_")).length,
    0
  );
});

test("QPU capacity is configurable and permits concurrent tasks", () => {
  const workflow = {
    id: "qpu-capacity-two",
    name: "qpu capacity two",
    resources: [{ id: "qpu", kind: "qpu", capacity: 2 }],
    policy: {
      allocation: "release-aware",
      maxInFlightQuantumByPool: { qpu: 10 },
    },
    tasks: qpuTasks(2, "qpu", 2),
    dependencies: [],
  };

  const result = simulateWorkflow(workflow);
  assert.equal(result.metrics.makespanS, 2);
  assert.deepEqual(starts(result), { q1: 0, q2: 0 });
  assert.equal(result.metrics.queueWaitSecondsByPool.qpu, 0);
});

test("saturated capacity-1 QPU serializes independent tasks", () => {
  const workflow = {
    id: "qpu-saturated",
    name: "qpu saturated",
    resources: [{ id: "qpu", kind: "qpu", capacity: 1 }],
    policy: {
      allocation: "release-aware",
      maxInFlightQuantumByPool: { qpu: 10 },
    },
    tasks: qpuTasks(2, "qpu", 2),
    dependencies: [],
  };

  const result = simulateWorkflow(workflow);
  assert.equal(result.metrics.makespanS, 4);
  assert.deepEqual(starts(result), { q1: 0, q2: 2 });
  assert.equal(result.metrics.queueWaitSecondsByPool.qpu, 2);
  assert.ok(result.queueSeries.every((sample) => sample.depth >= 0));
});

test("E4 bounded in-flight quantum work separates policy wait from resource queue", () => {
  const workflow = {
    id: "e4-bounded-in-flight",
    name: "E4 bounded in-flight quantum work",
    resources: [{ id: "qpu", kind: "qpu", capacity: 1 }],
    policy: {
      allocation: "release-aware",
      maxInFlightQuantumByPool: { qpu: 2 },
    },
    tasks: qpuTasks(6),
    dependencies: [],
  };

  const result = simulateWorkflow(workflow);
  assert.equal(result.metrics.makespanS, 12);
  assert.deepEqual(starts(result), {
    q1: 0,
    q2: 2,
    q3: 4,
    q4: 6,
    q5: 8,
    q6: 10,
  });
  assert.equal(result.metrics.queueWaitSecondsByPool.qpu, 10);
  assert.equal(result.metrics.admissionWaitSecondsByPool.qpu, 20);
  assert.equal(
    Math.max(
      ...result.queueSeries
        .filter((sample) => sample.resourcePoolId === "qpu")
        .map((sample) => sample.depth)
    ),
    1
  );
  assert.ok(
    result.events
      .filter((event) => event.metadata?.qpuInFlight !== undefined)
      .every((event) => event.metadata.qpuInFlight <= 2)
  );
});

test("per-pool QPU admission limits do not couple independent QPU pools", () => {
  const workflow = {
    id: "per-pool-qpu-limits",
    name: "per-pool QPU limits",
    resources: [
      { id: "qpu-a", kind: "qpu", capacity: 1 },
      { id: "qpu-b", kind: "qpu", capacity: 1 },
    ],
    policy: {
      allocation: "release-aware",
      maxInFlightQuantumByPool: { "qpu-a": 1, "qpu-b": 1 },
    },
    tasks: [
      ...qpuTasks(2, "qpu-a").map((task, index) => ({
        ...task,
        id: `a${index + 1}`,
        label: `a${index + 1}`,
      })),
      ...qpuTasks(2, "qpu-b").map((task, index) => ({
        ...task,
        id: `b${index + 1}`,
        label: `b${index + 1}`,
      })),
    ],
    dependencies: [],
  };

  const result = simulateWorkflow(workflow);
  assert.equal(result.metrics.makespanS, 4);
  assert.deepEqual(starts(result), {
    a1: 0,
    a2: 2,
    b1: 0,
    b2: 2,
  });
  assert.equal(result.metrics.admissionWaitSecondsByPool["qpu-a"], 2);
  assert.equal(result.metrics.admissionWaitSecondsByPool["qpu-b"], 2);
});

test("fixed vs release-aware changes classical allocation accounting, not execution", () => {
  const fixed = clone(minimalWorkflow);
  fixed.id = "fixed";
  fixed.policy.allocation = "fixed";
  fixed.policy.fixedReservationByPool = { cpu: 2 };

  const releaseAware = clone(minimalWorkflow);
  releaseAware.id = "release-aware";
  releaseAware.policy.allocation = "release-aware";

  const a = simulateWorkflow(fixed);
  const b = simulateWorkflow(releaseAware);

  assert.equal(a.metrics.makespanS, b.metrics.makespanS);
  assert.equal(
    a.metrics.activeResourceSecondsByPool.cpu,
    b.metrics.activeResourceSecondsByPool.cpu
  );
  assert.ok(a.metrics.idleAllocatedResourceSecondsByPool.cpu > 0);
  assert.equal(b.metrics.idleAllocatedResourceSecondsByPool.cpu, 0);
  assert.equal(
    b.metrics.allocatedResourceSecondsByPool.cpu,
    b.metrics.activeResourceSecondsByPool.cpu
  );
});

function e5Workflow(allocation) {
  const policy =
    allocation === "fixed"
      ? {
          allocation,
          fixedReservationByPool: { cpu: 4 },
          maxInFlightQuantumByPool: { qpu: 1 },
        }
      : {
          allocation,
          maxInFlightQuantumByPool: { qpu: 1 },
        };

  const steps = [
    ["load", "cpu", 1, 1],
    ["build", "cpu", 1, 2],
    ["transpile", "cpu", 1, 2],
    ["sample", "qpu", 1, 4],
    ["recovery-0", "cpu", 1, 1],
    ["sbd-0", "cpu", 4, 3],
    ["bookkeeping-0", "cpu", 1, 0.5],
    ["recovery-1", "cpu", 1, 1],
    ["sbd-1", "cpu", 4, 3],
    ["bookkeeping-1", "cpu", 1, 0.5],
  ];

  return {
    id: `e5-${allocation}`,
    name: `E5 ${allocation}`,
    resources: [
      { id: "cpu", kind: "cpu", capacity: 4 },
      { id: "qpu", kind: "qpu", capacity: 1 },
    ],
    policy,
    tasks: steps.map(([id, pool, count, seconds]) => ({
      id,
      label: id,
      resourcePoolId: pool,
      resourceCount: count,
      serviceTime: { kind: "constant", seconds },
    })),
    dependencies: steps.slice(1).map((step, index) => ({
      id: `d-${index}`,
      sourceTaskId: steps[index][0],
      targetTaskId: step[0],
    })),
  };
}

test("E5 scaled IBM fixed-allocation accounting matches the accepted fixture", () => {
  const fixed = simulateWorkflow(e5Workflow("fixed"));
  const releaseAware = simulateWorkflow(e5Workflow("release-aware"));

  assert.equal(fixed.metrics.makespanS, 18);
  assert.equal(fixed.metrics.activeResourceSecondsByPool.qpu, 4);
  assert.equal(fixed.metrics.activeResourceSecondsByPool.cpu, 32);
  assert.equal(fixed.metrics.allocatedResourceSecondsByPool.cpu, 72);
  assert.equal(fixed.metrics.idleAllocatedResourceSecondsByPool.cpu, 40);

  assert.equal(releaseAware.metrics.makespanS, 18);
  assert.equal(releaseAware.metrics.activeResourceSecondsByPool.cpu, 32);
  assert.equal(releaseAware.metrics.allocatedResourceSecondsByPool.cpu, 32);
  assert.equal(releaseAware.metrics.idleAllocatedResourceSecondsByPool.cpu, 0);
});

test("fixed reservation limits classical concurrency and releases capacity outside reservation", () => {
  const workflow = {
    id: "fixed-reservation-two-of-four",
    name: "fixed reservation two of four",
    resources: [{ id: "cpu", kind: "cpu", capacity: 4 }],
    policy: {
      allocation: "fixed",
      fixedReservationByPool: { cpu: 2 },
    },
    tasks: [
      {
        id: "a",
        label: "a",
        resourcePoolId: "cpu",
        resourceCount: 2,
        serviceTime: { kind: "constant", seconds: 1 },
      },
      {
        id: "b",
        label: "b",
        resourcePoolId: "cpu",
        resourceCount: 2,
        serviceTime: { kind: "constant", seconds: 1 },
      },
    ],
    dependencies: [],
  };

  const result = simulateWorkflow(workflow);
  assert.equal(result.metrics.makespanS, 2);
  assert.deepEqual(starts(result), { a: 0, b: 1 });
  assert.equal(maxActiveUnits(result, "cpu"), 2);
  assert.equal(result.metrics.activeResourceSecondsByPool.cpu, 4);
  assert.equal(result.metrics.allocatedResourceSecondsByPool.cpu, 4);
  assert.equal(result.metrics.idleAllocatedResourceSecondsByPool.cpu, 0);
  assert.equal(result.metrics.releasedResourceSecondsByPool.cpu, 4);
});

test("same-timestamp dependency releases reach causal closure before resource starts", () => {
  const workflow = {
    id: "same-time-causal-closure",
    name: "same-time causal closure",
    resources: [
      { id: "gpu", kind: "gpu", capacity: 2 },
      { id: "cpu", kind: "cpu", capacity: 1 },
    ],
    policy: { allocation: "release-aware" },
    tasks: [
      {
        id: "source-a",
        label: "source a",
        resourcePoolId: "gpu",
        resourceCount: 1,
        serviceTime: { kind: "constant", seconds: 1 },
      },
      {
        id: "target-a",
        label: "target a",
        resourcePoolId: "cpu",
        resourceCount: 1,
        serviceTime: { kind: "constant", seconds: 1 },
      },
      {
        id: "source-b",
        label: "source b",
        resourcePoolId: "gpu",
        resourceCount: 1,
        serviceTime: { kind: "constant", seconds: 0 },
      },
      {
        id: "target-b",
        label: "target b",
        resourcePoolId: "cpu",
        resourceCount: 1,
        serviceTime: { kind: "constant", seconds: 1 },
      },
    ],
    dependencies: [
      {
        id: "a-release",
        sourceTaskId: "source-a",
        targetTaskId: "target-a",
      },
      {
        id: "b-release",
        sourceTaskId: "source-b",
        targetTaskId: "target-b",
        fixedLatencyS: 1,
      },
    ],
  };

  const result = simulateWorkflow(workflow);
  assert.deepEqual(starts(result), {
    "source-a": 0,
    "source-b": 0,
    "target-a": 1,
    "target-b": 2,
  });
  assert.equal(result.metrics.aggregateCommunicationSeconds, 1);
  assert.deepEqual(
    result.events
      .filter((event) => event.type.startsWith("communication_"))
      .map((event) => [event.type, event.metadata.dependencyId, event.simTimeS]),
    [
      ["communication_started", "b-release", 0],
      ["communication_completed", "b-release", 1],
    ]
  );
});

test("intervals are half-open and completion is authoritative in the event trace", () => {
  const workflow = {
    id: "zero-duration",
    name: "zero duration",
    resources: [{ id: "cpu", kind: "cpu", capacity: 1 }],
    policy: { allocation: "release-aware" },
    tasks: [
      {
        id: "instant",
        label: "instant",
        resourcePoolId: "cpu",
        resourceCount: 1,
        serviceTime: { kind: "constant", seconds: 0 },
      },
    ],
    dependencies: [],
  };

  const result = simulateWorkflow(workflow);
  assert.equal(result.metrics.makespanS, 0);
  assert.equal(
    result.events.filter(
      (event) => event.type === "task_completed" && event.taskId === "instant"
    ).length,
    1
  );
  assert.equal(result.taskIntervals.length, 0);
  assert.ok(result.resourceIntervals.every((interval) => interval.endS >= interval.startS));
  assert.ok(result.taskIntervals.every((interval) => interval.state !== "complete"));
});

test("workflow validation rejects invalid DAG/capacity/reservation/admission configs", () => {
  const cycle = {
    id: "cycle",
    name: "cycle",
    resources: [{ id: "cpu", kind: "cpu", capacity: 1 }],
    policy: { allocation: "fixed" },
    tasks: [
      {
        id: "a",
        label: "a",
        resourcePoolId: "cpu",
        resourceCount: 1,
        serviceTime: { kind: "constant", seconds: 1 },
      },
      {
        id: "b",
        label: "b",
        resourcePoolId: "cpu",
        resourceCount: 1,
        serviceTime: { kind: "constant", seconds: 1 },
      },
    ],
    dependencies: [
      { id: "a-b", sourceTaskId: "a", targetTaskId: "b" },
      { id: "b-a", sourceTaskId: "b", targetTaskId: "a" },
    ],
  };
  assert.throws(() => validateWorkflowSpec(cycle), /must form a DAG/);

  const overCapacity = clone(cycle);
  overCapacity.id = "over-capacity";
  overCapacity.dependencies = [];
  overCapacity.tasks[0].resourceCount = 2;
  assert.throws(() => validateWorkflowSpec(overCapacity), /exceeds pool/);

  const overReservation = clone(cycle);
  overReservation.id = "over-reservation";
  overReservation.dependencies = [];
  overReservation.resources[0].capacity = 4;
  overReservation.policy.fixedReservationByPool = { cpu: 1 };
  overReservation.tasks[0].resourceCount = 2;
  assert.throws(() => validateWorkflowSpec(overReservation), /exceeds fixed reservation/);

  const invalidAdmissionPool = clone(cycle);
  invalidAdmissionPool.id = "invalid-admission-pool";
  invalidAdmissionPool.dependencies = [];
  invalidAdmissionPool.policy.maxInFlightQuantumByPool = { cpu: 1 };
  assert.throws(() => validateWorkflowSpec(invalidAdmissionPool), /is not a QPU pool/);

  const legacyGlobalLimit = clone(cycle);
  legacyGlobalLimit.id = "legacy-global-limit";
  legacyGlobalLimit.dependencies = [];
  legacyGlobalLimit.policy.maxInFlightQuantum = 1;
  assert.throws(() => validateWorkflowSpec(legacyGlobalLimit), /replaced by maxInFlightQuantumByPool/);
});
