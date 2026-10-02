import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSemanticGroups,
  buildVisualKeyframes,
  compressSemanticGroups,
  createPlaybackController,
  keyframeIndexAt,
  totalPresentationDurationMs,
} from "../../web/assets/playback/trace-playback.mjs";
import {makeScenarioDLikeResult} from "./fixtures/scenario-d-like.mjs";

function coveredSeqs(keyframes) {
  const seqs = [];
  for (const frame of keyframes) {
    for (let seq = frame.sourceEventSeqRange[0]; seq <= frame.sourceEventSeqRange[1]; seq += 1) seqs.push(seq);
  }
  return seqs;
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
  const metricsBefore = structuredClone(result.metrics);
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
