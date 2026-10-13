import test from "node:test";
import assert from "node:assert/strict";

import { compileWorkflowDesignDetailed } from "../src/design/compiler.mjs";
import { simulateWorkflow } from "../src/engine/runtime.mjs";
import { logicalPresetBundles } from "../src/presets/logical-presets.mjs";

function run(bundle) {
  const compiled = compileWorkflowDesignDetailed(
    bundle.design,
    bundle.runConfiguration,
    bundle.systemProfile
  );
  return simulateWorkflow(compiled.workflowSpec);
}

test("D admission bound redistributes queue versus policy wait", () => {
  const baseline = structuredClone(logicalPresetBundles.D);
  const tighter = structuredClone(logicalPresetBundles.D);

  tighter.runConfiguration = {
    ...tighter.runConfiguration,
    id: "qamp-d-limit20-run",
    policy: {
      ...tighter.runConfiguration.policy,
      maxInFlightQuantumByPool: { qpu: 20 }
    }
  };

  const base = run(baseline);
  const tight = run(tighter);

  assert.equal(base.metrics.makespanS, 1001.5);
  assert.equal(tight.metrics.makespanS, 1001.5);
  assert.equal(base.metrics.queueWaitSecondsByPool.qpu, 47775);
  assert.equal(base.metrics.admissionWaitSecondsByPool.qpu, 451725);
  assert.equal(tight.metrics.queueWaitSecondsByPool.qpu, 18810);
  assert.equal(tight.metrics.admissionWaitSecondsByPool.qpu, 480690);
  assert.ok(
    tight.metrics.queueWaitSecondsByPool.qpu <
      base.metrics.queueWaitSecondsByPool.qpu
  );
  assert.ok(
    tight.metrics.admissionWaitSecondsByPool.qpu >
      base.metrics.admissionWaitSecondsByPool.qpu
  );
});
