function fail(message) {
  throw new Error(message);
}

function actorGroupEntry(manifest, actorGroupId) {
  const group = manifest?.actorGroups?.[actorGroupId];
  if (!group) fail(`unknown actor group ${actorGroupId}`);
  return group;
}

function assignmentSelectsActor(assignment, actorOrdinal) {
  if (assignment.selection.kind === "all") return true;
  return assignment.selection.actorOrdinal === actorOrdinal;
}

function taskReadyTime(simulationResult, taskId) {
  return simulationResult.events.find(
    (event) => event.type === "task_ready" && event.taskId === taskId
  )?.simTimeS;
}

function taskCompletionTime(simulationResult, taskId) {
  return simulationResult.events.find(
    (event) => event.type === "task_completed" && event.taskId === taskId
  )?.simTimeS;
}

function taskRunningInterval(simulationResult, taskId) {
  return simulationResult.taskIntervals.find(
    (interval) => interval.taskId === taskId && interval.state === "running"
  );
}

function activeClaimForTask(
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
      assignmentSelectsActor(assignment, actorOrdinal)
  );

  if (assignments.length > 1) {
    fail(`compiled task ${taskId} has multiple actor assignments for ${actorGroupId} actor ${actorOrdinal}`);
  }
  if (assignments.length === 0) return null;

  const assignment = assignments[0];

  if (assignment.stateDuringTask === "working") {
    const interval = taskRunningInterval(simulationResult, taskId);
    if (!interval) return null;
    return interval.startS <= simTimeS && simTimeS < interval.endS
      ? { taskId, state: "working" }
      : null;
  }

  const startS = taskReadyTime(simulationResult, taskId);
  const endS = taskCompletionTime(simulationResult, taskId);
  if (startS === undefined || endS === undefined) return null;

  return startS <= simTimeS && simTimeS < endS
    ? { taskId, state: "blocked" }
    : null;
}

/**
 * Derive one persistent logical actor's state at a simulation time.
 *
 * working: actor participates in a compiled task marked "working" while that
 *          task is running.
 * blocked: actor participates in a compiled task marked "blocked" from task
 *          readiness until task completion, including policy/resource wait.
 * idle:    no active actor claim.
 *
 * These states are a higher-level explanatory projection. They do not change
 * frozen DES task/resource/queue semantics.
 */
export function deriveActorStateAt(
  manifest,
  simulationResult,
  actorGroupId,
  actorOrdinal,
  simTimeS
) {
  const group = actorGroupEntry(manifest, actorGroupId);
  if (!Number.isInteger(actorOrdinal) ||
      actorOrdinal < 1 ||
      actorOrdinal > group.count) {
    fail(`actor ordinal must be in 1..${group.count} for group ${actorGroupId}`);
  }
  if (!Number.isFinite(simTimeS) ||
      simTimeS < 0 ||
      simTimeS > simulationResult.metrics.makespanS) {
    fail("simTimeS must be within the simulation makespan");
  }

  const claims = [];
  for (const [taskId, taskManifest] of Object.entries(manifest.tasks ?? {})) {
    const claim = activeClaimForTask(
      taskId,
      taskManifest,
      simulationResult,
      actorGroupId,
      actorOrdinal,
      simTimeS
    );
    if (claim) claims.push(claim);
  }

  if (claims.length > 1) {
    fail(
      `actor ${actorGroupId}:${actorOrdinal} has overlapping participation claims at t=${simTimeS}: ${claims.map((claim) => claim.taskId).join(", ")}`
    );
  }

  return claims[0]?.state ?? "idle";
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

  for (let actorOrdinal = 1; actorOrdinal <= group.count; actorOrdinal += 1) {
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
