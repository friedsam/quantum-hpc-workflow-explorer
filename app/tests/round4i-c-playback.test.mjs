import test from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

import {
  deriveActorGroupSummaryAt,
  deriveActorStateDetailAt
} from "../src/design/actor-state.mjs";
import { deriveSystemStateSnapshot } from "../src/causal/systemState.mjs";
import { simulateWorkflow } from "../src/engine/runtime.mjs";
import {
  attachActorStateToSystemSnapshot,
  buildActorAwareVisualKeyframes
} from "../src/playback/actor-aware-view.mjs";
import {
  qampScenarioC1000Compilation,
  qampScenarioC1000WorkflowSpec
} from "../src/presets/qamp-c-1000-demo.mjs";

function percentile(samples, fraction) {
  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.floor((sorted.length - 1) * fraction)
  );
  return sorted[index];
}

test("Scenario C playback compresses raw events while preserving source-event ranges", () => {
  const result = simulateWorkflow(
    qampScenarioC1000WorkflowSpec
  );
  const frames = buildActorAwareVisualKeyframes(result, {
    manifest: qampScenarioC1000Compilation.manifest,
    deriveActorStateDetailAt,
    deriveActorGroupSummaryAt
  });

  assert.ok(frames.length > 0);
  assert.ok(frames.length < result.events.length);

  const eventSeqs = new Set(
    result.events.map((event) => event.seq)
  );

  for (const frame of frames) {
    const [startSeq, endSeq] = frame.sourceEventSeqRange;
    assert.ok(startSeq <= endSeq);
    assert.ok(eventSeqs.has(startSeq));
    assert.ok(eventSeqs.has(endSeq));
  }

  assert.ok(
    frames.some((frame) =>
      frame.actors.groups.some(
        (group) =>
          group.actorGroupId === "ranks" &&
          group.blocked > 0
      )
    )
  );
});

test("Round 4I C1000 records keyframe and cursor-sweep performance", () => {
  const compiled = qampScenarioC1000Compilation;
  const result = simulateWorkflow(
    qampScenarioC1000WorkflowSpec
  );
  const memoryBefore = process.memoryUsage();

  const playbackSamples = [];
  let frames;
  for (let index = 0; index < 5; index += 1) {
    const start = performance.now();
    frames = buildActorAwareVisualKeyframes(result, {
      manifest: compiled.manifest,
      deriveActorStateDetailAt,
      deriveActorGroupSummaryAt
    });
    playbackSamples.push(performance.now() - start);
  }

  const cursorTimes = Array.from(
    { length: 257 },
    (_, index) => index * 0.05
  );
  const cursorSamples = [];
  let lastSnapshot;

  for (const simTimeS of cursorTimes) {
    const start = performance.now();
    const generic = deriveSystemStateSnapshot(
      qampScenarioC1000WorkflowSpec,
      result,
      Math.min(simTimeS, result.metrics.makespanS)
    );
    lastSnapshot = attachActorStateToSystemSnapshot(
      generic,
      compiled.manifest,
      result,
      deriveActorStateDetailAt,
      deriveActorGroupSummaryAt
    );
    cursorSamples.push(performance.now() - start);
  }

  const memoryAfter = process.memoryUsage();
  const evidence = {
    keyframes: {
      count: frames.length,
      medianMs: Number(
        percentile(playbackSamples, 0.5).toFixed(3)
      ),
      maxMs: Number(
        Math.max(...playbackSamples).toFixed(3)
      )
    },
    cursorSweep: {
      count: cursorSamples.length,
      medianMs: Number(
        percentile(cursorSamples, 0.5).toFixed(3)
      ),
      p95Ms: Number(
        percentile(cursorSamples, 0.95).toFixed(3)
      ),
      maxMs: Number(
        Math.max(...cursorSamples).toFixed(3)
      ),
      totalMs: Number(
        cursorSamples
          .reduce((sum, value) => sum + value, 0)
          .toFixed(3)
      )
    },
    memory: {
      rssDeltaBytes:
        memoryAfter.rss - memoryBefore.rss,
      heapUsedDeltaBytes:
        memoryAfter.heapUsed - memoryBefore.heapUsed
    }
  };

  console.log(
    "ROUND4I_C1000_PERF " + JSON.stringify(evidence)
  );

  assert.ok(frames.length > 0);
  assert.equal(
    lastSnapshot.simTimeS,
    result.metrics.makespanS
  );
  assert.equal(
    lastSnapshot.actors.groups[0].idle,
    1000
  );
  assert.ok(
    Number.isFinite(evidence.cursorSweep.p95Ms)
  );
});
