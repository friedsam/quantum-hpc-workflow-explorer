import { performance } from "node:perf_hooks";
import { simulateWorkflow } from "../index.mjs";
import { compileWorkflowDesignDetailed } from "../design/compile.mjs";
import { deriveActorStateCountsAt } from "../design/actor-state.mjs";
import {
  qampScenarioA1000Design,
  qampScenarioA1000RunConfiguration,
  qampScenarioA1000Profile,
} from "../examples/qamp-a-1000-demo.mjs";

const times = [0.5, 1.5, 4, 7];

function measure(label, iterations, fn) {
  const samples = [];
  let value;
  for (let i = 0; i < 5; i += 1) fn();
  const memoryBefore = process.memoryUsage();
  for (let i = 0; i < iterations; i += 1) {
    const start = performance.now();
    value = fn();
    samples.push(performance.now() - start);
  }
  const memoryAfter = process.memoryUsage();
  samples.sort((a, b) => a - b);
  const mean =
    samples.reduce((sum, sample) => sum + sample, 0) /
    samples.length;
  return {
    label,
    iterations,
    meanMs: mean,
    medianMs: samples[Math.floor(samples.length / 2)],
    p95Ms: samples[Math.floor(samples.length * 0.95)],
    heapUsedDeltaBytes:
      memoryAfter.heapUsed - memoryBefore.heapUsed,
    rssDeltaBytes: memoryAfter.rss - memoryBefore.rss,
    value,
  };
}

const compile = measure("compile", 100, () =>
  compileWorkflowDesignDetailed(
    qampScenarioA1000Design,
    qampScenarioA1000RunConfiguration,
    qampScenarioA1000Profile
  )
);

const simulate = measure("simulate", 100, () =>
  simulateWorkflow(compile.value.workflowSpec)
);

const actors = measure("four actor snapshots", 50, () =>
  times.map((simTimeS) =>
    deriveActorStateCountsAt(
      compile.value.manifest,
      simulate.value,
      "ranks",
      simTimeS
    )
  )
);

console.log(
  JSON.stringify(
    {
      nodeVersion: process.version,
      actorCount: 1000,
      logicalTaskCount: qampScenarioA1000Design.tasks.length,
      compiledTaskCount: compile.value.workflowSpec.tasks.length,
      compile: {
        iterations: compile.iterations,
        meanMs: compile.meanMs,
        medianMs: compile.medianMs,
        p95Ms: compile.p95Ms,
        heapUsedDeltaBytes: compile.heapUsedDeltaBytes,
        rssDeltaBytes: compile.rssDeltaBytes,
      },
      simulate: {
        iterations: simulate.iterations,
        meanMs: simulate.meanMs,
        medianMs: simulate.medianMs,
        p95Ms: simulate.p95Ms,
        heapUsedDeltaBytes: simulate.heapUsedDeltaBytes,
        rssDeltaBytes: simulate.rssDeltaBytes,
      },
      actorSnapshotBatch: {
        iterations: actors.iterations,
        snapshotsPerBatch: times.length,
        meanMs: actors.meanMs,
        medianMs: actors.medianMs,
        p95Ms: actors.p95Ms,
        heapUsedDeltaBytes: actors.heapUsedDeltaBytes,
        rssDeltaBytes: actors.rssDeltaBytes,
      },
      snapshots: actors.value,
      memoryNote:
        "Memory deltas are process snapshots across repeated operations, not allocator-independent peak memory.",
    },
    null,
    2
  )
);
