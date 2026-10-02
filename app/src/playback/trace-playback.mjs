const DEFAULT_OPTIONS = Object.freeze({
  repeatThreshold: 8,
  detailGroupsAtRunStart: 2,
  detailGroupsAtRunEnd: 2,
  dwellMs: Object.freeze({
    transition: 1100,
    detail: 850,
    compressed: 500,
    terminal: 1200,
  }),
});

function assertFiniteNumber(value, label) {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite`);
}

function validatedEvents(events) {
  const copy = [...events];
  for (let i = 0; i < copy.length; i += 1) {
    const event = copy[i];
    if (!Number.isInteger(event.seq)) throw new TypeError(`event seq must be an integer: ${event.seq}`);
    assertFiniteNumber(event.simTimeS, `event ${event.seq} simTimeS`);
    if (i > 0 && event.seq <= copy[i - 1].seq) {
      throw new Error(`event seq must be strictly increasing at ${event.seq}`);
    }
    if (i > 0 && event.simTimeS < copy[i - 1].simTimeS) {
      throw new Error(`event simTimeS moves backward at seq ${event.seq}`);
    }
  }
  return copy;
}

function semanticEventToken(event) {
  return `${event.type}|${event.resourcePoolId ?? "-"}`;
}

function humanizeType(type) {
  return String(type)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
    .replace(/\b(Qpu|Cpu|Gpu|Hpc)\b/g, (word) => word.toUpperCase());
}

function groupLabel(events) {
  const names = [...new Set(events.map((event) => humanizeType(event.type)))];
  if (names.length <= 2) return names.join(" + ");
  return `${names.slice(0, 2).join(" + ")} +${names.length - 2}`;
}

/**
 * Convert exact engine events into same-simulation-time semantic moments.
 * Task ids are deliberately excluded from the repeat signature so repeated
 * work on different tasks can be recognized without changing trace semantics.
 */
export function buildSemanticGroups(simulationResult) {
  const events = validatedEvents(simulationResult?.events ?? []);
  if (events.length === 0) return [];

  const groups = [];
  let current = null;

  for (const event of events) {
    if (!current || current.simTimeS !== event.simTimeS) {
      current = {
        index: groups.length,
        simTimeS: event.simTimeS,
        events: [],
      };
      groups.push(current);
    }
    current.events.push(event);
  }

  return groups.map((group, index) => {
    const tokens = group.events.map(semanticEventToken).sort();
    return Object.freeze({
      index,
      simTimeS: group.simTimeS,
      sourceEventSeqRange: [group.events[0].seq, group.events[group.events.length - 1].seq],
      signature: tokens.join("||"),
      label: groupLabel(group.events),
      events: Object.freeze([...group.events]),
    });
  });
}

function latestQueueDepth(queueSeries, poolId, simTimeS) {
  let found = null;
  for (const sample of queueSeries ?? []) {
    if (sample.resourcePoolId !== poolId) continue;
    if (sample.simTimeS > simTimeS) continue;
    if (!found || sample.simTimeS >= found.simTimeS) found = sample;
  }
  return found?.depth ?? null;
}

function activeResourceIntervals(resourceIntervals, simTimeS) {
  const byPool = {};
  for (const interval of resourceIntervals ?? []) {
    const contains = interval.startS <= simTimeS && simTimeS < interval.endS;
    if (!contains) continue;
    byPool[interval.resourcePoolId] ??= {};
    byPool[interval.resourcePoolId][interval.state] =
      (byPool[interval.resourcePoolId][interval.state] ?? 0) + interval.units;
  }
  return byPool;
}

function activeTaskStates(taskIntervals, simTimeS) {
  const stateByTask = new Map();
  for (const interval of taskIntervals ?? []) {
    if (!(interval.startS <= simTimeS && simTimeS < interval.endS)) continue;
    stateByTask.set(interval.taskId, interval.state);
  }
  const counts = {};
  for (const state of stateByTask.values()) counts[state] = (counts[state] ?? 0) + 1;
  return counts;
}

function snapshotAt(simulationResult, simTimeS, eventTypes) {
  const queueDepthByPool = {};
  const poolIds = new Set([
    ...(simulationResult.resources ?? []).map((pool) => pool.id),
    ...(simulationResult.resourceIntervals ?? []).map((interval) => interval.resourcePoolId),
    ...(simulationResult.queueSeries ?? []).map((sample) => sample.resourcePoolId),
  ]);

  for (const poolId of poolIds) {
    const depth = latestQueueDepth(simulationResult.queueSeries, poolId, simTimeS);
    if (depth !== null) queueDepthByPool[poolId] = depth;
  }

  return Object.freeze({
    simTimeS,
    eventTypes: Object.freeze([...new Set(eventTypes)]),
    resourceUnitsByPoolAndState: Object.freeze(activeResourceIntervals(simulationResult.resourceIntervals, simTimeS)),
    taskStateCounts: Object.freeze(activeTaskStates(simulationResult.taskIntervals, simTimeS)),
    queueDepthByPool: Object.freeze(queueDepthByPool),
  });
}

function validateOptions(options) {
  const merged = {
    ...DEFAULT_OPTIONS,
    ...options,
    dwellMs: {...DEFAULT_OPTIONS.dwellMs, ...(options?.dwellMs ?? {})},
  };
  for (const key of ["repeatThreshold", "detailGroupsAtRunStart", "detailGroupsAtRunEnd"]) {
    if (!Number.isInteger(merged[key]) || merged[key] < 0) throw new TypeError(`${key} must be a non-negative integer`);
  }
  if (merged.repeatThreshold < 2) throw new RangeError("repeatThreshold must be >= 2");
  for (const [key, value] of Object.entries(merged.dwellMs)) {
    if (!Number.isFinite(value) || value <= 0) throw new RangeError(`dwellMs.${key} must be > 0`);
  }
  return merged;
}

const MAX_PATTERN_GROUPS = 8;
const MIN_PATTERN_REPEATS = 4;

function periodicRunAt(groups, start, cfg) {
  const remaining = groups.length - start;
  const maxPeriod = Math.min(
    MAX_PATTERN_GROUPS,
    Math.floor(remaining / MIN_PATTERN_REPEATS),
  );

  for (let period = 1; period <= maxPeriod; period += 1) {
    let endExclusive = start + period;
    while (
      endExclusive < groups.length &&
      groups[endExclusive].signature ===
        groups[start + ((endExclusive - start) % period)].signature
    ) {
      endExclusive += 1;
    }

    const matchedGroups = endExclusive - start;
    const repeatCount = Math.floor(matchedGroups / period);
    const fullGroups = repeatCount * period;
    if (
      repeatCount >= MIN_PATTERN_REPEATS &&
      fullGroups >= cfg.repeatThreshold
    ) {
      return {
        start,
        endExclusive: start + fullGroups,
        length: fullGroups,
        patternLength: period,
        patternSignature: groups
          .slice(start, start + period)
          .map((group) => group.signature)
          .join(">>"),
      };
    }
  }

  return null;
}

function segmentFromGroups(
  groups,
  startIndex,
  endIndexInclusive,
  kind,
  repeatCount = 1,
  patternLength = 1,
  signatureOverride = null,
) {
  const slice = groups.slice(startIndex, endIndexInclusive + 1);
  const first = slice[0];
  const last = slice[slice.length - 1];
  const eventTypes = slice.flatMap((group) => group.events.map((event) => event.type));
  return {
    groupRange: [startIndex, endIndexInclusive],
    sourceEventSeqRange: [first.sourceEventSeqRange[0], last.sourceEventSeqRange[1]],
    simTimeRangeS: [first.simTimeS, last.simTimeS],
    kind,
    repeatCount,
    patternLength,
    signature: signatureOverride ?? first.signature,
    eventTypes,
    baseLabel: first.label,
  };
}

/**
 * Compress only provably periodic presentation groups. A run is compressible
 * when its semantic signature pattern repeats at least four times. The
 * shortest matching period (up to eight groups) wins, making the result
 * deterministic. At least one complete pattern remains explicit at each end.
 * The exact source trace is never modified.
 */
export function compressSemanticGroups(groups, options = {}) {
  const cfg = validateOptions(options);
  const segments = [];

  for (let i = 0; i < groups.length;) {
    const run = periodicRunAt(groups, i, cfg);
    if (!run) {
      segments.push(segmentFromGroups(groups, i, i, "detail"));
      i += 1;
      continue;
    }

    const startPatterns = Math.max(
      1,
      Math.ceil(cfg.detailGroupsAtRunStart / run.patternLength),
    );
    const endPatterns = Math.max(
      1,
      Math.ceil(cfg.detailGroupsAtRunEnd / run.patternLength),
    );
    const headCount = Math.min(run.length, startPatterns * run.patternLength);
    const remainingAfterHead = run.length - headCount;
    const tailCount = Math.min(
      remainingAfterHead,
      endPatterns * run.patternLength,
    );
    const middleStart = run.start + headCount;
    const middleEnd = run.endExclusive - tailCount - 1;

    for (let j = run.start; j < run.start + headCount; j += 1) {
      segments.push(segmentFromGroups(groups, j, j, "detail"));
    }

    if (middleStart <= middleEnd) {
      const middleGroupCount = middleEnd - middleStart + 1;
      segments.push(segmentFromGroups(
        groups,
        middleStart,
        middleEnd,
        "compressed",
        middleGroupCount / run.patternLength,
        run.patternLength,
        run.patternSignature,
      ));
    }

    for (let j = run.endExclusive - tailCount; j < run.endExclusive; j += 1) {
      segments.push(segmentFromGroups(groups, j, j, "detail"));
    }

    i = run.endExclusive;
  }

  return segments;
}

function segmentIsTransition(segments, index) {
  const segment = segments[index];
  if (!segment || segment.kind === "compressed") return false;
  const prev = segments[index - 1];
  const next = segments[index + 1];
  return (!prev || prev.signature !== segment.signature) || (!next || next.signature !== segment.signature);
}

function labelForSegment(segment) {
  if (segment.kind !== "compressed") return segment.baseLabel;
  if (segment.patternLength > 1) {
    return `Repeated ${segment.patternLength}-step cycle ×${segment.repeatCount}`;
  }
  return `${segment.baseLabel} ×${segment.repeatCount}`;
}

/**
 * Build deterministic presentation keyframes from an exact SimulationResult.
 * Metrics are not read or recomputed.
 */
export function buildVisualKeyframes(simulationResult, options = {}) {
  const cfg = validateOptions(options);
  const groups = buildSemanticGroups(simulationResult);
  if (groups.length === 0) return [];
  const segments = compressSemanticGroups(groups, cfg);
  const keyframes = [];
  let presentationTimeMs = 0;

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    const terminal = i === segments.length - 1;
    const transition = segmentIsTransition(segments, i);
    const dwellMs = terminal
      ? cfg.dwellMs.terminal
      : segment.kind === "compressed"
        ? cfg.dwellMs.compressed
        : transition
          ? cfg.dwellMs.transition
          : cfg.dwellMs.detail;

    const snapshotTime = segment.simTimeRangeS[1];
    keyframes.push(Object.freeze({
      presentationTimeMs,
      dwellMs,
      sourceEventSeqRange: Object.freeze([...segment.sourceEventSeqRange]),
      simTimeRangeS: Object.freeze([...segment.simTimeRangeS]),
      label: labelForSegment(segment),
      kind: segment.kind,
      repeatCount: segment.repeatCount,
      patternLength: segment.patternLength,
      snapshot: snapshotAt(simulationResult, snapshotTime, segment.eventTypes),
    }));
    presentationTimeMs += dwellMs;
  }

  return Object.freeze(keyframes);
}

export function keyframeIndexAt(keyframes, presentationTimeMs) {
  if (keyframes.length === 0) return -1;
  if (presentationTimeMs <= 0) return 0;
  let lo = 0;
  let hi = keyframes.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (keyframes[mid].presentationTimeMs <= presentationTimeMs) lo = mid + 1;
    else hi = mid - 1;
  }
  return Math.max(0, Math.min(keyframes.length - 1, hi));
}

export function totalPresentationDurationMs(keyframes) {
  if (keyframes.length === 0) return 0;
  const last = keyframes[keyframes.length - 1];
  return last.presentationTimeMs + last.dwellMs;
}

/**
 * Pure/testable presentation clock. Wall-clock timestamps are supplied by the
 * caller; the controller never consults Date.now()/performance.now() itself.
 */
export function createPlaybackController(keyframes, {speed = 1} = {}) {
  if (!Number.isFinite(speed) || speed <= 0) throw new RangeError("speed must be > 0");
  let currentIndex = keyframes.length ? 0 : -1;
  let playing = false;
  let currentPresentationMs = 0;
  let anchorWallMs = 0;
  let anchorPresentationMs = 0;
  let currentSpeed = speed;

  function state() {
    return Object.freeze({
      index: currentIndex,
      playing,
      speed: currentSpeed,
      presentationTimeMs: currentPresentationMs,
      keyframe: currentIndex >= 0 ? keyframes[currentIndex] : null,
    });
  }

  function sync(wallTimeMs) {
    assertFiniteNumber(wallTimeMs, "wallTimeMs");
    if (!playing || currentIndex < 0) return state();
    const elapsed = Math.max(0, wallTimeMs - anchorWallMs) * currentSpeed;
    currentPresentationMs = Math.min(
      totalPresentationDurationMs(keyframes),
      anchorPresentationMs + elapsed,
    );
    currentIndex = keyframeIndexAt(keyframes, currentPresentationMs);
    if (currentPresentationMs >= totalPresentationDurationMs(keyframes)) playing = false;
    return state();
  }

  return Object.freeze({
    getState: state,
    play(wallTimeMs) {
      assertFiniteNumber(wallTimeMs, "wallTimeMs");
      if (currentIndex < 0) return state();
      if (currentPresentationMs >= totalPresentationDurationMs(keyframes)) {
        currentPresentationMs = 0;
        currentIndex = 0;
      }
      anchorWallMs = wallTimeMs;
      anchorPresentationMs = currentPresentationMs;
      playing = true;
      return state();
    },
    pause(wallTimeMs) {
      if (playing) sync(wallTimeMs);
      playing = false;
      return state();
    },
    tick: sync,
    stepForward() {
      playing = false;
      if (currentIndex >= 0 && currentIndex < keyframes.length - 1) currentIndex += 1;
      currentPresentationMs = currentIndex >= 0 ? keyframes[currentIndex].presentationTimeMs : 0;
      return state();
    },
    stepBackward() {
      playing = false;
      if (currentIndex > 0) currentIndex -= 1;
      currentPresentationMs = currentIndex >= 0 ? keyframes[currentIndex].presentationTimeMs : 0;
      return state();
    },
    seekIndex(index) {
      if (!Number.isInteger(index)) throw new TypeError("index must be an integer");
      playing = false;
      currentIndex = keyframes.length ? Math.max(0, Math.min(keyframes.length - 1, index)) : -1;
      currentPresentationMs = currentIndex >= 0 ? keyframes[currentIndex].presentationTimeMs : 0;
      return state();
    },
    setSpeed(nextSpeed, wallTimeMs = anchorWallMs) {
      if (!Number.isFinite(nextSpeed) || nextSpeed <= 0) throw new RangeError("speed must be > 0");
      if (playing) sync(wallTimeMs);
      currentSpeed = nextSpeed;
      anchorWallMs = wallTimeMs;
      anchorPresentationMs = currentPresentationMs;
      return state();
    },
  });
}

/**
 * Browser adapter. Rendering happens only when the semantic keyframe index
 * changes, so display refresh frequency cannot expose raw event-frequency
 * blinking. The RAF timestamp is used as the wall clock.
 */
export function createAnimationFrameDriver(controller, render, env = globalThis) {
  if (typeof render !== "function") throw new TypeError("render must be a function");
  const requestFrame = env.requestAnimationFrame?.bind(env);
  const cancelFrame = env.cancelAnimationFrame?.bind(env);
  if (!requestFrame || !cancelFrame) throw new Error("requestAnimationFrame/cancelAnimationFrame required");

  let requestId = null;
  let lastRenderedIndex = null;
  const visibilityTarget = env.document ?? null;
  const now = env.performance?.now?.bind(env.performance) ?? Date.now;

  function renderIfChanged(state) {
    if (state.index !== lastRenderedIndex) {
      lastRenderedIndex = state.index;
      render(state);
    }
  }

  function loop(timestamp) {
    const state = controller.tick(timestamp);
    renderIfChanged(state);
    if (state.playing) requestId = requestFrame(loop);
    else requestId = null;
  }

  function handleVisibilityChange() {
    if (visibilityTarget?.visibilityState !== "hidden") return;
    const state = controller.pause(now());
    if (requestId !== null) cancelFrame(requestId);
    requestId = null;
    renderIfChanged(state);
  }

  visibilityTarget?.addEventListener?.("visibilitychange", handleVisibilityChange);

  return Object.freeze({
    play(timestamp) {
      const state = controller.play(timestamp);
      renderIfChanged(state);
      if (state.playing && requestId === null) requestId = requestFrame(loop);
      return state;
    },
    pause(timestamp) {
      const state = controller.pause(timestamp);
      if (requestId !== null) cancelFrame(requestId);
      requestId = null;
      renderIfChanged(state);
      return state;
    },
    stepForward() {
      const state = controller.stepForward();
      renderIfChanged(state);
      return state;
    },
    stepBackward() {
      const state = controller.stepBackward();
      renderIfChanged(state);
      return state;
    },
    seekIndex(index) {
      const state = controller.seekIndex(index);
      renderIfChanged(state);
      return state;
    },
    destroy() {
      if (requestId !== null) cancelFrame(requestId);
      requestId = null;
      visibilityTarget?.removeEventListener?.("visibilitychange", handleVisibilityChange);
    },
  });
}

export {DEFAULT_OPTIONS};
