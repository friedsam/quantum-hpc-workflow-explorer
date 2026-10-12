function fail(message) {
  throw new Error(message);
}

function actorGroupEntry(manifest, actorGroupId) {
  const group = manifest?.actorGroups?.[actorGroupId];
  if (!group) fail(`unknown actor group ${actorGroupId}`);
  return group;
}

function selectionSelectsActor(selection, actorOrdinal) {
  if (selection.kind === "all") return true;
  if (selection.kind === "ordinals") {
    return selection.actorOrdinals.includes(actorOrdinal);
  }
  if (selection.kind === "range") {
    return selection.startActorOrdinal <= actorOrdinal &&
      actorOrdinal <= selection.endActorOrdinal;
  }
  if (selection.kind === "all-except") {
    return selection.actorOrdinals.indexOf(actorOrdinal) === -1;
  }
  return selection.actorOrdinal === actorOrdinal;
}

function eventTime(simulationResult, eventType, taskId) {
  return simulationResult.events.find(
    (event) => event.type === eventType && event.taskId === taskId
  )?.simTimeS;
}

function boundaryTime(simulationResult, boundary) {
  const times = boundary.taskIds.map((taskId) => {
    const time = eventTime(
      simulationResult,
      boundary.eventType,
      taskId
    );
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

function taskRunningInterval(simulationResult, taskId) {
  return simulationResult.taskIntervals.find(
    (interval) =>
      interval.taskId === taskId &&
      interval.state === "running"
  );
}

function activeParticipationClaim(
  taskId,
  taskManifest,
  simulationResult,
  actorGroupId,
  actorOrdinal,
  simTimeS
) {
  const assignments = (taskManifest.actorAssignments ?? []).filter(
    (assignment) =>
      assignment.actorGroupId === actorGroupId &&
      selectionSelectsActor(assignment.selection, actorOrdinal)
  );

  if (assignments.length > 1) {
    fail(
      `compiled task ${taskId} has multiple actor assignments for ${actorGroupId} actor ${actorOrdinal}`
    );
  }
  if (assignments.length === 0) return null;

  const assignment = assignments[0];

  if (assignment.stateDuringTask === "working") {
    const interval = taskRunningInterval(
      simulationResult,
      taskId
    );
    if (!interval) return null;

    return (
      interval.startS <= simTimeS &&
      simTimeS < interval.endS
    )
      ? {
          kind: "participation",
          taskId,
          state: "working",
        }
      : null;
  }

  const startS = eventTime(
    simulationResult,
    "task_ready",
    taskId
  );
  const endS = eventTime(
    simulationResult,
    "task_completed",
    taskId
  );
  if (startS === undefined || endS === undefined) return null;

  return startS <= simTimeS && simTimeS < endS
    ? {
        kind: "participation",
        taskId,
        state: "blocked",
        reason: `task-participation:${taskId}`,
      }
    : null;
}

function activeWaitClaim(
  waitId,
  wait,
  simulationResult,
  actorGroupId,
  actorOrdinal,
  simTimeS
) {
  if (wait.actorGroupId !== actorGroupId) return null;
  if (!selectionSelectsActor(wait.selection, actorOrdinal)) {
    return null;
  }

  const startS = boundaryTime(
    simulationResult,
    wait.activation
  );
  const endS = boundaryTime(
    simulationResult,
    wait.release
  );

  if (endS < startS) {
    fail(
      `actor wait ${waitId} releases before activation: ${endS} < ${startS}`
    );
  }

  return startS <= simTimeS && simTimeS < endS
    ? {
        kind: "wait",
        waitId,
        state: "blocked",
        reason: wait.reason,
      }
    : null;
}

function validateActorQuery(
  manifest,
  simulationResult,
  actorGroupId,
  actorOrdinal,
  simTimeS
) {
  const group = actorGroupEntry(manifest, actorGroupId);

  if (
    !Number.isInteger(actorOrdinal) ||
    actorOrdinal < 1 ||
    actorOrdinal > group.count
  ) {
    fail(
      `actor ordinal must be in 1..${group.count} for group ${actorGroupId}`
    );
  }

  if (
    !Number.isFinite(simTimeS) ||
    simTimeS < 0 ||
    simTimeS > simulationResult.metrics.makespanS
  ) {
    fail("simTimeS must be within the simulation makespan");
  }

  return group;
}

/**
 * Derive one persistent logical actor's explanatory state at simulation time.
 *
 * Task participation and dependency/gate waits are separate claims.
 * Multiple blocked claims coalesce to one top-level blocked state while
 * preserving all distinct reasons. Working + blocked overlap is rejected.
 *
 * This projection does not change frozen DES task/resource/queue semantics.
 */
export function deriveActorStateDetailAt(
  manifest,
  simulationResult,
  actorGroupId,
  actorOrdinal,
  simTimeS
) {
  validateActorQuery(
    manifest,
    simulationResult,
    actorGroupId,
    actorOrdinal,
    simTimeS
  );

  const workingClaims = [];
  const blockedClaims = [];

  for (const [taskId, taskManifest] of Object.entries(
    manifest.tasks ?? {}
  )) {
    const claim = activeParticipationClaim(
      taskId,
      taskManifest,
      simulationResult,
      actorGroupId,
      actorOrdinal,
      simTimeS
    );
    if (!claim) continue;
    if (claim.state === "working") {
      workingClaims.push(claim);
    } else {
      blockedClaims.push(claim);
    }
  }

  for (const [waitId, wait] of Object.entries(
    manifest.actorWaits ?? {}
  )) {
    const claim = activeWaitClaim(
      waitId,
      wait,
      simulationResult,
      actorGroupId,
      actorOrdinal,
      simTimeS
    );
    if (claim) blockedClaims.push(claim);
  }

  if (workingClaims.length > 1) {
    fail(
      `actor ${actorGroupId}:${actorOrdinal} has overlapping working participation claims at t=${simTimeS}: ${workingClaims.map((claim) => claim.taskId).join(", ")}`
    );
  }

  if (workingClaims.length > 0 && blockedClaims.length > 0) {
    fail(
      `actor ${actorGroupId}:${actorOrdinal} is both working and blocked at t=${simTimeS}`
    );
  }

  const blockedReasons = [
    ...new Set(
      blockedClaims
        .map((claim) => claim.reason)
        .filter(Boolean)
    ),
  ].sort();

  if (blockedClaims.length > 0) {
    return {
      actorGroupId,
      actorOrdinal,
      simTimeS,
      state: "blocked",
      blockedReasons,
    };
  }

  if (workingClaims.length > 0) {
    return {
      actorGroupId,
      actorOrdinal,
      simTimeS,
      state: "working",
      blockedReasons: [],
    };
  }

  return {
    actorGroupId,
    actorOrdinal,
    simTimeS,
    state: "idle",
    blockedReasons: [],
  };
}

export function deriveActorStateAt(
  manifest,
  simulationResult,
  actorGroupId,
  actorOrdinal,
  simTimeS
) {
  return deriveActorStateDetailAt(
    manifest,
    simulationResult,
    actorGroupId,
    actorOrdinal,
    simTimeS
  ).state;
}

export function deriveActorStateCountsAt(
  manifest,
  simulationResult,
  actorGroupId,
  simTimeS
) {
  const group = actorGroupEntry(manifest, actorGroupId);
  const counts = {
    actorGroupId,
    simTimeS,
    working: 0,
    blocked: 0,
    idle: 0,
  };

  for (
    let actorOrdinal = 1;
    actorOrdinal <= group.count;
    actorOrdinal += 1
  ) {
    const state = deriveActorStateAt(
      manifest,
      simulationResult,
      actorGroupId,
      actorOrdinal,
      simTimeS
    );
    counts[state] += 1;
  }

  return counts;
}
