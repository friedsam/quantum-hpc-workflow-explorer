import test from "node:test";
import assert from "node:assert/strict";

import { simulateWorkflow, validateWorkflowSpec } from "../index.mjs";
import {
  compileWorkflowDesign,
  createRunRecord,
} from "../design/compile.mjs";
import {
  qampScenarioADesign,
  qampScenarioARunConfiguration,
  qampScenarioASystemProfile,
  qampScenarioACompiled,
} from "../examples/qamp-a-design-compile.mjs";

const synthetic = (notes = "") => ({
  kind: "synthetic",
  source: "design-compile test",
  notes,
});

test("QAMP A design compiles to frozen-v1 behavior", () => {
  assert.equal(validateWorkflowSpec(qampScenarioACompiled), true);

  const compiledResult = simulateWorkflow(qampScenarioACompiled);

  assert.equal(compiledResult.metrics.makespanS, 10);
  assert.equal(compiledResult.metrics.queueWaitSecondsByPool.qpu, 0);
  assert.equal(compiledResult.metrics.admissionWaitSecondsByPool.qpu, 0);
  assert.equal(compiledResult.metrics.activeResourceSecondsByPool.qpu, 4);
  assert.deepEqual(
    compiledResult.events
      .filter((event) => event.type === "task_started")
      .map((event) => [event.taskId, event.simTimeS]),
    [
      ["independent-classical", 0],
      ["quantum-prep", 0],
      ["quantum-run", 1],
      ["local-consumer", 5],
    ]
  );

  assert.equal(qampScenarioACompiled.resources[0].costPerUnitSecond, 0.01);
  assert.equal(qampScenarioACompiled.resources[1].costPerUnitSecond, 0.2);

  const quantumTask = qampScenarioACompiled.tasks.find(
    (task) => task.id === "quantum-run"
  );
  assert.equal(quantumTask.metadata.designTaskId, "quantum-run");
  assert.deepEqual(quantumTask.metadata.actorGroupIds, ["quantum-path"]);
  assert.equal(quantumTask.metadata.timingProvenance.kind, "synthetic");
});

test("repeat blocks unroll deterministically before frozen DES execution", () => {
  const design = {
    id: "repeat-design",
    name: "Bounded repeat example",
    tasks: [
      { id: "prepare", label: "Prepare" },
      { id: "consume", label: "Consume" },
    ],
    dependencies: [
      {
        id: "prepare-consume",
        sourceTaskId: "prepare",
        targetTaskId: "consume",
      },
    ],
    repeatBlocks: [
      {
        id: "iteration",
        count: 3,
        taskIds: ["prepare", "consume"],
        carryDependencies: [
          {
            id: "next",
            sourceTaskId: "consume",
            targetTaskId: "prepare",
          },
        ],
      },
    ],
  };

  const runConfiguration = {
    id: "repeat-run",
    resources: [{ id: "cpu", kind: "cpu", capacity: 1 }],
    taskResources: {
      prepare: { resourcePoolId: "cpu", resourceCount: 1 },
      consume: { resourcePoolId: "cpu", resourceCount: 1 },
    },
    policy: { allocation: "release-aware" },
  };

  const systemProfile = {
    id: "repeat-profile",
    taskServiceTimes: {
      prepare: {
        value: { kind: "constant", seconds: 1 },
        provenance: synthetic(),
      },
      consume: {
        value: { kind: "constant", seconds: 2 },
        provenance: synthetic(),
      },
    },
  };

  const compiled = compileWorkflowDesign(
    design,
    runConfiguration,
    systemProfile
  );

  assert.deepEqual(
    compiled.tasks.map((task) => task.id),
    [
      "prepare@iteration:1",
      "consume@iteration:1",
      "prepare@iteration:2",
      "consume@iteration:2",
      "prepare@iteration:3",
      "consume@iteration:3",
    ]
  );
  assert.equal(compiled.dependencies.length, 5);
  assert.ok(
    compiled.dependencies.some(
      (dep) =>
        dep.sourceTaskId === "consume@iteration:1" &&
        dep.targetTaskId === "prepare@iteration:2"
    )
  );
  assert.ok(
    compiled.dependencies.some(
      (dep) =>
        dep.sourceTaskId === "consume@iteration:2" &&
        dep.targetTaskId === "prepare@iteration:3"
    )
  );

  const result = simulateWorkflow(compiled);
  assert.equal(result.metrics.makespanS, 9);
});

test("SystemProfile communication resolves to frozen dependency fields and run cost override wins", () => {
  const design = {
    id: "profile-resolution",
    name: "Profile resolution",
    tasks: [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ],
    dependencies: [
      {
        id: "a-b",
        sourceTaskId: "a",
        targetTaskId: "b",
        communicationKey: "uplink",
      },
    ],
  };

  const runConfiguration = {
    id: "profile-resolution-run",
    resources: [{ id: "cpu", kind: "cpu", capacity: 1 }],
    taskResources: {
      a: { resourcePoolId: "cpu", resourceCount: 1 },
      b: { resourcePoolId: "cpu", resourceCount: 1 },
    },
    policy: { allocation: "release-aware" },
    costOverridesByPool: {
      cpu: {
        value: 0.5,
        provenance: {
          kind: "user-entered",
          source: "test override",
        },
      },
    },
  };

  const systemProfile = {
    id: "profile-resolution-system",
    taskServiceTimes: {
      a: {
        value: { kind: "constant", seconds: 1 },
        provenance: synthetic(),
      },
      b: {
        value: { kind: "constant", seconds: 1 },
        provenance: synthetic(),
      },
    },
    dependencyCommunication: {
      uplink: {
        value: {
          fixedLatencyS: 1,
          dataBytes: 100,
          bandwidthBytesPerS: 100,
        },
        provenance: {
          kind: "measured",
          source: "illustrative test measurement",
        },
      },
    },
    costPerUnitSecond: {
      cpu: {
        value: 0.1,
        provenance: {
          kind: "measured",
          source: "illustrative default measurement",
        },
      },
    },
  };

  const compiled = compileWorkflowDesign(
    design,
    runConfiguration,
    systemProfile
  );

  assert.equal(compiled.resources[0].costPerUnitSecond, 0.5);
  assert.deepEqual(compiled.dependencies[0], {
    id: "a-b",
    sourceTaskId: "a",
    targetTaskId: "b",
    fixedLatencyS: 1,
    dataBytes: 100,
    bandwidthBytesPerS: 100,
  });

  const result = simulateWorkflow(compiled);
  assert.equal(result.metrics.aggregateCommunicationSeconds, 2);
  assert.equal(result.metrics.makespanS, 4);
});

test("RunRecord snapshots exact design/config/profile/spec/result", () => {
  const design = structuredClone(qampScenarioADesign);
  const runConfiguration = structuredClone(qampScenarioARunConfiguration);
  const systemProfile = structuredClone(qampScenarioASystemProfile);
  const compiled = compileWorkflowDesign(
    design,
    runConfiguration,
    systemProfile
  );
  const result = simulateWorkflow(compiled);

  const record = createRunRecord({
    id: "qamp-a-run-record",
    design,
    runConfiguration,
    systemProfile,
    compiledWorkflowSpec: compiled,
    simulationResult: result,
    metadata: { purpose: "acceptance" },
  });

  design.name = "mutated after record";
  runConfiguration.resources[0].capacity = 99;
  systemProfile.taskServiceTimes["quantum-run"].value.seconds = 99;

  assert.equal(record.design.name, "QAMP A — loosely coupled overlap");
  assert.equal(record.runConfiguration.resources[0].capacity, 2);
  assert.equal(
    record.systemProfile.taskServiceTimes["quantum-run"].value.seconds,
    4
  );
  assert.equal(record.compiledWorkflowSpec.id, result.workflowId);
  assert.equal(record.simulationResult.metrics.makespanS, 10);
});

test("resource-count changes do not imply task-time scaling under constant SystemProfile", () => {
  const design = {
    id: "rank-count-no-scaling",
    name: "Rank count does not imply scaling",
    tasks: [{ id: "work", label: "Work" }],
    dependencies: [],
  };

  const profile = {
    id: "constant-profile",
    taskServiceTimes: {
      work: {
        value: { kind: "constant", seconds: 5 },
        provenance: {
          kind: "fitted",
          source: "constant fit",
        },
      },
    },
  };

  const config = (count) => ({
    id: `count-${count}`,
    resources: [{ id: "cpu", kind: "cpu", capacity: 4 }],
    taskResources: {
      work: { resourcePoolId: "cpu", resourceCount: count },
    },
    policy: { allocation: "release-aware" },
  });

  const one = compileWorkflowDesign(design, config(1), profile);
  const four = compileWorkflowDesign(design, config(4), profile);

  assert.equal(one.tasks[0].serviceTime.seconds, 5);
  assert.equal(four.tasks[0].serviceTime.seconds, 5);
  assert.equal(simulateWorkflow(one).metrics.makespanS, 5);
  assert.equal(simulateWorkflow(four).metrics.makespanS, 5);
});
