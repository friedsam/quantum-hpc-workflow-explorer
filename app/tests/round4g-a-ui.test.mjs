import test from "node:test";
import assert from "node:assert/strict";

import {
  compileWorkflowDesignDetailed,
  createRunRecord
} from "../src/design/compiler.mjs";
import {
  deriveActorStateCountsAt,
  deriveActorStateDetailAt
} from "../src/design/actor-state.mjs";
import { simulateWorkflow } from "../src/engine/runtime.mjs";
import {
  buildActorAwareVisualKeyframes
} from "../src/playback/actor-aware-view.mjs";
import {
  logicalPresetBundles
} from "../src/presets/logical-presets.mjs";
import {
  qampScenarioA1000Design,
  qampScenarioA1000RunConfiguration,
  qampScenarioA1000Profile
} from "../src/presets/qamp-a-1000-demo.mjs";

function compile(bundle) {
  return compileWorkflowDesignDetailed(
    bundle.design,
    bundle.runConfiguration,
    bundle.systemProfile
  );
}

test("public Scenario A is the accepted compact 1,000-actor demo", () => {
  const bundle = logicalPresetBundles.A;
  const { workflowSpec, manifest } = compile(bundle);
  assert.equal(bundle.design.id, "qamp-a-1000-demo-design");
  assert.equal(bundle.design.tasks.length, 4);
  assert.equal(workflowSpec.tasks.length, 4);
  assert.equal(bundle.runConfiguration.actorGroupCounts.ranks, 1000);
  assert.equal(
    bundle.runConfiguration.resources.find((resource) => resource.kind === "cpu").capacity,
    1000
  );
  assert.equal(
    bundle.runConfiguration.resources.find((resource) => resource.kind === "qpu").capacity,
    1
  );
  assert.equal(
    bundle.runConfiguration.policy.maxInFlightQuantumByPool,
    undefined
  );
  assert.deepEqual(
    manifest.tasks["classical-background"].actorAssignments[0].selection,
    { kind: "all-except", actorOrdinals: [1] }
  );
  assert.deepEqual(
    manifest.tasks.submit.actorAssignments[0].selection,
    { kind: "range", startActorOrdinal: 1, endActorOrdinal: 1 }
  );
});

test("public Scenario A re-simulates after a profile edit and remains comparable", () => {
  const baselineBundle = structuredClone(logicalPresetBundles.A);
  const baselineCompiled = compile(baselineBundle);
  const baselineResult = simulateWorkflow(baselineCompiled.workflowSpec);

  const editedBundle = structuredClone(baselineBundle);
  editedBundle.systemProfile = {
    ...editedBundle.systemProfile,
    id: "qamp-a-1000-demo-user-edit",
    taskServiceTimes: {
      ...editedBundle.systemProfile.taskServiceTimes,
      "classical-background": {
        value: { kind: "constant", seconds: 12 },
        provenance: {
          kind: "user-entered",
          source: "Round 4G UI acceptance",
          notes: "Builder-style modeled wall-time edit."
        }
      }
    }
  };

  const editedCompiled = compile(editedBundle);
  const editedResult = simulateWorkflow(editedCompiled.workflowSpec);

  assert.equal(baselineResult.metrics.makespanS, 10);
  assert.equal(editedResult.metrics.makespanS, 12);
  assert.equal(editedResult.metrics.queueWaitSecondsByPool.qpu, 0);
  assert.equal(editedResult.metrics.admissionWaitSecondsByPool.qpu, 0);

  const baselineRun = createRunRecord({
    id: "a-baseline",
    design: baselineBundle.design,
    runConfiguration: baselineBundle.runConfiguration,
    systemProfile: baselineBundle.systemProfile,
    compiledWorkflowSpec: baselineCompiled.workflowSpec,
    compilationManifest: baselineCompiled.manifest,
    simulationResult: baselineResult
  });
  const editedRun = createRunRecord({
    id: "a-edited",
    design: editedBundle.design,
    runConfiguration: editedBundle.runConfiguration,
    systemProfile: editedBundle.systemProfile,
    compiledWorkflowSpec: editedCompiled.workflowSpec,
    compilationManifest: editedCompiled.manifest,
    simulationResult: editedResult
  });

  assert.equal(baselineRun.design.id, editedRun.design.id);
  assert.equal(baselineRun.simulationResult.metrics.makespanS, 10);
  assert.equal(editedRun.simulationResult.metrics.makespanS, 12);
  assert.equal(
    editedRun.systemProfile.taskServiceTimes["classical-background"].provenance.kind,
    "user-entered"
  );
});

test("public Scenario A keeps synthetic provenance explicit", () => {
  assert.equal(qampScenarioA1000Design.id, "qamp-a-1000-demo-design");
  assert.equal(qampScenarioA1000RunConfiguration.actorGroupCounts.ranks, 1000);

  for (const entry of Object.values(qampScenarioA1000Profile.taskServiceTimes)) {
    assert.equal(entry.provenance.kind, "synthetic");
    assert.equal(
      entry.provenance.source,
      "Round 4F Scenario A 1000-rank demo"
    );
  }
  assert.ok(
    qampScenarioA1000Profile.assumptions.some((text) =>
      /synthetic and illustrative/i.test(text)
    )
  );
});

test("actor-aware playback preserves restored equilibrium without per-rank nodes", () => {
  const compiled = compile(logicalPresetBundles.A);
  const result = simulateWorkflow(compiled.workflowSpec);
  const frames = buildActorAwareVisualKeyframes(result, {
    manifest: compiled.manifest,
    deriveActorStateDetailAt
  });

  assert.equal(logicalPresetBundles.A.design.tasks.length, 4);
  assert.equal(compiled.workflowSpec.tasks.length, 4);

  for (const simTimeS of [4, 7]) {
    assert.deepEqual(
      deriveActorStateCountsAt(
        compiled.manifest,
        result,
        "ranks",
        simTimeS
      ),
      {
        actorGroupId: "ranks",
        simTimeS,
        working: 1000,
        blocked: 0,
        idle: 0
      }
    );
  }

  assert.ok(
    frames.some((frame) => {
      const ranks = frame.actors.groups.find(
        (group) => group.actorGroupId === "ranks"
      );
      return (
        frame.snapshot.simTimeS >= 3 &&
        frame.snapshot.simTimeS < 8 &&
        ranks?.working === 1000 &&
        ranks.blocked === 0 &&
        ranks.idle === 0
      );
    })
  );
});
