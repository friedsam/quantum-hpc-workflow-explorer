import test from "node:test";
import assert from "node:assert/strict";

import {
  compileWorkflowDesignDetailed,
  createRunRecord
} from "../src/design/compiler.mjs";
import { simulateWorkflow } from "../src/engine/runtime.mjs";
import { logicalPresetBundles } from "../src/presets/logical-presets.mjs";
import {
  qampScenarioB200Design,
  qampScenarioB200RunConfiguration,
  qampScenarioB200Profile
} from "../src/presets/qamp-b-200-demo.mjs";

function compile(bundle) {
  return compileWorkflowDesignDetailed(
    bundle.design,
    bundle.runConfiguration,
    bundle.systemProfile
  );
}

test("public B200 edit re-compiles, re-simulates, and remains comparable", () => {
  const baselineBundle = structuredClone(logicalPresetBundles.B);
  const baselineCompiled = compile(baselineBundle);
  const baselineResult = simulateWorkflow(
    baselineCompiled.workflowSpec
  );

  const editedBundle = structuredClone(baselineBundle);
  editedBundle.systemProfile = {
    ...editedBundle.systemProfile,
    id: "qamp-b-200-user-edit",
    taskServiceTimes: {
      ...editedBundle.systemProfile.taskServiceTimes,
      quantum: {
        value: { kind: "constant", seconds: 1.5 },
        provenance: {
          kind: "user-entered",
          source: "Round 4H UI acceptance",
          notes: "Builder-style QPU modeled wall-time edit."
        }
      }
    }
  };

  const editedCompiled = compile(editedBundle);
  const editedResult = simulateWorkflow(
    editedCompiled.workflowSpec
  );

  assert.equal(baselineResult.metrics.makespanS, 202);
  assert.equal(editedResult.metrics.makespanS, 302);
  assert.equal(editedResult.metrics.queueWaitSecondsByPool.qpu, 0);
  assert.ok(editedResult.metrics.admissionWaitSecondsByPool.qpu > 0);

  const baselineRun = createRunRecord({
    id: "b-baseline",
    design: baselineBundle.design,
    runConfiguration: baselineBundle.runConfiguration,
    systemProfile: baselineBundle.systemProfile,
    compiledWorkflowSpec: baselineCompiled.workflowSpec,
    compilationManifest: baselineCompiled.manifest,
    simulationResult: baselineResult
  });
  const editedRun = createRunRecord({
    id: "b-edited",
    design: editedBundle.design,
    runConfiguration: editedBundle.runConfiguration,
    systemProfile: editedBundle.systemProfile,
    compiledWorkflowSpec: editedCompiled.workflowSpec,
    compilationManifest: editedCompiled.manifest,
    simulationResult: editedResult
  });

  assert.equal(baselineRun.design.id, editedRun.design.id);
  assert.equal(
    editedRun.systemProfile.taskServiceTimes.quantum.provenance.kind,
    "user-entered"
  );
  assert.equal(
    editedRun.simulationResult.metrics.makespanS -
      baselineRun.simulationResult.metrics.makespanS,
    100
  );
});

test("public B200 synthetic provenance is explicit", () => {
  assert.equal(qampScenarioB200RunConfiguration.actorGroupCounts.ranks, 1000);
  assert.equal(qampScenarioB200Design.tasks.length, 3);

  for (const entry of Object.values(
    qampScenarioB200Profile.taskServiceTimes
  )) {
    assert.equal(entry.provenance.kind, "synthetic");
    assert.equal(
      entry.provenance.source,
      "Round 4H public Scenario B 1000-actor/200-submit demo"
    );
  }

  assert.ok(
    qampScenarioB200Design.assumptions.some((text) =>
      /global synchronization/i.test(text)
    )
  );
});
