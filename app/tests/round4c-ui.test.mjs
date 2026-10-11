import test from "node:test";
import assert from "node:assert/strict";

import { compileWorkflowDesignDetailed } from "../src/design/compiler.mjs";
import {
  deriveActorStateCountsAt
} from "../src/design/actor-state.mjs";
import {
  buildActorAwareVisualKeyframes
} from "../src/playback/actor-aware-view.mjs";
import { simulateWorkflow } from "../src/engine/runtime.mjs";
import {
  qampScenarioBActorCompilation,
  qampScenarioBActorWorkflowSpec
} from "./fixtures/qamp-b-actor-model.mjs";
import {
  logicalPresetBundles
} from "../src/presets/logical-presets.mjs";

const synthetic = () => ({
  kind: "user-entered",
  source: "Round 4C acceptance"
});

test("multiplicity editing changes compiled instance count while resource units remain per instance", () => {
  const design = {
    schemaVersion: 1,
    id: "edit-multiplicity",
    name: "Multiplicity editor acceptance",
    tasks: [
      { id: "prepare", label: "Prepare", multiplicity: 3 },
      { id: "consume", label: "Consume", multiplicity: 3 }
    ],
    dependencies: [
      {
        id: "prepare-consume",
        sourceTaskId: "prepare",
        targetTaskId: "consume"
      }
    ]
  };

  const runConfiguration = {
    schemaVersion: 1,
    id: "edit-multiplicity-run",
    resources: [{ id: "cpu", kind: "cpu", capacity: 4 }],
    taskResources: {
      prepare: { resourcePoolId: "cpu", resourceCount: 2 },
      consume: { resourcePoolId: "cpu", resourceCount: 1 }
    },
    policy: { allocation: "release-aware" }
  };

  const systemProfile = {
    schemaVersion: 1,
    id: "edit-multiplicity-profile",
    taskServiceTimes: {
      prepare: {
        value: { kind: "constant", seconds: 1 },
        provenance: synthetic()
      },
      consume: {
        value: { kind: "constant", seconds: 1 },
        provenance: synthetic()
      }
    }
  };

  const { workflowSpec, manifest } = compileWorkflowDesignDetailed(
    design,
    runConfiguration,
    systemProfile
  );

  assert.equal(workflowSpec.tasks.length, 6);
  assert.deepEqual(
    workflowSpec.tasks.slice(0, 3).map((task) => [
      task.id,
      task.resourceCount
    ]),
    [
      ["prepare#1", 2],
      ["prepare#2", 2],
      ["prepare#3", 2]
    ]
  );
  assert.equal(manifest.tasks["prepare#3"].logicalMultiplicity, 3);
});

test("unequal multiplicity dependency is rejected until mapping is explicit", () => {
  const design = {
    schemaVersion: 1,
    id: "unequal",
    name: "Unequal mapping",
    tasks: [
      { id: "a", label: "A", multiplicity: 2 },
      { id: "b", label: "B", multiplicity: 1 }
    ],
    dependencies: [
      { id: "a-b", sourceTaskId: "a", targetTaskId: "b" }
    ]
  };
  const config = {
    schemaVersion: 1,
    id: "unequal-run",
    resources: [{ id: "cpu", kind: "cpu", capacity: 2 }],
    taskResources: {
      a: { resourcePoolId: "cpu", resourceCount: 1 },
      b: { resourcePoolId: "cpu", resourceCount: 1 }
    },
    policy: { allocation: "release-aware" }
  };
  const profile = {
    schemaVersion: 1,
    id: "unequal-profile",
    taskServiceTimes: {
      a: {
        value: { kind: "constant", seconds: 1 },
        provenance: synthetic()
      },
      b: {
        value: { kind: "constant", seconds: 1 },
        provenance: synthetic()
      }
    }
  };

  assert.throws(
    () => compileWorkflowDesignDetailed(design, config, profile),
    /instanceMapping is required/
  );

  design.dependencies[0].instanceMapping = "all-to-all";
  const compiled = compileWorkflowDesignDetailed(
    design,
    config,
    profile
  ).workflowSpec;
  assert.equal(compiled.dependencies.length, 2);
});

test("Scenario B actor sequence remains 2W/0B/2I -> 0W/2B/2I -> 0W/4B/0I -> 4W/0B/0I", () => {
  const result = simulateWorkflow(qampScenarioBActorWorkflowSpec);
  const manifest = qampScenarioBActorCompilation.manifest;

  assert.deepEqual(
    [0.5, 2, 5, 7.5].map((time) => {
      const counts = deriveActorStateCountsAt(
        manifest,
        result,
        "ranks",
        time
      );
      return [counts.working, counts.blocked, counts.idle];
    }),
    [
      [2, 0, 2],
      [0, 2, 2],
      [0, 4, 0],
      [4, 0, 0]
    ]
  );
});

test("actor-aware playback preserves neutral repeated-activity wording", () => {
  const result = simulateWorkflow(qampScenarioBActorWorkflowSpec);
  const frames = buildActorAwareVisualKeyframes(result, {
    manifest: qampScenarioBActorCompilation.manifest,
    deriveActorStateDetailAt: (
      manifest,
      simulationResult,
      actorGroupId,
      actorOrdinal,
      simTimeS
    ) => {
      // Lazy import is unnecessary here: the dedicated actor-model suite
      // verifies the producer. This acceptance only checks produced labels.
      const group = manifest.actorGroups[actorGroupId];
      assert.ok(group);
      return {
        actorGroupId,
        actorOrdinal,
        simTimeS,
        state: "idle",
        blockedReasons: []
      };
    }
  });

  assert.ok(
    frames.every((frame) => !/algorithmic loop|cycle/i.test(frame.label))
  );
});

test("direct WorkflowSpec compatibility still simulates without logical design", () => {
  const spec = {
    id: "direct-custom",
    name: "Direct custom compatibility",
    resources: [{ id: "cpu", kind: "cpu", capacity: 1 }],
    tasks: [
      {
        id: "a",
        label: "A",
        resourcePoolId: "cpu",
        resourceCount: 1,
        serviceTime: { kind: "constant", seconds: 1 }
      },
      {
        id: "b",
        label: "B",
        resourcePoolId: "cpu",
        resourceCount: 1,
        serviceTime: { kind: "constant", seconds: 2 }
      }
    ],
    dependencies: [
      { id: "a-b", sourceTaskId: "a", targetTaskId: "b" }
    ],
    policy: { allocation: "release-aware" }
  };

  assert.equal(simulateWorkflow(spec).metrics.makespanS, 3);
});


test("user-facing logical A-D presets compile and preserve their accepted mechanisms", () => {
  const compiled = Object.fromEntries(
    Object.entries(logicalPresetBundles).map(([key, bundle]) => [
      key,
      compileWorkflowDesignDetailed(
        bundle.design,
        bundle.runConfiguration,
        bundle.systemProfile
      ).workflowSpec
    ])
  );

  const custom = simulateWorkflow(compiled.custom);
  assert.equal(custom.metrics.makespanS, 2);

  const a = simulateWorkflow(compiled.A);
  assert.equal(a.metrics.makespanS, 10);
  assert.equal(a.metrics.queueWaitSecondsByPool.qpu, 0);
  assert.equal(a.metrics.admissionWaitSecondsByPool.qpu, 0);
  assert.equal(
    logicalPresetBundles.A.runConfiguration.policy.maxInFlightQuantumByPool,
    undefined
  );
  assert.equal(
    a.events.find(
      (event) =>
        event.type === "task_started" &&
        event.taskId === "local-consume"
    ).simTimeS,
    3
  );
  assert.equal(
    a.events.find(
      (event) =>
        event.type === "task_completed" &&
        event.taskId === "local-consume"
    ).simTimeS,
    8
  );

  const b = simulateWorkflow(compiled.B);
  assert.equal(compiled.B.tasks.length, 5);
  assert.equal(b.metrics.makespanS, 8);
  assert.equal(b.metrics.queueWaitSecondsByPool.qpu, 0);
  assert.ok(b.metrics.admissionWaitSecondsByPool.qpu > 0);

  const cResult = simulateWorkflow(compiled.C);
  const cService = compiled.C.tasks.reduce(
    (sum, task) => sum + task.serviceTime.seconds,
    0
  );
  assert.ok(
    cResult.metrics.aggregateCommunicationSeconds > cService
  );
  assert.equal(cResult.metrics.queueWaitSecondsByPool.qpu, 0);
  assert.ok(cResult.metrics.utilizationByPool.qpu < 0.1);

  const d = simulateWorkflow(compiled.D);
  assert.ok(d.metrics.queueWaitSecondsByPool.qpu > 0);
  assert.ok(d.metrics.admissionWaitSecondsByPool.qpu > 0);
  assert.ok(d.metrics.utilizationByPool.qpu > 0.9);

  const firstConsumer = d.events.find(
    (event) =>
      event.type === "task_started" &&
      event.taskId === "consumer#1"
  ).simTimeS;
  const lastQuantum = d.events.find(
    (event) =>
      event.type === "task_completed" &&
      event.taskId === "quantum#6"
  ).simTimeS;
  assert.ok(firstConsumer < lastQuantum);
});
