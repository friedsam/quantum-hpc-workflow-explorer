import test from "node:test";
import assert from "node:assert/strict";

import {
  compileWorkflowDesignDetailed,
  createRunRecord
} from "../src/design/compiler.mjs";
import { deriveActorStateCountsAt } from "../src/design/actor-state.mjs";
import { simulateWorkflow } from "../src/engine/runtime.mjs";
import { logicalPresetBundles } from "../src/presets/logical-presets.mjs";
import {
  qampScenarioC1000Design,
  qampScenarioC1000Profile
} from "../src/presets/qamp-c-1000-demo.mjs";

function approx(actual, expected, epsilon = 1e-9) {\n  assert.ok(\n    Math.abs(actual - expected) <= epsilon,\n    `expected ${actual} ≈ ${expected}`\n  );\n}\n\nfunction compile(bundle) {
  return compileWorkflowDesignDetailed(
    bundle.design,
    bundle.runConfiguration,
    bundle.systemProfile
  );
}

function replaceTransferLatency(
  bundle,
  key,
  seconds
) {
  const current =
    bundle.systemProfile.dependencyCommunication[key];

  bundle.systemProfile.dependencyCommunication[key] = {
    value: { fixedLatencyS: seconds },
    provenance: {
      kind: "user-entered",
      source: "Round 4I UI acceptance",
      notes: "Builder-style transfer-latency edit."
    }
  };

  return current;
}

test("public C transfer edit preserves topology and reduces makespan/blocked duration", () => {
  const baselineBundle = structuredClone(
    logicalPresetBundles.C
  );
  const baselineCompiled = compile(baselineBundle);
  const baselineResult = simulateWorkflow(
    baselineCompiled.workflowSpec
  );

  const editedBundle = structuredClone(baselineBundle);
  replaceTransferLatency(
    editedBundle,
    "outbound-transfer",
    2.5
  );
  replaceTransferLatency(
    editedBundle,
    "return-transfer",
    1.5
  );

  const editedCompiled = compile(editedBundle);
  const editedResult = simulateWorkflow(
    editedCompiled.workflowSpec
  );

  assert.deepEqual(
    editedBundle.design,
    baselineBundle.design
  );
  approx(baselineResult.metrics.makespanS, 12.8);
  approx(editedResult.metrics.makespanS, 8.8);
  assert.equal(editedResult.metrics.queueWaitSecondsByPool.qpu, 0);
  assert.equal(
    editedResult.metrics.admissionWaitSecondsByPool.qpu,
    0
  );

  assert.deepEqual(
    deriveActorStateCountsAt(
      baselineCompiled.manifest,
      baselineResult,
      "ranks",
      5
    ),
    {
      actorGroupId: "ranks",
      simTimeS: 5,
      working: 0,
      blocked: 1000,
      idle: 0
    }
  );

  assert.deepEqual(
    deriveActorStateCountsAt(
      editedCompiled.manifest,
      editedResult,
      "ranks",
      5
    ),
    {
      actorGroupId: "ranks",
      simTimeS: 5,
      working: 0,
      blocked: 800,
      idle: 200
    }
  );
});

test("C transfer edit stays comparable with provenance", () => {
  const baselineBundle = structuredClone(
    logicalPresetBundles.C
  );
  const editedBundle = structuredClone(
    logicalPresetBundles.C
  );

  replaceTransferLatency(
    editedBundle,
    "outbound-transfer",
    2.5
  );
  replaceTransferLatency(
    editedBundle,
    "return-transfer",
    1.5
  );

  const baselineCompiled = compile(baselineBundle);
  const editedCompiled = compile(editedBundle);
  const baselineResult = simulateWorkflow(
    baselineCompiled.workflowSpec
  );
  const editedResult = simulateWorkflow(
    editedCompiled.workflowSpec
  );

  const baselineRun = createRunRecord({
    id: "c-baseline",
    design: baselineBundle.design,
    runConfiguration: baselineBundle.runConfiguration,
    systemProfile: baselineBundle.systemProfile,
    compiledWorkflowSpec: baselineCompiled.workflowSpec,
    compilationManifest: baselineCompiled.manifest,
    simulationResult: baselineResult
  });
  const editedRun = createRunRecord({
    id: "c-edited",
    design: editedBundle.design,
    runConfiguration: editedBundle.runConfiguration,
    systemProfile: editedBundle.systemProfile,
    compiledWorkflowSpec: editedCompiled.workflowSpec,
    compilationManifest: editedCompiled.manifest,
    simulationResult: editedResult
  });

  assert.equal(baselineRun.design.id, editedRun.design.id);
  assert.equal(
    editedRun.systemProfile.dependencyCommunication[
      "outbound-transfer"
    ].provenance.kind,
    "user-entered"
  );
  assert.equal(
    editedRun.systemProfile.dependencyCommunication[
      "return-transfer"
    ].provenance.kind,
    "user-entered"
  );
  assert.equal(
    baselineRun.simulationResult.metrics.makespanS -
      editedRun.simulationResult.metrics.makespanS,
    4
  );
});

test("public C preset declares synthetic cohort aggregation and transfer provenance", () => {
  assert.equal(
    qampScenarioC1000Design.metadata.synchronization,
    "none"
  );
  assert.match(
    qampScenarioC1000Design.metadata.aggregation,
    /5 cohorts × 200/
  );

  for (const entry of Object.values(
    qampScenarioC1000Profile.taskServiceTimes
  )) {
    assert.equal(entry.provenance.kind, "synthetic");
  }

  for (const entry of Object.values(
    qampScenarioC1000Profile.dependencyCommunication
  )) {
    assert.equal(entry.provenance.kind, "synthetic");
    assert.match(
      entry.provenance.source,
      /Scenario C 1000-rank cohort transfer-wall/
    );
  }
});
