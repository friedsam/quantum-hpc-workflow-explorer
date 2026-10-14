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

function approx(actual, expected, epsilon = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `expected ${actual} ≈ ${expected}`
  );
}

function compile(bundle) {
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
    value: { ...current.value, fixedLatencyS: seconds },
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
    0.1
  );

  const editedCompiled = compile(editedBundle);
  const editedResult = simulateWorkflow(
    editedCompiled.workflowSpec
  );

  assert.deepEqual(
    editedBundle.design,
    baselineBundle.design
  );
  approx(baselineResult.metrics.makespanS, 705.1);
  approx(editedResult.metrics.makespanS, 702.45);
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
      working: 1,
      blocked: 996,
      idle: 3
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
    0.1
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
  approx(
    baselineRun.simulationResult.metrics.makespanS -
      editedRun.simulationResult.metrics.makespanS,
    2.65
  );
});

test("public C preset declares per-rank jobs and explicit transfer provenance", () => {
  assert.equal(qampScenarioC1000Design.metadata.synchronization,"none");
  assert.equal(qampScenarioC1000Design.metadata.requestGranularity,"individual-per-rank");

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
      /QAMP Scenario C individual-request staggered-transfer/
    );
  }
});

test("C editable baseline latency preserves 0.7-second per-request delivery spacing",()=>{
 const b=structuredClone(logicalPresetBundles.C);
 replaceTransferLatency(b,"outbound-transfer",3.5);
 assert.equal(b.systemProfile.dependencyCommunication["outbound-transfer"].value.instanceStaggerS,0.7);
 const spec=compile(b).workflowSpec;
 assert.equal(spec.dependencies.find(x=>x.id==="prepare-quantum#1").fixedLatencyS,3.5);
 assert.ok(Math.abs(spec.dependencies.find(x=>x.id==="prepare-quantum#2").fixedLatencyS-4.2)<1e-9);
});
