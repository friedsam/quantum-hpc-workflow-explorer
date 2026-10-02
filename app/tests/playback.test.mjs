import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSemanticGroups,
  buildVisualKeyframes,
  compressSemanticGroups,
  createPlaybackController,
  keyframeIndexAt,
  totalPresentationDurationMs,
} from "../src/playback/trace-playback.mjs";
import {makeScenarioDLikeResult} from "./fixtures/scenario-d-like.mjs";
import {
  engineSourceCommit,
  engineV1MinimalResult,
} from "./fixtures/engine-v1-minimal-result.mjs";

function coveredSeqs(keyframes) {
  const seqs = [];
  for (const frame of keyframes) {
    for (let seq = frame.sourceEventSeqRange[0]; seq <= frame.sourceEventSeqRange[1]; seq += 1) seqs.push(seq);
  }
  return seqs;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("same SimulationResult produces byte-equivalent keyframes", () => {
  const result = makeScenarioDLikeResult({cycles: 1000});
  const a = buildVisualKeyframes(result);
  const b = buildVisualKeyframes(result);
  assert.deepEqual(a, b);
});

test("1000-cycle repetitive regime compresses without losing source trace coverage", () => {
  const result = makeScenarioDLikeResult({cycles: 1000});
  const groups = buildSemanticGroups(result);
  const keyframes = buildVisualKeyframes(result);

  assert.equal(groups.length, 1005);
  assert.ok(keyframes.length < 20, `expected <20 keyframes, got ${keyframes.length}`);
  assert.ok(keyframes.some((frame) => frame.kind === "compressed" && frame.repeatCount > 900));

  const expected = result.events.map((event) => event.seq);
  assert.deepEqual(coveredSeqs(keyframes), expected);
});

test("compressed segment is presentation-only and metrics are untouched", () => {
  const result = makeScenarioDLikeResult({cycles: 250});
  const metricsBefore = clone(result.metrics);
  const frames = buildVisualKeyframes(result);

  assert.deepEqual(result.metrics, metricsBefore);
  assert.equal(Object.hasOwn(frames[0], "metrics"), false);
  assert.ok(frames.some((frame) => frame.kind === "compressed"));
});

test("meaningful states have deterministic non-zero dwell and monotonic presentation times", () => {
  const frames = buildVisualKeyframes(makeScenarioDLikeResult({cycles: 1000}));
  for (let i = 0; i < frames.length; i += 1) {
    assert.ok(frames[i].dwellMs >= 500);
    if (i > 0) {
      assert.equal(
        frames[i].presentationTimeMs,
        frames[i - 1].presentationTimeMs + frames[i - 1].dwellMs,
      );
    }
  }
  assert.ok(frames.at(-1).dwellMs >= 1100);
});

test("step mode exposes exact source event/keyframe relationship", () => {
  const frames = buildVisualKeyframes(makeScenarioDLikeResult({cycles: 1000}));
  const controller = createPlaybackController(frames);

  const first = controller.getState();
  const second = controller.stepForward();
  const third = controller.stepForward();

  assert.equal(first.index, 0);
  assert.deepEqual(second.keyframe.sourceEventSeqRange, frames[1].sourceEventSeqRange);
  assert.deepEqual(third.keyframe.sourceEventSeqRange, frames[2].sourceEventSeqRange);
  assert.equal(third.playing, false);
});

test("wall-clock playback is refresh-rate independent", () => {
  const frames = buildVisualKeyframes(makeScenarioDLikeResult({cycles: 1000}));
  const controllerA = createPlaybackController(frames);
  const controllerB = createPlaybackController(frames);

  controllerA.play(1000);
  controllerB.play(1000);

  // One controller gets dense ticks; the other receives only the final tick.
  for (let t = 1016; t <= 4200; t += 16) controllerA.tick(t);
  const dense = controllerA.tick(5000);
  const sparse = controllerB.tick(5000);

  assert.equal(dense.index, sparse.index);
  assert.equal(dense.presentationTimeMs, sparse.presentationTimeMs);
});

test("keyframe lookup respects dwell boundaries", () => {
  const frames = buildVisualKeyframes(makeScenarioDLikeResult({cycles: 100}));
  assert.equal(keyframeIndexAt(frames, 0), 0);
  assert.equal(keyframeIndexAt(frames, frames[1].presentationTimeMs - 1), 0);
  assert.equal(keyframeIndexAt(frames, frames[1].presentationTimeMs), 1);
  assert.ok(totalPresentationDurationMs(frames) > frames.at(-1).presentationTimeMs);
});

test("short non-repetitive traces are not compressed", () => {
  const result = makeScenarioDLikeResult({cycles: 12});
  const groups = buildSemanticGroups(result);
  const segments = compressSemanticGroups(groups, {repeatThreshold: 20});
  assert.equal(segments.length, groups.length);
  assert.equal(segments.some((segment) => segment.kind === "compressed"), false);
});

test("playback rejects a trace whose source ordering moves backward", () => {
  const result = makeScenarioDLikeResult({cycles: 12});
  const broken = {...result, events: [...result.events]};
  [broken.events[3], broken.events[4]] = [broken.events[4], broken.events[3]];
  assert.throws(() => buildSemanticGroups(broken), /strictly increasing|moves backward/);
});


test("frozen v1 engine trace snapshots respect half-open interval semantics", () => {
  assert.match(engineSourceCommit, /^[0-9a-f]{40}$/);
  const frames = buildVisualKeyframes(engineV1MinimalResult);
  assert.equal(frames.length, 8);

  const qpuHandoff = frames.find((frame) => frame.snapshot.simTimeS === 5.5);
  assert.ok(qpuHandoff);
  assert.deepEqual(qpuHandoff.snapshot.resourceUnitsByPoolAndState.qpu, {active: 1});
  assert.deepEqual(qpuHandoff.snapshot.taskStateCounts, {running: 1});
  assert.equal(qpuHandoff.snapshot.queueDepthByPool.qpu, 0);

  const terminal = frames.at(-1);
  assert.equal(terminal.snapshot.simTimeS, 9.25);
  assert.deepEqual(terminal.snapshot.resourceUnitsByPoolAndState, {});
  assert.deepEqual(terminal.snapshot.taskStateCounts, {});
  assert.deepEqual(terminal.snapshot.eventTypes, ["task_completed"]);
});

test("zero-width intervals are empty under frozen v1 half-open semantics", () => {
  const result = clone(engineV1MinimalResult);
  result.resourceIntervals.push({
    resourcePoolId: "cpu",
    startS: 9.25,
    endS: 9.25,
    state: "active",
    units: 99,
    taskId: "ghost-resource",
  });
  result.taskIntervals.push({
    taskId: "ghost-task",
    startS: 9.25,
    endS: 9.25,
    state: "running",
  });

  const terminal = buildVisualKeyframes(result).at(-1);
  assert.deepEqual(terminal.snapshot.resourceUnitsByPoolAndState, {});
  assert.deepEqual(terminal.snapshot.taskStateCounts, {});
});

test("multi-signature periodic cycles compress deterministically", () => {
  const signatures = ["cpu-start", "cpu-complete", "qpu-start", "qpu-complete"];
  const groups = Array.from({length: 24}, (_, index) => {
    const signature = signatures[index % signatures.length];
    return {
      index,
      simTimeS: index,
      sourceEventSeqRange: [index, index],
      signature,
      label: signature,
      events: [{
        seq: index,
        simTimeS: index,
        type: signature,
        resourcePoolId: signature.startsWith("cpu") ? "cpu" : "qpu",
      }],
    };
  });

  const segments = compressSemanticGroups(groups);
  assert.equal(segments.length, 9);
  const compressed = segments.find((segment) => segment.kind === "compressed");
  assert.ok(compressed);
  assert.equal(compressed.patternLength, 4);
  assert.equal(compressed.repeatCount, 4);
  assert.deepEqual(compressed.groupRange, [4, 19]);
  assert.deepEqual(compressed.sourceEventSeqRange, [4, 19]);
});

test("fewer than four pattern repeats are not compressed", () => {
  const signatures = ["a", "b", "c"];
  const groups = Array.from({length: 9}, (_, index) => ({
    index,
    simTimeS: index,
    sourceEventSeqRange: [index, index],
    signature: signatures[index % signatures.length],
    label: signatures[index % signatures.length],
    events: [{
      seq: index,
      simTimeS: index,
      type: signatures[index % signatures.length],
    }],
  }));
  const segments = compressSemanticGroups(groups);
  assert.equal(segments.length, groups.length);
  assert.equal(segments.some((segment) => segment.kind === "compressed"), false);
});
