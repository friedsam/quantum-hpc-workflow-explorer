import test from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

import {
  compileWorkflowDesignDetailed
} from "../src/design/compiler.mjs";
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
import { logicalPresetBundles } from "../src/presets/logical-presets.mjs";

function percentile(samples, fraction) {
  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.floor((sorted.length - 1) * fraction)
  );
  return sorted[index];
}

function repeat(repetitions, fn) {
  const samples = [];
  let value;
  for (let index = 0; index < repetitions; index += 1) {
    const start = performance.now();
    value = fn();
    samples.push(performance.now() - start);
  }
  return { samples, value };
}

test("Round 4H B200 records full keyframe and cursor-sweep performance", () => {
  const bundle = logicalPresetBundles.B;
  const memoryBefore = process.memoryUsage();

  const compile = repeat(5, () =>
    compileWorkflowDesignDetailed(
      bundle.design,
      bundle.runConfiguration,
      bundle.systemProfile
    )
  );
  const compiled = compile.value;

  const simulate = repeat(5, () =>
    simulateWorkflow(compiled.workflowSpec)
  );
  const result = simulate.value;

  const playback = repeat(3, () =>
    buildActorAwareVisualKeyframes(result, {
      manifest: compiled.manifest,
      deriveActorStateDetailAt,
      deriveActorGroupSummaryAt
    })
  );

  const cursorTimes = Array.from(
    { length: 405 },
    (_, index) => index * 0.5
  );
  const cursorSamples = [];
  let lastSnapshot;

  for (const simTimeS of cursorTimes) {
    const start = performance.now();
    const generic = deriveSystemStateSnapshot(
      compiled.workflowSpec,
      result,
      simTimeS
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
    compileMedianMs: Number(
      percentile(compile.samples, 0.5).toFixed(3)
    ),
    simulateMedianMs: Number(
      percentile(simulate.samples, 0.5).toFixed(3)
    ),
    playback: {
      keyframes: playback.value.length,
      medianMs: Number(
        percentile(playback.samples, 0.5).toFixed(3)
      ),
      maxMs: Number(Math.max(...playback.samples).toFixed(3))
    },
    cursorSweep: {
      count: cursorSamples.length,
      medianMs: Number(
        percentile(cursorSamples, 0.5).toFixed(3)
      ),
      p95Ms: Number(
        percentile(cursorSamples, 0.95).toFixed(3)
      ),
      maxMs: Number(Math.max(...cursorSamples).toFixed(3)),
      totalMs: Number(
        cursorSamples.reduce((sum, value) => sum + value, 0).toFixed(3)
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
    "ROUND4H_B200_PERF " + JSON.stringify(evidence)
  );

  assert.equal(compiled.workflowSpec.tasks.length, 401);
  assert.equal(result.metrics.makespanS, 202);
  assert.ok(playback.value.length > 0);
  assert.equal(lastSnapshot.simTimeS, 202);
  assert.equal(lastSnapshot.actors.groups[0].idle, 1000);
  assert.ok(Number.isFinite(evidence.cursorSweep.p95Ms));
});
