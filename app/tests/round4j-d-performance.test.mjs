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
  qampScenarioD1000Compilation,
  qampScenarioD1000WorkflowSpec
} from "../src/presets/qamp-d-1000-demo.mjs";

function percentile(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[
    Math.min(
      sorted.length - 1,
      Math.floor((sorted.length - 1) * fraction)
    )
  ];
}

test("Round 4J D1000 records compressed playback and cursor performance", () => {
  const compiled = qampScenarioD1000Compilation;
  const result = simulateWorkflow(qampScenarioD1000WorkflowSpec);
  const memoryBefore = process.memoryUsage();

  const playbackSamples = [];
  let frames;
  for (let index = 0; index < 3; index += 1) {
    const start = performance.now();
    frames = buildActorAwareVisualKeyframes(result, {
      manifest: compiled.manifest,
      deriveActorStateDetailAt,
      deriveActorGroupSummaryAt
    });
    playbackSamples.push(performance.now() - start);
  }

  const cursorSamples = [];
  let lastSnapshot;
  for (let time = 0; time <= result.metrics.makespanS; time += 5) {
    const start = performance.now();
    const generic = deriveSystemStateSnapshot(
      qampScenarioD1000WorkflowSpec,
      result,
      Math.min(time, result.metrics.makespanS)
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

  const terminalGeneric = deriveSystemStateSnapshot(
    qampScenarioD1000WorkflowSpec,
    result,
    result.metrics.makespanS
  );
  lastSnapshot = attachActorStateToSystemSnapshot(
    terminalGeneric,
    compiled.manifest,
    result,
    deriveActorStateDetailAt,
    deriveActorGroupSummaryAt
  );

  const memoryAfter = process.memoryUsage();
  const evidence = {
    tasks: qampScenarioD1000WorkflowSpec.tasks.length,
    keyframes: {
      count: frames.length,
      medianMs: Number(
        percentile(playbackSamples, 0.5).toFixed(3)
      ),
      maxMs: Number(Math.max(...playbackSamples).toFixed(3))
    },
    cursorSweep: {
      count: cursorSamples.length,
      medianMs: Number(
        percentile(cursorSamples, 0.5).toFixed(3)
      ),
      p95Ms: Number(
        percentile(cursorSamples, 0.95).toFixed(3)
      ),
      maxMs: Number(Math.max(...cursorSamples).toFixed(3))
    },
    memory: {
      rssDeltaBytes: memoryAfter.rss - memoryBefore.rss,
      heapUsedDeltaBytes:
        memoryAfter.heapUsed - memoryBefore.heapUsed
    }
  };

  console.log("ROUND4J_D1000_PERF " + JSON.stringify(evidence));

  assert.equal(qampScenarioD1000WorkflowSpec.tasks.length, 3000);
  assert.equal(result.metrics.makespanS, 1001.5);
  assert.ok(frames.length < result.events.length);
  assert.ok(
    frames.some(
      (frame) =>
        frame.kind === "compressed" &&
        frame.repeatCount >= 4
    )
  );
  assert.ok(
    frames.every(
      (frame) =>
        frame.sourceEventSeqRange[0] <=
        frame.sourceEventSeqRange[1]
    )
  );
  assert.equal(lastSnapshot.actors.groups[0].idle, 1000);
  assert.equal(lastSnapshot.actors.groups[0].blocked, 0);
  assert.ok(Number.isFinite(evidence.cursorSweep.p95Ms));
});
