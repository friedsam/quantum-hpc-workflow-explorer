const KINDS = new Set(["cpu", "gpu", "qpu"]);
const CLASSICAL = new Set(["cpu", "gpu"]);
const PRI = { complete: 0, transferComplete: 1 };
const nonneg = (x) => Number.isFinite(x) && x >= 0;
const posint = (x) => Number.isInteger(x) && x > 0;
const die = (message) => { throw new Error(message); };

function duration(model, label) {
  if (!model || model.kind !== "constant" || !nonneg(model.seconds)) {
    die(`${label} must be { kind: "constant", seconds >= 0 }`);
  }
  return model.seconds;
}

function transferTime(dep) {
  const latency = dep.fixedLatencyS ?? 0;
  const bytes = dep.dataBytes ?? 0;
  if (!nonneg(latency) || !nonneg(bytes)) die(`dependency ${dep.id}: invalid transfer parameters`);
  if (bytes === 0) return latency;
  if (!Number.isFinite(dep.bandwidthBytesPerS) || dep.bandwidthBytesPerS <= 0) {
    die(`dependency ${dep.id}: bandwidthBytesPerS must be > 0 when dataBytes > 0`);
  }
  return latency + bytes / dep.bandwidthBytesPerS;
}

function fixedReservation(spec, resource) {
  if (!CLASSICAL.has(resource.kind) || spec.policy.allocation !== "fixed") return resource.capacity;
  return spec.policy.fixedReservationByPool?.[resource.id] ?? resource.capacity;
}

function schedulingCapacity(spec, resource) {
  return CLASSICAL.has(resource.kind) && spec.policy.allocation === "fixed"
    ? fixedReservation(spec, resource)
    : resource.capacity;
}

function qpuInFlightLimit(spec, resourcePoolId) {
  return spec.policy.maxInFlightQuantumByPool?.[resourcePoolId] ?? Infinity;
}

function validateRecord(value, label) {
  if (value === undefined) return;
  if (!value || typeof value !== "object" || Array.isArray(value)) die(`${label} must be an object keyed by resourcePoolId`);
}

function prepareWorkflowSpec(spec) {
  if (!spec?.id || !Array.isArray(spec.tasks) || spec.tasks.length === 0 ||
      !Array.isArray(spec.dependencies) || !Array.isArray(spec.resources) || spec.resources.length === 0) {
    die("workflow requires id, tasks, dependencies, and resources");
  }
  if (!["fixed", "release-aware"].includes(spec.policy?.allocation)) die("invalid allocation policy");
  validateRecord(spec.policy.fixedReservationByPool, "fixedReservationByPool");
  validateRecord(spec.policy.maxInFlightQuantumByPool, "maxInFlightQuantumByPool");
  if (spec.policy.maxInFlightQuantum !== undefined) {
    die("maxInFlightQuantum was replaced by maxInFlightQuantumByPool");
  }

  const resources = new Map();
  for (const resource of spec.resources) {
    if (!resource.id || resources.has(resource.id) || !KINDS.has(resource.kind) || !posint(resource.capacity)) {
      die(`invalid resource ${resource.id ?? "?"}`);
    }
    if (resource.costPerUnitSecond !== undefined && !nonneg(resource.costPerUnitSecond)) {
      die(`invalid cost for ${resource.id}`);
    }
    resources.set(resource.id, resource);
  }

  for (const [poolId, reservation] of Object.entries(spec.policy.fixedReservationByPool ?? {})) {
    const resource = resources.get(poolId);
    if (!resource) die(`fixedReservationByPool: unknown resource pool ${poolId}`);
    if (!CLASSICAL.has(resource.kind)) die(`fixedReservationByPool: ${poolId} is not a CPU/GPU pool`);
    if (!posint(reservation) || reservation > resource.capacity) {
      die(`fixedReservationByPool.${poolId} must be a positive integer <= pool capacity`);
    }
  }

  for (const [poolId, limit] of Object.entries(spec.policy.maxInFlightQuantumByPool ?? {})) {
    const resource = resources.get(poolId);
    if (!resource) die(`maxInFlightQuantumByPool: unknown resource pool ${poolId}`);
    if (resource.kind !== "qpu") die(`maxInFlightQuantumByPool: ${poolId} is not a QPU pool`);
    if (!posint(limit)) die(`maxInFlightQuantumByPool.${poolId} must be a positive integer`);
  }

  const tasks = new Map();
  const order = new Map();
  spec.tasks.forEach((task, index) => {
    const resource = resources.get(task.resourcePoolId);
    if (!task.id || tasks.has(task.id)) die(`invalid task ${task.id ?? "?"}`);
    if (!resource) die(`task ${task.id}: unknown resource pool ${task.resourcePoolId}`);
    if (!posint(task.resourceCount)) die(`task ${task.id}: resourceCount must be a positive integer`);
    if (task.resourceCount > resource.capacity) {
      die(`task ${task.id}: resourceCount exceeds pool ${resource.id} capacity`);
    }
    if (task.resourceCount > schedulingCapacity(spec, resource)) {
      die(`task ${task.id}: resourceCount exceeds fixed reservation for pool ${resource.id}`);
    }
    duration(task.serviceTime, `task ${task.id}.serviceTime`);
    tasks.set(task.id, task);
    order.set(task.id, index);
  });

  const incoming = new Map(spec.tasks.map((task) => [task.id, []]));
  const outgoing = new Map(spec.tasks.map((task) => [task.id, []]));
  const dependencyIds = new Set();

  for (const dep of spec.dependencies) {
    if (!dep.id || dependencyIds.has(dep.id) || !tasks.has(dep.sourceTaskId) ||
        !tasks.has(dep.targetTaskId) || dep.sourceTaskId === dep.targetTaskId) {
      die(`invalid dependency ${dep.id ?? "?"}`);
    }
    transferTime(dep);
    dependencyIds.add(dep.id);
    incoming.get(dep.targetTaskId).push(dep);
    outgoing.get(dep.sourceTaskId).push(dep);
  }

  const indegree = new Map(spec.tasks.map((task) => [task.id, incoming.get(task.id).length]));
  const queue = spec.tasks.filter((task) => indegree.get(task.id) === 0).map((task) => task.id);
  let seen = 0;
  while (queue.length) {
    queue.sort((a, b) => order.get(a) - order.get(b));
    const id = queue.shift();
    seen += 1;
    for (const dep of outgoing.get(id)) {
      const targetId = dep.targetTaskId;
      indegree.set(targetId, indegree.get(targetId) - 1);
      if (indegree.get(targetId) === 0) queue.push(targetId);
    }
  }
  if (seen !== spec.tasks.length) die("workflow dependencies must form a DAG");

  return { resources, tasks, order, incoming, outgoing };
}

export function validateWorkflowSpec(spec) {
  prepareWorkflowSpec(spec);
  return true;
}

class Events {
  constructor() {
    this.items = [];
    this.seq = 0;
  }
  push(time, type, data) {
    this.items.push({ time, type, data, seq: this.seq++ });
  }
  nextTime() {
    return this.items.length ? Math.min(...this.items.map((event) => event.time)) : null;
  }
  hasTime(time) {
    return this.items.some((event) => event.time === time);
  }
  takeAt(time) {
    const selected = this.items.filter((event) => event.time === time);
    this.items = this.items.filter((event) => event.time !== time);
    return selected.sort(
      (a, b) => (PRI[a.type] ?? 9) - (PRI[b.type] ?? 9) || a.seq - b.seq
    );
  }
}

function resourceAccounting(spec, runs, makespanS) {
  const intervals = [];
  const metric = {
    utilizationByPool: {},
    activeResourceSecondsByPool: {},
    allocatedResourceSecondsByPool: {},
    idleAllocatedResourceSecondsByPool: {},
    releasedResourceSecondsByPool: {},
    costByPool: {},
  };

  for (const resource of spec.resources) {
    const resourceRuns = runs.filter((run) => run.resourcePoolId === resource.id);
    resourceRuns.forEach((run) => intervals.push({ ...run, state: "active" }));

    let active = resourceRuns.reduce(
      (sum, run) => sum + (run.endS - run.startS) * run.units,
      0
    );
    let idleAllocated = 0;
    let released = 0;
    const reservation =
      CLASSICAL.has(resource.kind) && spec.policy.allocation === "fixed"
        ? fixedReservation(spec, resource)
        : 0;
    const maxActive = schedulingCapacity(spec, resource);

    const cuts = [...new Set([
      0,
      makespanS,
      ...resourceRuns.flatMap((run) => [run.startS, run.endS]),
    ])].sort((a, b) => a - b);

    for (let i = 0; i < cuts.length - 1; i += 1) {
      const startS = cuts[i];
      const endS = cuts[i + 1];
      if (endS <= startS) continue;
      const probe = startS + (endS - startS) / 2;
      const used = resourceRuns
        .filter((run) => run.startS <= probe && probe < run.endS)
        .reduce((sum, run) => sum + run.units, 0);

      if (used > maxActive) die(`capacity exceeded: ${resource.id}`);

      if (reservation > 0) {
        const idleUnits = reservation - used;
        const releasedUnits = resource.capacity - reservation;
        if (idleUnits > 0) {
          intervals.push({
            resourcePoolId: resource.id,
            startS,
            endS,
            state: "allocated-idle",
            units: idleUnits,
          });
          idleAllocated += (endS - startS) * idleUnits;
        }
        if (releasedUnits > 0) {
          intervals.push({
            resourcePoolId: resource.id,
            startS,
            endS,
            state: "released",
            units: releasedUnits,
          });
          released += (endS - startS) * releasedUnits;
        }
      } else {
        const releasedUnits = resource.capacity - used;
        if (releasedUnits > 0) {
          intervals.push({
            resourcePoolId: resource.id,
            startS,
            endS,
            state: "released",
            units: releasedUnits,
          });
          released += (endS - startS) * releasedUnits;
        }
      }
    }

    const allocated = active + idleAllocated;
    const poolCapacitySeconds = resource.capacity * makespanS;
    metric.utilizationByPool[resource.id] =
      poolCapacitySeconds > 0 ? active / poolCapacitySeconds : 0;
    metric.activeResourceSecondsByPool[resource.id] = active;
    metric.allocatedResourceSecondsByPool[resource.id] = allocated;
    metric.idleAllocatedResourceSecondsByPool[resource.id] = idleAllocated;
    metric.releasedResourceSecondsByPool[resource.id] = released;
    metric.costByPool[resource.id] =
      allocated * (resource.costPerUnitSecond ?? 0);
  }

  intervals.sort(
    (a, b) =>
      a.startS - b.startS ||
      a.endS - b.endS ||
      a.resourcePoolId.localeCompare(b.resourcePoolId) ||
      a.state.localeCompare(b.state)
  );
  return { intervals, metric };
}

export function simulateWorkflow(spec) {
  const { resources, order, incoming, outgoing } = prepareWorkflowSpec(spec);
  const eventQueue = new Events();
  const events = [];
  const queueSeries = [];
  const runs = [];
  const taskIntervals = [];
  const queueWait = Object.fromEntries(spec.resources.map((resource) => [resource.id, 0]));
  const admissionWait = Object.fromEntries(spec.resources.map((resource) => [resource.id, 0]));

  const state = new Map(
    spec.tasks.map((task) => [
      task.id,
      {
        task,
        status: "pending",
        remainingDependencies: incoming.get(task.id).length,
        readyAt: null,
        queuedAt: null,
        startedAt: null,
        endedAt: null,
        throttled: false,
      },
    ])
  );

  const pools = new Map(
    spec.resources.map((resource) => [
      resource.id,
      { resource, used: 0, queue: [], depth: 0, qpuInFlight: 0 },
    ])
  );
  spec.resources.forEach((resource) => {
    queueSeries.push({ simTimeS: 0, resourcePoolId: resource.id, depth: 0 });
  });

  let eventSeq = 0;
  const emit = (simTimeS, type, fields = {}) => {
    events.push({ seq: eventSeq++, simTimeS, type, ...fields });
  };
  const setDepth = (pool, simTimeS, depth) => {
    if (depth < 0) die("negative queue depth");
    if (pool.depth !== depth) {
      pool.depth = depth;
      queueSeries.push({ simTimeS, resourcePoolId: pool.resource.id, depth });
    }
  };
  const markReady = (taskState, simTimeS) => {
    if (taskState.status !== "pending") return;
    taskState.status = "ready";
    taskState.readyAt = simTimeS;
    emit(simTimeS, "task_ready", {
      taskId: taskState.task.id,
      resourcePoolId: taskState.task.resourcePoolId,
    });
  };
  const readyOrder = (a, b) =>
    a.readyAt - b.readyAt || order.get(a.task.id) - order.get(b.task.id);
  const queuedOrder = (a, b) =>
    a.queuedAt - b.queuedAt || order.get(a.task.id) - order.get(b.task.id);

  function startPool(pool, simTimeS) {
    const capacity = schedulingCapacity(spec, pool.resource);
    while (pool.queue.length) {
      const taskState = pool.queue[0];
      const task = taskState.task;
      if (task.resourceCount > capacity - pool.used) break;

      pool.queue.shift();
      setDepth(pool, simTimeS, pool.queue.length);
      taskState.status = "running";
      taskState.startedAt = simTimeS;
      pool.used += task.resourceCount;

      admissionWait[pool.resource.id] += taskState.queuedAt - taskState.readyAt;
      queueWait[pool.resource.id] += taskState.startedAt - taskState.queuedAt;

      if (taskState.queuedAt > taskState.readyAt) {
        taskIntervals.push({
          taskId: task.id,
          startS: taskState.readyAt,
          endS: taskState.queuedAt,
          state: "ready",
        });
      }
      if (taskState.startedAt > taskState.queuedAt) {
        taskIntervals.push({
          taskId: task.id,
          startS: taskState.queuedAt,
          endS: taskState.startedAt,
          state: "queued",
        });
      }

      const serviceTimeS = duration(task.serviceTime, `task ${task.id}.serviceTime`);
      const endS = simTimeS + serviceTimeS;
      emit(simTimeS, "task_started", {
        taskId: task.id,
        resourcePoolId: pool.resource.id,
        metadata: { resourceCount: task.resourceCount, serviceTimeS },
      });

      if (endS > simTimeS) {
        runs.push({
          taskId: task.id,
          resourcePoolId: pool.resource.id,
          startS: simTimeS,
          endS,
          units: task.resourceCount,
        });
        taskIntervals.push({
          taskId: task.id,
          startS: simTimeS,
          endS,
          state: "running",
        });
      }
      eventQueue.push(endS, "complete", { taskId: task.id });
    }
  }

  function startQueued(simTimeS) {
    for (const resource of spec.resources) {
      startPool(pools.get(resource.id), simTimeS);
    }
  }

  function admitReady(simTimeS) {
    const readyStates = [...state.values()]
      .filter((taskState) => taskState.status === "ready")
      .sort(readyOrder);

    for (const taskState of readyStates) {
      const resource = resources.get(taskState.task.resourcePoolId);
      const pool = pools.get(resource.id);
      const limit = resource.kind === "qpu"
        ? qpuInFlightLimit(spec, resource.id)
        : Infinity;

      if (resource.kind === "qpu" && pool.qpuInFlight >= limit) {
        if (!taskState.throttled) {
          emit(simTimeS, "task_throttled", {
            taskId: taskState.task.id,
            resourcePoolId: resource.id,
            metadata: {
              reason: "maxInFlightQuantumByPool",
              maxInFlightQuantum: limit,
            },
          });
          taskState.throttled = true;
        }
        continue;
      }

      taskState.status = "queued";
      taskState.queuedAt = simTimeS;
      pool.queue.push(taskState);
      pool.queue.sort(queuedOrder);
      if (resource.kind === "qpu") pool.qpuInFlight += 1;
      setDepth(pool, simTimeS, pool.queue.length);

      emit(simTimeS, "task_queued", {
        taskId: taskState.task.id,
        resourcePoolId: resource.id,
        metadata: {
          queueDepth: pool.queue.length,
          qpuInFlight: resource.kind === "qpu" ? pool.qpuInFlight : undefined,
        },
      });

      startPool(pool, simTimeS);
    }
  }

  function settle(simTimeS) {
    startQueued(simTimeS);
    admitReady(simTimeS);
  }

  function releaseDependency(simTimeS, dep, emitCommunicationComplete) {
    if (emitCommunicationComplete) {
      emit(simTimeS, "communication_completed", {
        taskId: dep.targetTaskId,
        metadata: {
          dependencyId: dep.id,
          targetTaskId: dep.targetTaskId,
        },
      });
    }

    const targetState = state.get(dep.targetTaskId);
    targetState.remainingDependencies -= 1;
    if (targetState.remainingDependencies === 0) markReady(targetState, simTimeS);
  }

  function completeTask(simTimeS, taskId) {
    const taskState = state.get(taskId);
    const task = taskState.task;
    const resource = resources.get(task.resourcePoolId);
    const pool = pools.get(resource.id);
    if (taskState.status !== "running") die(`invalid completion ${taskId}`);

    taskState.status = "complete";
    taskState.endedAt = simTimeS;
    pool.used -= task.resourceCount;
    if (resource.kind === "qpu") pool.qpuInFlight -= 1;

    emit(simTimeS, "task_completed", {
      taskId,
      resourcePoolId: resource.id,
      metadata: {
        qpuInFlight: resource.kind === "qpu" ? pool.qpuInFlight : undefined,
      },
    });

    for (const dep of outgoing.get(taskId)) {
      const communicationS = transferTime(dep);
      if (communicationS === 0) {
        releaseDependency(simTimeS, dep, false);
        continue;
      }

      emit(simTimeS, "communication_started", {
        taskId,
        metadata: {
          dependencyId: dep.id,
          sourceTaskId: taskId,
          targetTaskId: dep.targetTaskId,
          durationS: communicationS,
        },
      });
      eventQueue.push(simTimeS + communicationS, "transferComplete", { dep });
    }
  }

  function completeTransfer(simTimeS, dep) {
    releaseDependency(simTimeS, dep, true);
  }

  function causalClosure(simTimeS) {
    while (eventQueue.hasTime(simTimeS)) {
      for (const event of eventQueue.takeAt(simTimeS)) {
        if (event.type === "complete") {
          completeTask(simTimeS, event.data.taskId);
        } else {
          completeTransfer(simTimeS, event.data.dep);
        }
      }
    }
  }

  for (const taskState of state.values()) {
    if (taskState.remainingDependencies === 0) markReady(taskState, 0);
  }
  settle(0);

  while (true) {
    const simTimeS = eventQueue.nextTime();
    if (simTimeS === null) break;

    do {
      causalClosure(simTimeS);
      settle(simTimeS);
    } while (eventQueue.hasTime(simTimeS));
  }

  const incomplete = [...state.values()].filter(
    (taskState) => taskState.status !== "complete"
  );
  if (incomplete.length) {
    die(`simulation stalled: ${incomplete.map((taskState) => taskState.task.id).join(",")}`);
  }

  const makespanS = Math.max(
    ...[...state.values()].map((taskState) => taskState.endedAt ?? 0)
  );
  const aggregateCommunicationSeconds = spec.dependencies
    .map(transferTime)
    .filter((seconds) => seconds > 0)
    .reduce((sum, seconds) => sum + seconds, 0);

  const { intervals: resourceIntervals, metric } =
    resourceAccounting(spec, runs, makespanS);
  const totalCost = Object.values(metric.costByPool).reduce(
    (sum, cost) => sum + cost,
    0
  );

  taskIntervals.sort(
    (a, b) =>
      a.startS - b.startS ||
      a.endS - b.endS ||
      order.get(a.taskId) - order.get(b.taskId) ||
      a.state.localeCompare(b.state)
  );

  return {
    workflowId: spec.id,
    events,
    resourceIntervals,
    taskIntervals,
    queueSeries,
    metrics: {
      makespanS,
      ...metric,
      queueWaitSecondsByPool: queueWait,
      admissionWaitSecondsByPool: admissionWait,
      aggregateCommunicationSeconds,
      totalCost,
    },
    assumptions: [...(spec.assumptions ?? [])],
  };
}
