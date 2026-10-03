function intervalContains(startS, endS, time) {
  return startS <= time && time < endS;
}

function metadataStrings(task, key) {
  const value = task.metadata?.[key];
  return Array.isArray(value) && value.every((entry) => typeof entry === "string")
    ? value
    : undefined;
}

function semanticType(task) {
  const value = task.metadata?.semanticType;
  return typeof value === "string" ? value : undefined;
}

function eventTimeByTask(events, type) {
  const map = new Map();
  for (const event of events) {
    if (event.type === type && event.taskId !== undefined) {
      map.set(event.taskId, event.simTimeS);
    }
  }
  return map;
}

function dependencyEvents(result, type) {
  const map = new Map();
  for (const event of result.events) {
    if (event.type !== type) continue;
    const id = event.metadata?.dependencyId;
    if (typeof id === "string") map.set(id, event);
  }
  return map;
}

function hasPositiveCommunication(dep) {
  return (dep.fixedLatencyS ?? 0) > 0 || (dep.dataBytes ?? 0) > 0;
}

function latestQueueDepth(result, poolId, time) {
  let depth = 0;
  let latestTime = -Infinity;
  for (const sample of result.queueSeries) {
    if (
      sample.resourcePoolId === poolId &&
      sample.simTimeS <= time &&
      sample.simTimeS >= latestTime
    ) {
      depth = sample.depth;
      latestTime = sample.simTimeS;
    }
  }
  return depth;
}

function poolState(spec, result, poolId, time) {
  const pool = spec.resources.find((candidate) => candidate.id === poolId);
  if (!pool) throw new Error("Unknown resource pool " + poolId);

  const intervals = result.resourceIntervals.filter(
    (interval) =>
      interval.resourcePoolId === poolId &&
      intervalContains(interval.startS, interval.endS, time)
  );

  const units = (state) =>
    intervals
      .filter((interval) => interval.state === state)
      .reduce((sum, interval) => sum + interval.units, 0);

  return {
    resourcePoolId: pool.id,
    kind: pool.kind,
    capacity: pool.capacity,
    activeUnits: units("active"),
    allocatedIdleUnits: units("allocated-idle"),
    releasedUnits: units("released"),
    queuedTaskIds: result.taskIntervals
      .filter(
        (interval) =>
          interval.state === "queued" &&
          intervalContains(interval.startS, interval.endS, time)
      )
      .map((interval) => interval.taskId)
      .filter((taskId) =>
        spec.tasks.some(
          (task) => task.id === taskId && task.resourcePoolId === poolId
        )
      ),
    queueDepth: latestQueueDepth(result, poolId, time)
  };
}

function activeCommunications(spec, result, time) {
  const starts = dependencyEvents(result, "communication_started");
  const completes = dependencyEvents(result, "communication_completed");
  const dependencies = new Map(spec.dependencies.map((dep) => [dep.id, dep]));

  const active = [];
  for (const [dependencyId, start] of starts) {
    const complete = completes.get(dependencyId);
    if (start.simTimeS <= time && (!complete || time < complete.simTimeS)) {
      const dep = dependencies.get(dependencyId);
      if (!dep) continue;
      active.push({
        dependencyId,
        sourceTaskId: dep.sourceTaskId,
        targetTaskId: dep.targetTaskId,
        evidence: "engine"
      });
    }
  }
  return active;
}

function policyHeldTasks(spec, result, time) {
  const throttled = new Map();
  for (const event of result.events) {
    if (
      event.type === "task_throttled" &&
      event.taskId &&
      event.simTimeS <= time &&
      event.metadata?.reason === "maxInFlightQuantumByPool"
    ) {
      throttled.set(event.taskId, event);
    }
  }

  const readyNow = new Set(
    result.taskIntervals
      .filter(
        (interval) =>
          interval.state === "ready" &&
          intervalContains(interval.startS, interval.endS, time)
      )
      .map((interval) => interval.taskId)
  );

  return spec.tasks
    .filter((task) => {
      const pool = spec.resources.find(
        (resource) => resource.id === task.resourcePoolId
      );
      return (
        pool?.kind === "qpu" &&
        readyNow.has(task.id) &&
        throttled.has(task.id)
      );
    })
    .map((task) => ({
      taskId: task.id,
      resourcePoolId: task.resourcePoolId,
      qpuDemandUnits: task.resourceCount,
      reason: "maxInFlightQuantumByPool",
      ...(metadataStrings(task, "actorGroupIds")
        ? { actorGroupIds: metadataStrings(task, "actorGroupIds") }
        : {}),
      evidence: "derived"
    }));
}

function dependencyGates(spec, result, time, activeCommunication) {
  const taskById = new Map(spec.tasks.map((task) => [task.id, task]));
  const poolById = new Map(spec.resources.map((pool) => [pool.id, pool]));
  const incoming = new Map(spec.tasks.map((task) => [task.id, []]));
  for (const dep of spec.dependencies) {
    incoming.get(dep.targetTaskId)?.push(dep);
  }

  const readyAt = eventTimeByTask(result.events, "task_ready");
  const completedAt = eventTimeByTask(result.events, "task_completed");
  const communicationCompletes = dependencyEvents(
    result,
    "communication_completed"
  );
  const activeIds = new Set(
    activeCommunication.map((communication) => communication.dependencyId)
  );

  const gates = [];

  for (const task of spec.tasks) {
    const pool = poolById.get(task.resourcePoolId);
    if (!pool || pool.kind === "qpu") continue;
    if ((readyAt.get(task.id) ?? Infinity) <= time) continue;

    const deps = incoming.get(task.id) ?? [];
    if (!deps.length) continue;

    const unresolved = deps
      .filter((dep) => {
        const sourceComplete = completedAt.get(dep.sourceTaskId);
        if (sourceComplete === undefined || sourceComplete > time) return true;
        if (!hasPositiveCommunication(dep)) return false;
        const communicationComplete = communicationCompletes.get(dep.id);
        return !communicationComplete || communicationComplete.simTimeS > time;
      })
      .map((dep) => {
        if (activeIds.has(dep.id)) {
          return {
            dependencyId: dep.id,
            sourceTaskId: dep.sourceTaskId,
            directState: "communication-active"
          };
        }

        const sourceTask = taskById.get(dep.sourceTaskId);
        const sourcePool = sourceTask
          ? poolById.get(sourceTask.resourcePoolId)
          : undefined;

        return {
          dependencyId: dep.id,
          sourceTaskId: dep.sourceTaskId,
          directState:
            sourcePool?.kind === "qpu"
              ? "qpu-predecessor-incomplete"
              : "upstream-incomplete"
        };
      });

    if (!unresolved.length) continue;

    // Surface only the immediate causal frontier. A target whose unresolved
    // source has not itself become dependency-ready is downstream rather than
    // the current causal edge.
    const immediate = unresolved.every((entry) => {
      const sourceReady = readyAt.get(entry.sourceTaskId);
      const sourceComplete = completedAt.get(entry.sourceTaskId);
      return (
        (sourceReady !== undefined && sourceReady <= time) ||
        (sourceComplete !== undefined && sourceComplete <= time)
      );
    });
    if (!immediate) continue;

    const type = semanticType(task);
    const collective = type === "collective-synchronization";

    gates.push({
      taskId: task.id,
      classicalDemandUnits: task.resourceCount,
      incomingDependencyCount: deps.length,
      unresolved,
      structuralJoin: deps.length > 1,
      ...(type ? { semanticType: type } : {}),
      ...(metadataStrings(task, "actorGroupIds")
        ? { actorGroupIds: metadataStrings(task, "actorGroupIds") }
        : {}),
      explanation: collective
        ? "collective-synchronization"
        : "dependency-gate",
      evidence: collective ? "conditional" : "derived"
    });
  }

  return gates;
}

export function deriveSystemStateSnapshot(spec, result, simTimeS) {
  const time = Math.max(
    0,
    Math.min(simTimeS, result.metrics.makespanS)
  );
  const classicalByPool = {};
  const qpuByPool = {};

  for (const pool of spec.resources) {
    const state = poolState(spec, result, pool.id, time);
    if (pool.kind === "qpu") qpuByPool[pool.id] = state;
    else classicalByPool[pool.id] = state;
  }

  const communications = activeCommunications(spec, result, time);
  const policyHeld = policyHeldTasks(spec, result, time);
  const gates = dependencyGates(spec, result, time, communications);

  const running = new Set(
    result.taskIntervals
      .filter(
        (interval) =>
          interval.state === "running" &&
          intervalContains(interval.startS, interval.endS, time)
      )
      .map((interval) => interval.taskId)
  );
  const queued = new Set(
    result.taskIntervals
      .filter(
        (interval) =>
          interval.state === "queued" &&
          intervalContains(interval.startS, interval.endS, time)
      )
      .map((interval) => interval.taskId)
  );
  const held = new Set(policyHeld.map((task) => task.taskId));
  const gated = new Set(gates.map((gate) => gate.taskId));
  const completedAt = eventTimeByTask(result.events, "task_completed");

  const taskStateById = {};
  for (const task of spec.tasks) {
    taskStateById[task.id] = running.has(task.id)
      ? "running"
      : queued.has(task.id)
        ? "queued"
        : held.has(task.id)
          ? "policy-held"
          : gated.has(task.id)
            ? "dependency-gated"
            : (completedAt.get(task.id) ?? Infinity) <= time
              ? "complete"
              : "pending";
  }

  return {
    simTimeS: time,
    resources: { classicalByPool, qpuByPool },
    causal: {
      activeCommunications: communications,
      policyHeldQuantumTasks: policyHeld,
      dependencyGatedClassical: gates
    },
    dag: {
      taskStateById,
      activeCommunicationDependencyIds: communications.map(
        (communication) => communication.dependencyId
      )
    }
  };
}
