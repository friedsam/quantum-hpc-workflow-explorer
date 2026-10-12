import { performance } from "node:perf_hooks";

import { simulateWorkflow } from "../index.mjs";
import {
  compileWorkflowDesignDetailed,
} from "../design/compile.mjs";
import {
  createActorStateProjector,
} from "../design/actor-state.mjs";
import {
  qampScenarioD1000StressDesign,
  qampScenarioD1000StressRunConfiguration,
  qampScenarioD1000StressProfile,
} from "../tests/fixtures/qamp-d-1000-stress.mjs";

function stats(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const mean =
    sorted.reduce((sum, value) => sum + value, 0) /
    sorted.length;
  const pick = (p) =>
    sorted[
      Math.min(
        sorted.length - 1,
        Math.floor((sorted.length - 1) * p)
      )
    ];

  return {
    samples: sorted.length,
    meanMs: mean,
    medianMs: pick(0.5),
    p95Ms: pick(0.95),
    minMs: sorted[0],
    maxMs: sorted[sorted.length - 1],
  };
}

function measure(iterations, fn) {
  const samples = [];
  let value;

  for (let index = 0; index < iterations; index += 1) {
    const start = performance.now();
    value = fn();
    samples.push(performance.now() - start);
  }

  return {
    timing: stats(samples),
    value,
  };
}

function memorySnapshot() {
  const memory = process.memoryUsage();
  return {
    rssBytes: memory.rss,
    heapUsedBytes: memory.heapUsed,
    heapTotalBytes: memory.heapTotal,
  };
}

function delta(before, after) {
  return Object.fromEntries(
    Object.keys(after).map((key) => [
      key,
      after[key] - before[key],
    ])
  );
}

const compile = measure(
  3,
  () =>
    compileWorkflowDesignDetailed(
      qampScenarioD1000StressDesign,
      qampScenarioD1000StressRunConfiguration,
      qampScenarioD1000StressProfile
    )
);

const simulate = measure(
  3,
  () =>
    simulateWorkflow(
      compile.value.workflowSpec
    )
);

if (global.gc) global.gc();
const memoryBeforeProjector = memorySnapshot();

const projectorBuild = measure(
  5,
  () =>
    createActorStateProjector(
      compile.value.manifest,
      simulate.value
    )
);

const projector = projectorBuild.value;

if (global.gc) global.gc();
const memoryAfterProjector = memorySnapshot();

const transitionTimes =
  projector.transitionTimes("ranks");

const counts = measure(
  5000,
  () =>
    projector.countsAt(
      "ranks",
      2.25
    )
);

const detail = measure(
  20000,
  () =>
    projector.detailAt(
      "ranks",
      51,
      2.25
    )
);

const sweepSamples = [];
const sweepStart = performance.now();
let signature = "";

for (const simTimeS of transitionTimes) {
  const start = performance.now();
  const summary = projector.summaryAt(
    "ranks",
    simTimeS
  );
  signature += [
    simTimeS,
    summary.working,
    summary.blocked,
    summary.idle,
  ].join(":");
  sweepSamples.push(performance.now() - start);
}

const sweepTotalMs =
  performance.now() - sweepStart;

if (global.gc) global.gc();
const memoryAfterSweep = memorySnapshot();

console.log(
  JSON.stringify(
    {
      nodeVersion: process.version,
      actorCount: 1000,
      compiledTaskCount:
        compile.value.workflowSpec.tasks.length,
      compiledWaitCount:
        Object.keys(
          compile.value.manifest.actorWaits
        ).length,
      makespanS: simulate.value.metrics.makespanS,
      projectorStats: projector.stats,
      transitionCount: transitionTimes.length,
      compile: compile.timing,
      simulate: simulate.timing,
      projectorBuild: projectorBuild.timing,
      countQuery: counts.timing,
      detailQuery: detail.timing,
      fullSummaryTransitionSweep: {
        totalMs: sweepTotalMs,
        perCursor: stats(sweepSamples),
        signatureLength: signature.length,
      },
      memory: {
        beforeProjector: memoryBeforeProjector,
        afterProjector: memoryAfterProjector,
        retainedProjectorDelta: delta(
          memoryBeforeProjector,
          memoryAfterProjector
        ),
        afterSweep: memoryAfterSweep,
        retainedSweepDelta: delta(
          memoryAfterProjector,
          memoryAfterSweep
        ),
        note:
          "With --expose-gc, GC is requested before retained snapshots. RSS remains allocator-dependent; these are retained-process measurements, not peak-memory guarantees.",
      },
    },
    null,
    2
  )
);
