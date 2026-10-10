import test from "node:test";
import assert from "node:assert/strict";

import {
  actorCompositionSignatureAt,
  attachActorStateToSystemSnapshot,
  buildActorAwareVisualKeyframes,
  deriveActorGroupSummariesAt,
} from "../../web/assets/playback/actor-aware-view.mjs";
import {
  qampBActorManifest,
  qampBActorSimulationResult,
  qampBExpectedActorStateByTime,
  round4ActorProducer,
} from "./fixtures/qamp-b-actor-result.mjs";
import {
  qampDGenericSnapshotAt1,
} from "./fixtures/qamp-d-generic-snapshot.mjs";

function pinnedActorDeriver(
  _manifest,
  _result,
  actorGroupId,
  actorOrdinal,
  simTimeS
) {
  assert.equal(actorGroupId, "ranks");
  const details = qampBExpectedActorStateByTime[String(simTimeS)];
  assert.ok(details, `no pinned actor detail at t=${simTimeS}`);
  const detail = details.find(
    (candidate) => candidate.actorOrdinal === actorOrdinal
  );
  assert.ok(detail, `missing actor ordinal ${actorOrdinal}`);
  return detail;
}

function groupAt(time) {
  const summaries = deriveActorGroupSummariesAt(
    qampBActorManifest,
    qampBActorSimulationResult,
    time,
    pinnedActorDeriver
  );
  assert.equal(summaries.length, 1);
  return summaries[0];
}

test("Round 4 Scenario B actor counts follow the accepted four-stage sequence", () => {
  assert.equal(round4ActorProducer.head.length, 40);

  assert.deepEqual(
    {
      working: groupAt(0).working,
      blocked: groupAt(0).blocked,
      idle: groupAt(0).idle,
    },
    { working: 2, blocked: 0, idle: 2 }
  );

  assert.deepEqual(
    {
      working: groupAt(1).working,
      blocked: groupAt(1).blocked,
      idle: groupAt(1).idle,
    },
    { working: 0, blocked: 2, idle: 2 }
  );

  assert.deepEqual(
    {
      working: groupAt(4).working,
      blocked: groupAt(4).blocked,
      idle: groupAt(4).idle,
    },
    { working: 0, blocked: 4, idle: 0 }
  );

  assert.deepEqual(
    {
      working: groupAt(7).working,
      blocked: groupAt(7).blocked,
      idle: groupAt(7).idle,
    },
    { working: 4, blocked: 0, idle: 0 }
  );
});

test("blocked reasons are preserved as overlapping actor counts", () => {
  assert.deepEqual(groupAt(1).blockedReasonCounts, {
    "quantum-result": 2,
  });

  assert.deepEqual(groupAt(4).blockedReasonCounts, {
    "global-synchronization": 4,
    "quantum-result": 1,
  });

  assert.equal(groupAt(4).blocked, 4);
  assert.equal(
    Object.values(groupAt(4).blockedReasonCounts).reduce(
      (sum, count) => sum + count,
      0
    ),
    5,
    "reason counts may exceed blocked actors because one actor can have multiple reasons"
  );
});

test("Scenario B actor-aware playback stays aggregate and follows semantic event boundaries", () => {
  const frames = buildActorAwareVisualKeyframes(
    qampBActorSimulationResult,
    {
      manifest: qampBActorManifest,
      deriveActorStateDetailAt: pinnedActorDeriver,
    }
  );

  assert.deepEqual(
    frames.map((frame) => frame.snapshot.simTimeS),
    [0, 1, 4, 7, 8]
  );
  assert.equal(frames.length, 5);
  assert.ok(frames.length < qampBActorSimulationResult.events.length);

  assert.deepEqual(
    frames.map((frame) => {
      const group = frame.actors.groups[0];
      return [group.working, group.blocked, group.idle];
    }),
    [
      [2, 0, 2],
      [0, 2, 2],
      [0, 4, 0],
      [4, 0, 0],
      [0, 0, 4],
    ]
  );

  assert.deepEqual(
    frames[2].actors.groups[0].blockedReasonCounts,
    {
      "global-synchronization": 4,
      "quantum-result": 1,
    }
  );

  assert.equal(
    Object.hasOwn(frames[0].actors.groups[0], "actors"),
    false,
    "playback exposes aggregate group state, not one frame/payload per actor"
  );
});

test("actor composition and reason changes augment compression signatures", () => {
  const before = actorCompositionSignatureAt(
    qampBActorManifest,
    qampBActorSimulationResult,
    1,
    pinnedActorDeriver
  );
  const after = actorCompositionSignatureAt(
    qampBActorManifest,
    qampBActorSimulationResult,
    4,
    pinnedActorDeriver
  );

  assert.notEqual(before, after);
  assert.match(before, /w=0\|b=2\|i=2/);
  assert.match(after, /w=0\|b=4\|i=0/);
  assert.match(after, /global-synchronization=4/);
});

test("generic workflows retain resource/causal fallback without invented blocked actors", () => {
  const augmented = attachActorStateToSystemSnapshot(
    qampDGenericSnapshotAt1,
    { actorGroups: {} },
    {},
    undefined
  );

  assert.equal(augmented.actors.mode, "generic");
  assert.deepEqual(augmented.actors.groups, []);

  assert.equal(
    augmented.resources.qpuByPool.qpu.queueDepth,
    qampDGenericSnapshotAt1.resources.qpuByPool.qpu.queueDepth
  );
  assert.deepEqual(
    augmented.causal.policyHeldQuantumTasks,
    qampDGenericSnapshotAt1.causal.policyHeldQuantumTasks
  );
  assert.ok(augmented.causal.policyHeldQuantumTasks.length > 0);
  assert.equal(
    Object.hasOwn(augmented.actors, "blocked"),
    false,
    "generic policy-held work is not reinterpreted as blocked ranks"
  );
});

test("generic actor-less playback requires no actor derivation provider", () => {
  const frames = buildActorAwareVisualKeyframes(
    qampBActorSimulationResult,
    { manifest: { actorGroups: {} } }
  );
  assert.ok(frames.length > 0);
  assert.ok(
    frames.every(
      (frame) =>
        frame.actors.mode === "generic" &&
        frame.actors.groups.length === 0
    )
  );
});


test("reason-only actor changes survive repetitive-event compression", () => {
  const result = {
    workflowId: "reason-change-stress",
    events: Array.from({ length: 40 }, (_, index) => ({
      seq: index,
      simTimeS: index,
      type: "task_completed",
      taskId: "same-pattern-" + index,
      resourcePoolId: "qpu",
    })),
    resourceIntervals: [],
    taskIntervals: [],
    queueSeries: [],
    metrics: { makespanS: 39 },
    assumptions: [],
  };

  const manifest = {
    actorGroups: {
      ranks: {
        actorGroupId: "ranks",
        label: "Ranks",
        count: 1,
      },
    },
  };

  const deriver = (
    _manifest,
    _result,
    actorGroupId,
    actorOrdinal,
    simTimeS
  ) => ({
    actorGroupId,
    actorOrdinal,
    simTimeS,
    state: "blocked",
    blockedReasons: [
      simTimeS < 20 ? "quantum-result" : "global-synchronization",
    ],
  });

  const frames = buildActorAwareVisualKeyframes(result, {
    manifest,
    deriveActorStateDetailAt: deriver,
  });

  assert.ok(frames.length < result.events.length);
  const transition = frames.find(
    (frame) => frame.snapshot.simTimeS === 20
  );
  assert.ok(transition, "reason transition at t=20 must remain explicit");
  assert.deepEqual(
    transition.actors.groups[0].blockedReasonCounts,
    { "global-synchronization": 1 }
  );

  const before = frames
    .filter((frame) => frame.snapshot.simTimeS < 20)
    .at(-1);
  assert.ok(before);
  assert.deepEqual(
    before.actors.groups[0].blockedReasonCounts,
    { "quantum-result": 1 }
  );
});
