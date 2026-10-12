import { performance } from "node:perf_hooks";

import { simulateWorkflow } from "../index.mjs";
import {
  createActorStateProjector,
} from "../design/actor-state.mjs";
import {
  deriveActorSummaryAtReference,
} from "../tests/helpers/actor-state-reference.mjs";
import {
  qampScenarioB200StressCompilation,
} from "../examples/qamp-b-200-stress.mjs";

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

function memorySnapshot() {
  const memory = process.memoryUsage();
  return {
    rssBytes: memory.rss,
    heapUsedBytes: memory.heapUsed,
    heapTotalBytes: memory.heapTotal,
  };
}

function memoryDelta(before, after) {
  return Object.fromEntries(
    Object.keys(after).map((key) => [
      key,
      after[key] - before[key],
    ])
  );
}

function measureRepeated(iterations, fn) {
  const samples = [];
  let value;

  for (let index = 0; index < iterations; index += 1) {
    const start = performance.now();
    value = fn(index);
    samples.push(performance.now() - start);
  }

  return {
    timing: stats(samples),
    value,
  };
}

function playbackSignatureFromDetails(
  projector,
  actorCount,
  simTimeS
) {
  const counts = {
    working: 0,
    blocked: 0,
    idle: 0,
  };
  const reasonCounts = {};

  for (
    let actorOrdinal = 1;
    actorOrdinal <= actorCount;
    actorOrdinal += 1
  ) {
    const detail = projector.detailAt(
      "ranks",
      actorOrdinal,
      simTimeS
    );
    counts[detail.state] += 1;

    if (detail.state === "blocked") {
      for (const reason of detail.blockedReasons) {
        reasonCounts[reason] =
          (reasonCounts[reason] ?? 0) + 1;
      }
    }
  }

  const reasons = Object.entries(reasonCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([reason, count]) => `${reason}=${count}`)
    .join(",");

  return [
    "ranks",
    `w=${counts.working}`,
    `b=${counts.blocked}`,
    `i=${counts.idle}`,
    `r=${reasons}`,
  ].join("|");
}

function playbackSignatureFromSummary(summary) {
  const reasons = Object.entries(
    summary.blockedReasonCounts
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([reason, count]) => `${reason}=${count}`)
    .join(",");

  return [
    summary.actorGroupId,
    `w=${summary.working}`,
    `b=${summary.blocked}`,
    `i=${summary.idle}`,
    `r=${reasons}`,
  ].join("|");
}

function cursorTimes(projector) {
  const transitions = projector.transitionTimes("ranks");
  const times = [];

  for (
    let index = 0;
    index < transitions.length;
    index += 1
  ) {
    const current = transitions[index];
    times.push(current);

    const next = transitions[index + 1];
    if (next !== undefined && next > current) {
      times.push(current + (next - current) / 2);
    }
  }

  return [...new Set(times)].sort((a, b) => a - b);
}

const { manifest, workflowSpec } =
  qampScenarioB200StressCompilation;
const simulationResult = simulateWorkflow(workflowSpec);

for (let index = 0; index < 3; index += 1) {
  createActorStateProjector(manifest, simulationResult);
}

if (global.gc) global.gc();
const memoryBeforeProjector = memorySnapshot();

const precompute = measureRepeated(
  12,
  () =>
    createActorStateProjector(
      manifest,
      simulationResult
    )
);

const projector = precompute.value;

if (global.gc) global.gc();
const memoryAfterProjector = memorySnapshot();

const times = cursorTimes(projector);
const actorCount = manifest.actorGroups.ranks.count;

const countQuery = measureRepeated(
  2000,
  (index) =>
    projector.countsAt(
      "ranks",
      times[index % times.length]
    )
);

const detailQuery = measureRepeated(
  20000,
  (index) =>
    projector.detailAt(
      "ranks",
      (index % actorCount) + 1,
      times[index % times.length]
    )
);

const detailSweepSamples = [];
let detailSweepSignature = "";
const detailSweepStart = performance.now();

for (const simTimeS of times) {
  const start = performance.now();
  detailSweepSignature +=
    playbackSignatureFromDetails(
      projector,
      actorCount,
      simTimeS
    );
  detailSweepSamples.push(performance.now() - start);
}

const detailSweepTotalMs =
  performance.now() - detailSweepStart;

const summarySweepSamples = [];
let summarySweepSignature = "";
const summarySweepStart = performance.now();

for (const simTimeS of times) {
  const start = performance.now();
  summarySweepSignature +=
    playbackSignatureFromSummary(
      projector.summaryAt(
        "ranks",
        simTimeS
      )
    );
  summarySweepSamples.push(performance.now() - start);
}

const summarySweepTotalMs =
  performance.now() - summarySweepStart;

if (detailSweepSignature !== summarySweepSignature) {
  throw new Error(
    "detail-loop and indexed-summary playback signatures diverged"
  );
}

const referenceSnapshot = measureRepeated(
  5,
  () =>
    deriveActorSummaryAtReference(
      manifest,
      simulationResult,
      "ranks",
      100.5
    )
);

if (global.gc) global.gc();
const memoryAfterSweeps = memorySnapshot();

console.log(
  JSON.stringify(
    {
      nodeVersion: process.version,
      actorCount,
      compiledTaskCount: workflowSpec.tasks.length,
      compiledWaitCount:
        Object.keys(manifest.actorWaits).length,
      makespanS: simulationResult.metrics.makespanS,
      projectorStats: projector.stats,
      cursorCount: times.length,
      precompute: precompute.timing,
      countQuery: countQuery.timing,
      detailQuery: detailQuery.timing,
      playbackDetailSignatureSweep: {
        totalMs: detailSweepTotalMs,
        perCursor: stats(detailSweepSamples),
      },
      indexedSummarySignatureSweep: {
        totalMs: summarySweepTotalMs,
        perCursor: stats(summarySweepSamples),
      },
      referenceSummarySingleSnapshot: {
        simTimeS: 100.5,
        timing: referenceSnapshot.timing,
      },
      memory: {
        beforeProjector: memoryBeforeProjector,
        afterProjector: memoryAfterProjector,
        retainedProjectorDelta: memoryDelta(
          memoryBeforeProjector,
          memoryAfterProjector
        ),
        afterSweeps: memoryAfterSweeps,
        retainedSweepDelta: memoryDelta(
          memoryAfterProjector,
          memoryAfterSweeps
        ),
        note:
          "With --expose-gc, GC is requested before retained snapshots. RSS remains allocator-dependent; values are retained-process evidence, not peak-memory guarantees.",
      },
    },
    null,
    2
  )
);
