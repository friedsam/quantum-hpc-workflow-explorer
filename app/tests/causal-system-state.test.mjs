import test from "node:test";
import assert from "node:assert/strict";

import { simulateWorkflow } from "../src/engine/runtime.mjs";
import {
  scenarioA,
  scenarioB,
  scenarioC,
  scenarioD,
} from "../src/presets/qamp-scenarios.mjs";
import { deriveSystemStateSnapshot } from "../src/causal/systemState.mjs";

function withSemanticType(spec, taskId, semanticType) {
  const copy = structuredClone(spec);
  copy.tasks = copy.tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          metadata: {
            ...(task.metadata ?? {}),
            semanticType,
            actorGroupIds: ["test-actor-group"],
          },
        }
      : task
  );
  return copy;
}

test("Scenario A snapshot separates exact CPU release from QPU-gated continuation", () => {
  const result = simulateWorkflow(scenarioA);
  const snapshot = deriveSystemStateSnapshot(scenarioA, result, 2);

  assert.deepEqual(
    {
      active: snapshot.resources.classicalByPool.cpu.activeUnits,
      idle: snapshot.resources.classicalByPool.cpu.allocatedIdleUnits,
      released: snapshot.resources.classicalByPool.cpu.releasedUnits,
    },
    { active: 1, idle: 0, released: 1 }
  );
  assert.equal(snapshot.resources.qpuByPool.qpu.activeUnits, 1);
  assert.equal(snapshot.causal.policyHeldQuantumTasks.length, 0);

  const gate = snapshot.causal.dependencyGatedClassical.find(
    (candidate) => candidate.taskId === "local-consumer"
  );
  assert.ok(gate);
  assert.deepEqual(
    gate.unresolved.map((entry) => entry.directState),
    ["qpu-predecessor-incomplete"]
  );
  assert.equal("blockedUnits" in snapshot.resources.classicalByPool.cpu, false);
});

test("Scenario B snapshot keeps four allocated-idle CPU units separate from synchronization gate", () => {
  const spec = withSemanticType(
    scenarioB,
    "collective-continuation",
    "collective-synchronization"
  );
  const result = simulateWorkflow(spec);
  const snapshot = deriveSystemStateSnapshot(spec, result, 2);

  assert.deepEqual(
    {
      active: snapshot.resources.classicalByPool.cpu.activeUnits,
      idle: snapshot.resources.classicalByPool.cpu.allocatedIdleUnits,
      released: snapshot.resources.classicalByPool.cpu.releasedUnits,
    },
    { active: 0, idle: 4, released: 0 }
  );
  assert.equal(snapshot.resources.qpuByPool.qpu.activeUnits, 1);
  assert.equal(snapshot.resources.qpuByPool.qpu.queueDepth, 1);
  assert.equal(snapshot.causal.policyHeldQuantumTasks.length, 0);

  const gate = snapshot.causal.dependencyGatedClassical.find(
    (candidate) => candidate.taskId === "collective-continuation"
  );
  assert.ok(gate);
  assert.equal(gate.structuralJoin, true);
  assert.equal(gate.unresolved.length, 2);
  assert.equal(gate.explanation, "collective-synchronization");
  assert.equal(gate.evidence, "conditional");
  assert.deepEqual(gate.actorGroupIds, ["test-actor-group"]);
});

test("Scenario C snapshot exposes communication wall without inventing a classical blocked partition", () => {
  const result = simulateWorkflow(scenarioC);
  const snapshot = deriveSystemStateSnapshot(scenarioC, result, 2);

  assert.deepEqual(
    {
      active: snapshot.resources.classicalByPool.cpu.activeUnits,
      idle: snapshot.resources.classicalByPool.cpu.allocatedIdleUnits,
      released: snapshot.resources.classicalByPool.cpu.releasedUnits,
    },
    { active: 0, idle: 0, released: 3 }
  );
  assert.equal(snapshot.resources.qpuByPool.qpu.activeUnits, 0);
  assert.equal(snapshot.causal.activeCommunications.length, 3);
  assert.deepEqual(
    snapshot.causal.activeCommunications.map((entry) => entry.dependencyId),
    ["c-producer-1-q", "c-producer-2-q", "c-producer-3-q"]
  );
  assert.equal(snapshot.causal.dependencyGatedClassical.length, 0);
});

test("Scenario D snapshot distinguishes QPU resource queue from policy-held quantum tasks", () => {
  const result = simulateWorkflow(scenarioD);
  const snapshot = deriveSystemStateSnapshot(scenarioD, result, 1);

  assert.deepEqual(
    {
      active: snapshot.resources.classicalByPool.cpu.activeUnits,
      idle: snapshot.resources.classicalByPool.cpu.allocatedIdleUnits,
      released: snapshot.resources.classicalByPool.cpu.releasedUnits,
    },
    { active: 0, idle: 0, released: 6 }
  );
  assert.equal(snapshot.resources.qpuByPool.qpu.activeUnits, 1);
  assert.equal(snapshot.resources.qpuByPool.qpu.queueDepth, 1);
  assert.deepEqual(
    snapshot.resources.qpuByPool.qpu.queuedTaskIds,
    ["quantum-2"]
  );
  assert.deepEqual(
    snapshot.causal.policyHeldQuantumTasks.map((task) => task.taskId),
    ["quantum-3", "quantum-4", "quantum-5", "quantum-6"]
  );
  assert.ok(
    snapshot.causal.policyHeldQuantumTasks.every(
      (task) => task.qpuDemandUnits === 1
    )
  );
  assert.equal(
    snapshot.causal.dependencyGatedClassical.length,
    6
  );
  assert.equal(
    snapshot.dag.taskStateById["quantum-2"],
    "queued"
  );
  assert.equal(
    snapshot.dag.taskStateById["quantum-3"],
    "policy-held"
  );
  assert.equal("blockedUnits" in snapshot.resources.classicalByPool.cpu, false);
});
