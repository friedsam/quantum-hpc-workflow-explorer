import test from "node:test";
import assert from "node:assert/strict";

import {
  compileWorkflowDesignDetailed,
  createRunRecord
} from "../src/design/compiler.mjs";
import { simulateWorkflow } from "../src/engine/runtime.mjs";
import { logicalPresetBundles } from "../src/presets/logical-presets.mjs";

function compile(bundle) {
  return compileWorkflowDesignDetailed(
    bundle.design,
    bundle.runConfiguration,
    bundle.systemProfile
  );
}

test("D QPU wall-time edit changes metrics and saved provenance", () => {
  const baseline = structuredClone(logicalPresetBundles.D);
  const edited = structuredClone(logicalPresetBundles.D);

  edited.systemProfile = {
    ...edited.systemProfile,
    id: "qamp-d-user-edit-profile",
    taskServiceTimes: {
      ...edited.systemProfile.taskServiceTimes,
      quantum: {
        value: { kind: "constant", seconds: 0.5 },
        provenance: {
          kind: "user-entered",
          source: "Round 4J UI acceptance",
          notes: "Builder-style QPU modeled wall-time edit."
        }
      }
    }
  };

  const baseCompiled = compile(baseline);
  const editedCompiled = compile(edited);
  const base = simulateWorkflow(baseCompiled.workflowSpec);
  const changed = simulateWorkflow(editedCompiled.workflowSpec);

  assert.equal(base.metrics.makespanS, 1001.5);
  assert.equal(changed.metrics.makespanS, 501.5);

  const baselineRun = createRunRecord({
    id: "d-baseline",
    design: baseline.design,
    runConfiguration: baseline.runConfiguration,
    systemProfile: baseline.systemProfile,
    compiledWorkflowSpec: baseCompiled.workflowSpec,
    compilationManifest: baseCompiled.manifest,
    simulationResult: base
  });
  const editedRun = createRunRecord({
    id: "d-edited",
    design: edited.design,
    runConfiguration: edited.runConfiguration,
    systemProfile: edited.systemProfile,
    compiledWorkflowSpec: editedCompiled.workflowSpec,
    compilationManifest: editedCompiled.manifest,
    simulationResult: changed
  });

  assert.equal(baselineRun.design.id, editedRun.design.id);
  assert.equal(
    editedRun.systemProfile.taskServiceTimes.quantum.provenance.kind,
    "user-entered"
  );
  assert.equal(
    baselineRun.simulationResult.metrics.makespanS -
      editedRun.simulationResult.metrics.makespanS,
    500
  );
});
