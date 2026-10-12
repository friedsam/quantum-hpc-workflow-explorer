function fail(message) {
  throw new Error(message);
}

function actorGroupEntry(manifest, actorGroupId) {
  const group = manifest?.actorGroups?.[actorGroupId];
  if (!group) fail(`unknown actor group ${actorGroupId}`);
  return group;
}

function forEachSelectedActor(selection, actorCount, visit) {
  if (selection.kind === "all") {
    for (let ordinal = 1; ordinal <= actorCount; ordinal += 1) {
      visit(ordinal);
    }
    return;
  }

  if (selection.kind === "one") {
    visit(selection.actorOrdinal);
    return;
  }

  if (selection.kind === "ordinals") {
    for (const ordinal of selection.actorOrdinals) visit(ordinal);
    return;
  }

  if (selection.kind === "range") {
    for (
      let ordinal = selection.startActorOrdinal;
      ordinal <= selection.endActorOrdinal;
      ordinal += 1
    ) {
      visit(ordinal);
    }
    return;
  }

  if (selection.kind === "all-except") {
    const excluded = new Set(selection.actorOrdinals);
    for (let ordinal = 1; ordinal <= actorCount; ordinal += 1) {
      if (!excluded.has(ordinal)) visit(ordinal);
    }
    return;
  }

  fail(`unsupported compiled actor selection ${selection.kind}`);
}

function buildSimulationIndex(simulationResult) {
  const eventTimes = new Map();
  for (const event of simulationResult.events ?? []) {
    if (!event.taskId) continue;
    const key = `${event.type}\u0000${event.taskId}`;
    if (!eventTimes.has(key)) {
      eventTimes.set(key, event.simTimeS);
    }
  }

  const runningIntervals = new Map();
  for (const interval of simulationResult.taskIntervals ?? []) {
    if (
      interval.state === "running" &&
      !runningIntervals.has(interval.taskId)
    ) {
      runningIntervals.set(interval.taskId, interval);
    }
  }

  return { eventTimes, runningIntervals };
}

function eventTime(index, eventType, taskId) {
  return index.eventTimes.get(`${eventType}\u0000${taskId}`);
}

function boundaryTime(index, boundary) {
  const times = boundary.taskIds.map((taskId) => {
    const time = eventTime(index, boundary.eventType, taskId);
    if (time === undefined) {
      fail(
        `missing ${boundary.eventType} event for actor-wait task ${taskId}`
      );
    }
    return time;
  });

  if (times.length === 0) {
    fail("actor-wait boundary must contain at least one task");
  }

  return boundary.quantifier === "any"
    ? Math.min(...times)
    : Math.max(...times);
}

function eventBucket(actorEvents, actorOrdinal, simTimeS) {
  let byTime = actorEvents[actorOrdinal];
  if (!byTime) {
    byTime = new Map();
    actorEvents[actorOrdinal] = byTime;
  }

  let bucket = byTime.get(simTimeS);
  if (!bucket) {
    bucket = { starts: [], ends: [] };
    byTime.set(simTimeS, bucket);
  }
  return bucket;
}

function addClaimInterval(
  actorEvents,
  actorCount,
  selection,
  startS,
  endS,
  claim
) {
  if (
    startS === undefined ||
    endS === undefined ||
    endS === startS
  ) {
    return;
  }

  if (endS < startS) {
    fail(
      `actor claim ${claim.id} releases before activation: ${endS} < ${startS}`
    );
  }

  forEachSelectedActor(selection, actorCount, (actorOrdinal) => {
    eventBucket(actorEvents, actorOrdinal, startS)
      .starts.push(claim);
    eventBucket(actorEvents, actorOrdinal, endS)
      .ends.push(claim);
  });
}

function addParticipationClaims(
  manifest,
  simulationIndex,
  groups
) {
  let claimCount = 0;

  for (const [taskId, taskManifest] of Object.entries(
    manifest.tasks ?? {}
  )) {
    for (const [assignmentIndex, assignment] of (
      taskManifest.actorAssignments ?? []
    ).entries()) {
      const group = groups.get(assignment.actorGroupId);
      if (!group) {
        fail(
          `compiled task ${taskId} references unknown actor group ${assignment.actorGroupId}`
        );
      }

      let startS;
      let endS;
      let reason;

      if (assignment.stateDuringTask === "working") {
        const interval =
          simulationIndex.runningIntervals.get(taskId);
        if (!interval) continue;
        startS = interval.startS;
        endS = interval.endS;
      } else {
        startS = eventTime(
          simulationIndex,
          "task_ready",
          taskId
        );
        endS = eventTime(
          simulationIndex,
          "task_completed",
          taskId
        );
        reason = `task-participation:${taskId}`;
      }

      addClaimInterval(
        group.actorEvents,
        group.count,
        assignment.selection,
        startS,
        endS,
        {
          id: `task:${taskId}:${assignmentIndex}`,
          kind: "participation",
          taskId,
          state: assignment.stateDuringTask,
          reason,
        }
      );
      claimCount += 1;
    }
  }

  return claimCount;
}

function addWaitClaims(
  manifest,
  simulationIndex,
  groups
) {
  let claimCount = 0;

  for (const [waitId, wait] of Object.entries(
    manifest.actorWaits ?? {}
  )) {
    const group = groups.get(wait.actorGroupId);
    if (!group) {
      fail(
        `actor wait ${waitId} references unknown actor group ${wait.actorGroupId}`
      );
    }

    const startS = boundaryTime(
      simulationIndex,
      wait.activation
    );
    const endS = boundaryTime(
      simulationIndex,
      wait.release
    );

    addClaimInterval(
      group.actorEvents,
      group.count,
      wait.selection,
      startS,
      endS,
      {
        id: `wait:${waitId}`,
        kind: "wait",
        waitId,
        state: "blocked",
        reason: wait.reason,
      }
    );
    claimCount += 1;
  }

  return claimCount;
}

function classificationKey(classification) {
  if (classification.conflict) {
    return `conflict:${classification.conflict.type}:${
      classification.conflict.workingTaskIds?.join(",") ?? ""
    }`;
  }
  return `${classification.state}:${
    classification.blockedReasons.join("\u0001")
  }`;
}

function classifyClaims(activeWorking, activeBlocked) {
  if (activeWorking.size > 1) {
    return {
      conflict: {
        type: "multiple-working",
        workingTaskIds: [...activeWorking.values()]
          .map((claim) => claim.taskId),
      },
      state: null,
      blockedReasons: [],
    };
  }

  if (activeWorking.size > 0 && activeBlocked.size > 0) {
    return {
      conflict: {
        type: "working-blocked",
      },
      state: null,
      blockedReasons: [],
    };
  }

  if (activeBlocked.size > 0) {
    return {
      conflict: null,
      state: "blocked",
      blockedReasons: [
        ...new Set(
          [...activeBlocked.values()]
            .map((claim) => claim.reason)
            .filter(Boolean)
        ),
      ].sort(),
    };
  }

  if (activeWorking.size > 0) {
    return {
      conflict: null,
      state: "working",
      blockedReasons: [],
    };
  }

  return {
    conflict: null,
    state: "idle",
    blockedReasons: [],
  };
}

function pushMergedSegment(segments, segment) {
  const previous = segments[segments.length - 1];
  if (
    previous &&
    previous.endS === segment.startS &&
    classificationKey(previous) ===
      classificationKey(segment)
  ) {
    previous.endS = segment.endS;
    return;
  }
  segments.push(segment);
}

function buildActorTimeline(byTime, makespanS) {
  if (makespanS === 0) return [];

  const times = [
    ...new Set([
      0,
      makespanS,
      ...(byTime ? byTime.keys() : []),
    ]),
  ].sort((a, b) => a - b);

  const activeWorking = new Map();
  const activeBlocked = new Map();
  const segments = [];

  for (let index = 0; index < times.length - 1; index += 1) {
    const simTimeS = times[index];
    const endS = times[index + 1];
    const bucket = byTime?.get(simTimeS);

    if (bucket) {
      for (const claim of bucket.ends) {
        activeWorking.delete(claim.id);
        activeBlocked.delete(claim.id);
      }
      for (const claim of bucket.starts) {
        if (claim.state === "working") {
          activeWorking.set(claim.id, claim);
        } else {
          activeBlocked.set(claim.id, claim);
        }
      }
    }

    if (endS <= simTimeS) continue;
    const classification = classifyClaims(
      activeWorking,
      activeBlocked
    );

    pushMergedSegment(segments, {
      startS: simTimeS,
      endS,
      ...classification,
    });
  }

  return segments;
}

function segmentAt(segments, simTimeS, makespanS) {
  if (simTimeS === makespanS || segments.length === 0) {
    return {
      startS: simTimeS,
      endS: simTimeS,
      conflict: null,
      state: "idle",
      blockedReasons: [],
    };
  }

  let low = 0;
  let high = segments.length - 1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const segment = segments[mid];
    if (simTimeS < segment.startS) {
      high = mid - 1;
    } else if (simTimeS >= segment.endS) {
      low = mid + 1;
    } else {
      return segment;
    }
  }

  return {
    startS: simTimeS,
    endS: simTimeS,
    conflict: null,
    state: "idle",
    blockedReasons: [],
  };
}

function conflictError(
  actorGroupId,
  actorOrdinal,
  simTimeS,
  conflict
) {
  if (conflict.type === "multiple-working") {
    return new Error(
      `actor ${actorGroupId}:${actorOrdinal} has overlapping working participation claims at t=${simTimeS}: ${conflict.workingTaskIds.join(", ")}`
    );
  }

  return new Error(
    `actor ${actorGroupId}:${actorOrdinal} is both working and blocked at t=${simTimeS}`
  );
}

function summaryKey(summary) {
  if (summary.conflict) {
    return `conflict:${summary.conflict.actorOrdinal}:${
      summary.conflict.segment.conflict.type
    }`;
  }

  return [
    summary.working,
    summary.blocked,
    summary.idle,
    JSON.stringify(summary.blockedReasonCounts),
  ].join("|");
}

function buildGroupSummaries(group, makespanS) {
  if (makespanS === 0) return [];

  const transitionTimes = new Set([0, makespanS]);
  for (
    let actorOrdinal = 1;
    actorOrdinal <= group.count;
    actorOrdinal += 1
  ) {
    for (const segment of group.actorTimelines[actorOrdinal]) {
      transitionTimes.add(segment.startS);
      transitionTimes.add(segment.endS);
    }
  }

  const times = [...transitionTimes].sort((a, b) => a - b);
  const summaries = [];

  for (let index = 0; index < times.length - 1; index += 1) {
    const startS = times[index];
    const endS = times[index + 1];
    if (endS <= startS) continue;

    const counts = {
      working: 0,
      blocked: 0,
      idle: 0,
    };
    const reasonCounts = new Map();
    let conflict = null;

    for (
      let actorOrdinal = 1;
      actorOrdinal <= group.count;
      actorOrdinal += 1
    ) {
      const segment = segmentAt(
        group.actorTimelines[actorOrdinal],
        startS,
        makespanS
      );

      if (segment.conflict) {
        conflict = {
          actorOrdinal,
          segment,
        };
        break;
      }

      counts[segment.state] += 1;
      if (segment.state === "blocked") {
        for (const reason of segment.blockedReasons) {
          reasonCounts.set(
            reason,
            (reasonCounts.get(reason) ?? 0) + 1
          );
        }
      }
    }

    const blockedReasonCounts = Object.fromEntries(
      [...reasonCounts.entries()].sort(([a], [b]) =>
        a.localeCompare(b)
      )
    );

    const summary = {
      startS,
      endS,
      ...counts,
      blockedReasonCounts,
      conflict,
    };

    const previous = summaries[summaries.length - 1];
    if (
      previous &&
      previous.endS === summary.startS &&
      summaryKey(previous) === summaryKey(summary)
    ) {
      previous.endS = summary.endS;
    } else {
      summaries.push(summary);
    }
  }

  return {
    summaries,
    transitionTimes: times,
  };
}

function validateGroupTime(
  group,
  makespanS,
  actorOrdinal,
  simTimeS
) {
  if (
    actorOrdinal !== undefined &&
    (
      !Number.isInteger(actorOrdinal) ||
      actorOrdinal < 1 ||
      actorOrdinal > group.count
    )
  ) {
    fail(
      `actor ordinal must be in 1..${group.count} for group ${group.actorGroupId}`
    );
  }

  if (
    !Number.isFinite(simTimeS) ||
    simTimeS < 0 ||
    simTimeS > makespanS
  ) {
    fail("simTimeS must be within the simulation makespan");
  }
}

export function createActorStateProjector(
  manifest,
  simulationResult
) {
  const makespanS = simulationResult?.metrics?.makespanS;
  if (!Number.isFinite(makespanS) || makespanS < 0) {
    fail("SimulationResult with finite non-negative makespanS is required");
  }

  const groups = new Map(
    Object.values(manifest?.actorGroups ?? {}).map((entry) => [
      entry.actorGroupId,
      {
        ...entry,
        actorEvents: Array(entry.count + 1),
        actorTimelines: Array.from(
          { length: entry.count + 1 },
          () => []
        ),
        summaries: [],
        transitionTimes: [],
      },
    ])
  );

  const simulationIndex = buildSimulationIndex(
    simulationResult
  );
  const participationClaimCount = addParticipationClaims(
    manifest,
    simulationIndex,
    groups
  );
  const waitClaimCount = addWaitClaims(
    manifest,
    simulationIndex,
    groups
  );

  let actorSegmentCount = 0;
  let summarySegmentCount = 0;

  for (const group of groups.values()) {
    for (
      let actorOrdinal = 1;
      actorOrdinal <= group.count;
      actorOrdinal += 1
    ) {
      group.actorTimelines[actorOrdinal] =
        buildActorTimeline(
          group.actorEvents[actorOrdinal],
          makespanS
        );
      actorSegmentCount +=
        group.actorTimelines[actorOrdinal].length;
    }

    const summaryData = buildGroupSummaries(
      group,
      makespanS
    );
    group.summaries = summaryData.summaries;
    group.transitionTimes =
      summaryData.transitionTimes;
    summarySegmentCount += group.summaries.length;

    delete group.actorEvents;
  }

  function requireGroup(actorGroupId) {
    const group = groups.get(actorGroupId);
    if (!group) fail(`unknown actor group ${actorGroupId}`);
    return group;
  }

  function detailAt(
    actorGroupId,
    actorOrdinal,
    simTimeS
  ) {
    const group = requireGroup(actorGroupId);
    validateGroupTime(
      group,
      makespanS,
      actorOrdinal,
      simTimeS
    );

    const segment = segmentAt(
      group.actorTimelines[actorOrdinal],
      simTimeS,
      makespanS
    );

    if (segment.conflict) {
      throw conflictError(
        actorGroupId,
        actorOrdinal,
        simTimeS,
        segment.conflict
      );
    }

    return {
      actorGroupId,
      actorOrdinal,
      simTimeS,
      state: segment.state,
      blockedReasons: [...segment.blockedReasons],
    };
  }

  function summaryAt(actorGroupId, simTimeS) {
    const group = requireGroup(actorGroupId);
    validateGroupTime(
      group,
      makespanS,
      undefined,
      simTimeS
    );

    if (simTimeS === makespanS) {
      return {
        actorGroupId,
        label: group.label,
        ...(group.kind ? { kind: group.kind } : {}),
        count: group.count,
        working: 0,
        blocked: 0,
        idle: group.count,
        blockedReasonCounts: {},
        evidence: "authored+derived",
      };
    }

    const segment = segmentAt(
      group.summaries,
      simTimeS,
      makespanS
    );

    if (segment.conflict) {
      throw conflictError(
        actorGroupId,
        segment.conflict.actorOrdinal,
        simTimeS,
        segment.conflict.segment.conflict
      );
    }

    return {
      actorGroupId,
      label: group.label,
      ...(group.kind ? { kind: group.kind } : {}),
      count: group.count,
      working: segment.working,
      blocked: segment.blocked,
      idle: segment.idle,
      blockedReasonCounts: {
        ...segment.blockedReasonCounts,
      },
      evidence: "authored+derived",
    };
  }

  function countsAt(actorGroupId, simTimeS) {
    const summary = summaryAt(actorGroupId, simTimeS);
    return {
      actorGroupId,
      simTimeS,
      working: summary.working,
      blocked: summary.blocked,
      idle: summary.idle,
    };
  }

  function transitionTimes(actorGroupId) {
    return [...requireGroup(actorGroupId).transitionTimes];
  }

  return Object.freeze({
    detailAt,
    countsAt,
    summaryAt,
    transitionTimes,
    stats: Object.freeze({
      actorGroupCount: groups.size,
      actorCount: [...groups.values()].reduce(
        (sum, group) => sum + group.count,
        0
      ),
      participationClaimCount,
      waitClaimCount,
      actorSegmentCount,
      summarySegmentCount,
      indexedEventCount:
        simulationIndex.eventTimes.size,
      indexedRunningIntervalCount:
        simulationIndex.runningIntervals.size,
    }),
  });
}
