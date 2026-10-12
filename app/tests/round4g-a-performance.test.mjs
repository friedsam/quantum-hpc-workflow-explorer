import test from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

import {
  compileWorkflowDesignDetailed
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
  qampScenarioA1000Design,
  qampScenarioA1000RunConfiguration,
  qampScenarioA1000Profile
} from "../src/presets/qamp-a-1000-demo.mjs";

function timing(repetitions, fn) {
  const samples = [];
  let value;
  for (let index = 0; index < repetitions; index += 1) {
    const start = performance.now();
    value = fn();
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  return {
    minMs: samples[0],
    medianMs: samples[Math.floor(samples.length / 2)],
    maxMs: samples[samples.length - 1],
    value
  };
}

test("Round 4G Scenario A records compile/simulate/actor/playback performance evidence", () => {
  const memoryBefore = process.memoryUsage();

  const compile = timing(7, () =>
    compileWorkflowDesignDetailed(
      qampScenarioA1000Design,
      qampScenarioA1000RunConfiguration,
      qampScenarioA1000Profile
    )
  );
  const compiled = compile.value;

  const simulate = timing(7, () =>
    simulateWorkflow(compiled.workflowSpec)
  );
  const result = simulate.value;

  const actorSnapshots = timing(7, () =>
    [0.5, 1.5, 4, 7].map((simTimeS) =>
      deriveActorStateCountsAt(
        compiled.manifest,
        result,
        "ranks",
        simTimeS
      )
    )
  );

  const playback = timing(5, () =>
    buildActorAwareVisualKeyframes(result, {
      manifest: compiled.manifest,
      deriveActorStateDetailAt
    })
  );

  const memoryAfter = process.memoryUsage();
  const evidence = {
    compile: {
      minMs: Number(compile.minMs.toFixed(3)),
      medianMs: Number(compile.medianMs.toFixed(3)),
      maxMs: Number(compile.maxMs.toFixed(3))
    },
    simulate: {
      minMs: Number(simulate.minMs.toFixed(3)),
      medianMs: Number(simulate.medianMs.toFixed(3)),
      maxMs: Number(simulate.maxMs.toFixed(3))
    },
    actorSnapshots4: {
      minMs: Number(actorSnapshots.minMs.toFixed(3)),
      medianMs: Number(actorSnapshots.medianMs.toFixed(3)),
      maxMs: Number(actorSnapshots.maxMs.toFixed(3))
    },
    actorSnapshotMedianMs:
      Number((actorSnapshots.medianMs / 4).toFixed(3)),
    playbackKeyframes: {
      count: playback.value.length,
      minMs: Number(playback.minMs.toFixed(3)),
      medianMs: Number(playback.medianMs.toFixed(3)),
      maxMs: Number(playback.maxMs.toFixed(3))
    },
    memory: {
      rssBeforeBytes: memoryBefore.rss,
      rssAfterBytes: memoryAfter.rss,
      rssDeltaBytes: memoryAfter.rss - memoryBefore.rss,
      heapUsedBeforeBytes: memoryBefore.heapUsed,
      heapUsedAfterBytes: memoryAfter.heapUsed,
      heapUsedDeltaBytes:
        memoryAfter.heapUsed - memoryBefore.heapUsed
    }
  };

  console.log("ROUND4G_A1000_PERF " + JSON.stringify(evidence));

  assert.equal(compiled.workflowSpec.tasks.length, 4);
  assert.equal(result.metrics.makespanS, 10);
  assert.deepEqual(actorSnapshots.value[1], {
    actorGroupId: "ranks",
    simTimeS: 1.5,
    working: 999,
    blocked: 1,
    idle: 0
  });
  assert.ok(playback.value.length > 0);
  assert.ok(Number.isFinite(evidence.playbackKeyframes.maxMs));
});
