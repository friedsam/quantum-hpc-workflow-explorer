import test from "node:test";
import assert from "node:assert/strict";

import { compileWorkflowDesignDetailed } from "../src/design/compiler.mjs";
import {
  deriveActorGroupSummaryAt,
  deriveActorStateCountsAt
} from "../src/design/actor-state.mjs";
import { deriveSystemStateSnapshot } from "../src/causal/systemState.mjs";
import { simulateWorkflow } from "../src/engine/runtime.mjs";
import { logicalPresetBundles } from "../src/presets/logical-presets.mjs";

function compile(bundle) {
  return compileWorkflowDesignDetailed(
    bundle.design,
    bundle.runConfiguration,
    bundle.systemProfile
  );
}

test("public Scenario B is compact B200 over 401 compiled DES tasks", () => {
  const bundle = logicalPresetBundles.B;
  const { workflowSpec, manifest } = compile(bundle);

  assert.equal(bundle.design.id, "qamp-b-1000-actor-200-submit-demo");
  assert.deepEqual(
    bundle.design.tasks.map((task) => [
      task.id,
      task.multiplicity ?? 1
    ]),
    [
      ["prepare", 200],
      ["quantum", 200],
      ["collective", 1]
    ]
  );
  assert.equal(workflowSpec.tasks.length, 401);
  assert.equal(manifest.actorGroups.ranks.count, 1000);
  assert.equal(
    bundle.runConfiguration.policy.maxInFlightQuantumByPool.qpu,
    1
  );
});

test("B200 wall is global synchronization, not QPU resource queue", () => {
  const compiled = compile(logicalPresetBundles.B);
  const result = simulateWorkflow(compiled.workflowSpec);

  assert.equal(result.metrics.makespanS, 202);
  assert.equal(result.metrics.queueWaitSecondsByPool.qpu, 0);
  assert.ok(result.metrics.admissionWaitSecondsByPool.qpu > 0);

  assert.deepEqual(
    deriveActorStateCountsAt(
      compiled.manifest,
      result,
      "ranks",
      0.5
    ),
    {
      actorGroupId: "ranks",
      simTimeS: 0.5,
      working: 200,
      blocked: 0,
      idle: 800
    }
  );

  assert.deepEqual(
    deriveActorStateCountsAt(
      compiled.manifest,
      result,
      "ranks",
      1
    ),
    {
      actorGroupId: "ranks",
      simTimeS: 1,
      working: 0,
      blocked: 200,
      idle: 800
    }
  );

  const summaryAt2 = deriveActorGroupSummaryAt(
    compiled.manifest,
    result,
    "ranks",
    2
  );
  assert.deepEqual(
    {
      working: summaryAt2.working,
      blocked: summaryAt2.blocked,
      idle: summaryAt2.idle
    },
    { working: 0, blocked: 1000, idle: 0 }
  );
  assert.equal(
    summaryAt2.blockedReasonCounts["global-synchronization"],
    1000
  );
  assert.equal(
    summaryAt2.blockedReasonCounts["quantum-result"],
    199
  );

  const snapshotAt1 = deriveSystemStateSnapshot(
    compiled.workflowSpec,
    result,
    1
  );
  assert.equal(snapshotAt1.resources.qpuByPool.qpu.queueDepth, 0);
  assert.equal(
    snapshotAt1.causal.policyHeldQuantumTasks.length,
    199
  );
  assert.equal(snapshotAt1.resources.qpuByPool.qpu.activeUnits, 1);

  assert.deepEqual(
    deriveActorStateCountsAt(
      compiled.manifest,
      result,
      "ranks",
      201.5
    ),
    {
      actorGroupId: "ranks",
      simTimeS: 201.5,
      working: 1000,
      blocked: 0,
      idle: 0
    }
  );
});
