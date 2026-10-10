function qpuPoolIds(spec) {
  return new Set(
    spec.resources
      .filter((pool) => pool.kind === "qpu")
      .map((pool) => pool.id)
  );
}

function designTaskById(design) {
  return new Map(design.tasks.map((task) => [task.id, task]));
}

function compiledIdsByDesignTask(manifest) {
  const map = new Map();
  for (const [compiledTaskId, entry] of Object.entries(manifest?.tasks ?? {})) {
    const list = map.get(entry.designTaskId) ?? [];
    list.push(compiledTaskId);
    map.set(entry.designTaskId, list);
  }
  return map;
}

function countState(snapshot, ids, state) {
  return ids.filter((id) => snapshot.dag.taskStateById[id] === state).length;
}

export function deriveGenericProgress(
  design,
  manifest,
  spec,
  snapshot
) {
  const tasks = designTaskById(design);
  const compiled = compiledIdsByDesignTask(manifest);
  const qpuPools = qpuPoolIds(spec);

  let completeContinuations = 0;
  let runningContinuations = 0;
  let qpuRunning = 0;
  let qpuQueued = 0;
  let policyHeld = snapshot.causal.policyHeldQuantumTasks.length;

  for (const [designTaskId, ids] of compiled) {
    const task = tasks.get(designTaskId);
    const semantic = task?.semanticType ?? "";
    const bindingTask = ids
      .map((id) => spec.tasks.find((candidate) => candidate.id === id))
      .find(Boolean);
    const isQpu = bindingTask
      ? qpuPools.has(bindingTask.resourcePoolId)
      : semantic.includes("quantum");

    if (isQpu) {
      qpuRunning += countState(snapshot, ids, "running");
      qpuQueued += countState(snapshot, ids, "queued");
    }

    if (
      semantic.includes("continuation") ||
      semantic.includes("consumer") ||
      semantic.includes("collective")
    ) {
      completeContinuations += countState(snapshot, ids, "complete");
      runningContinuations += countState(snapshot, ids, "running");
    }
  }

  return Object.freeze({
    completeContinuations,
    runningContinuations,
    qpuRunning,
    qpuQueued,
    policyHeld
  });
}

export function deriveQpuSummary(spec, snapshot) {
  const qpuPools = spec.resources.filter((pool) => pool.kind === "qpu");
  const qpuIds = new Set(qpuPools.map((pool) => pool.id));
  const taskById = new Map(spec.tasks.map((task) => [task.id, task]));

  const running = Object.entries(snapshot.dag.taskStateById)
    .filter(([taskId, state]) => {
      if (state !== "running") return false;
      const task = taskById.get(taskId);
      return task ? qpuIds.has(task.resourcePoolId) : false;
    })
    .map(([taskId]) => taskId);

  const queued = qpuPools.flatMap(
    (pool) => snapshot.resources.qpuByPool[pool.id]?.queuedTaskIds ?? []
  );

  const policyHeld = snapshot.causal.policyHeldQuantumTasks.map(
    (task) => task.taskId
  );

  return Object.freeze({
    running: Object.freeze(running),
    queued: Object.freeze(queued),
    policyHeld: Object.freeze(policyHeld),
    capacity: qpuPools.reduce((sum, pool) => sum + pool.capacity, 0)
  });
}

export function hasGlobalSynchronizationSemantics(design) {
  return (design.actorWaits ?? []).some(
    (wait) => wait.reason === "global-synchronization"
  );
}

export function globalSynchronizationIsActive(actorProjection) {
  return actorProjection.groups.some(
    (group) => (group.blockedReasonCounts["global-synchronization"] ?? 0) > 0
  );
}
