const RESOURCE_KINDS = new Set(["cpu", "gpu", "qpu"]);
const PROVENANCE_KINDS = new Set(["synthetic", "user-entered", "measured", "fitted"]);

const fail = (message) => {
  throw new Error(message);
};

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const positiveInteger = (value) => Number.isInteger(value) && value > 0;
const nonnegativeFinite = (value) => Number.isFinite(value) && value >= 0;

function clone(value) {
  return structuredClone(value);
}

function validateProvenance(provenance, label) {
  if (!isObject(provenance) || !PROVENANCE_KINDS.has(provenance.kind)) {
    fail(`${label}.provenance.kind must be synthetic, user-entered, measured, or fitted`);
  }
}

function validateProvenanced(entry, label) {
  if (!isObject(entry) || !("value" in entry)) fail(`${label} must contain value + provenance`);
  validateProvenance(entry.provenance, label);
}

function taskInstanceId(taskId, repeat, index) {
  return repeat ? `${taskId}@${repeat.id}:${index + 1}` : taskId;
}

function dependencyInstanceId(depId, repeat, index) {
  return repeat ? `${depId}@${repeat.id}:${index + 1}` : depId;
}

function compileAssumptions(design, runConfiguration, systemProfile) {
  return [
    ...(design.assumptions ?? []),
    ...(runConfiguration.assumptions ?? []),
    ...(systemProfile.assumptions ?? []),
    `Compiled from WorkflowDesign ${design.id}, RunConfiguration ${runConfiguration.id}, SystemProfile ${systemProfile.id}.`,
    "Resolved WorkflowSpec contains deterministic constants only; exact input provenance is retained in RunRecord.",
  ];
}

function prepareDesign(design) {
  if (!isObject(design) || !design.id || !design.name) {
    fail("WorkflowDesign requires id and name");
  }
  if (!Array.isArray(design.tasks) || design.tasks.length === 0) {
    fail("WorkflowDesign requires tasks");
  }
  if (!Array.isArray(design.dependencies)) {
    fail("WorkflowDesign.dependencies must be an array");
  }

  const tasks = new Map();
  const taskOrder = new Map();
  design.tasks.forEach((task, index) => {
    if (!task?.id || tasks.has(task.id)) fail(`invalid or duplicate design task ${task?.id ?? "?"}`);
    if (!task.label) fail(`design task ${task.id}: label is required`);
    if (task.actorGroupIds !== undefined && !Array.isArray(task.actorGroupIds)) {
      fail(`design task ${task.id}: actorGroupIds must be an array`);
    }
    tasks.set(task.id, task);
    taskOrder.set(task.id, index);
  });

  const actorGroups = new Map();
  for (const group of design.actorGroups ?? []) {
    if (!group?.id || actorGroups.has(group.id)) fail(`invalid or duplicate actor group ${group?.id ?? "?"}`);
    actorGroups.set(group.id, group);
  }
  for (const task of tasks.values()) {
    for (const actorGroupId of task.actorGroupIds ?? []) {
      if (!actorGroups.has(actorGroupId)) {
        fail(`design task ${task.id}: unknown actor group ${actorGroupId}`);
      }
    }
  }

  const dependencies = new Map();
  for (const dep of design.dependencies) {
    if (!dep?.id || dependencies.has(dep.id)) fail(`invalid or duplicate design dependency ${dep?.id ?? "?"}`);
    if (!tasks.has(dep.sourceTaskId) || !tasks.has(dep.targetTaskId) || dep.sourceTaskId === dep.targetTaskId) {
      fail(`design dependency ${dep.id}: invalid task endpoints`);
    }
    dependencies.set(dep.id, dep);
  }

  const repeatByTask = new Map();
  const repeats = [];
  for (const repeat of design.repeatBlocks ?? []) {
    if (!repeat?.id || repeats.some((candidate) => candidate.id === repeat.id)) {
      fail(`invalid or duplicate repeat block ${repeat?.id ?? "?"}`);
    }
    if (!positiveInteger(repeat.count)) fail(`repeat block ${repeat.id}: count must be a positive integer`);
    if (!Array.isArray(repeat.taskIds) || repeat.taskIds.length === 0) {
      fail(`repeat block ${repeat.id}: taskIds must be non-empty`);
    }
    const taskIds = new Set();
    for (const taskId of repeat.taskIds) {
      if (!tasks.has(taskId)) fail(`repeat block ${repeat.id}: unknown task ${taskId}`);
      if (taskIds.has(taskId)) fail(`repeat block ${repeat.id}: duplicate task ${taskId}`);
      if (repeatByTask.has(taskId)) fail(`design task ${taskId} belongs to more than one repeat block`);
      taskIds.add(taskId);
      repeatByTask.set(taskId, repeat);
    }
    for (const carry of repeat.carryDependencies ?? []) {
      if (!carry?.id || !taskIds.has(carry.sourceTaskId) || !taskIds.has(carry.targetTaskId)) {
        fail(`repeat block ${repeat.id}: carry dependency must reference tasks in the same block`);
      }
    }
    repeats.push(repeat);
  }

  for (const dep of dependencies.values()) {
    const sourceRepeat = repeatByTask.get(dep.sourceTaskId);
    const targetRepeat = repeatByTask.get(dep.targetTaskId);
    if (sourceRepeat && targetRepeat && sourceRepeat.id !== targetRepeat.id) {
      fail(`dependency ${dep.id}: cross-repeat-block edges are not supported in design-layer v1`);
    }
  }

  return { tasks, taskOrder, dependencies, repeatByTask, repeats };
}

function validateRunConfiguration(runConfiguration, prepared, design) {
  if (!isObject(runConfiguration) || !runConfiguration.id) fail("RunConfiguration requires id");
  if (!Array.isArray(runConfiguration.resources) || runConfiguration.resources.length === 0) {
    fail("RunConfiguration requires resources");
  }
  if (!["fixed", "release-aware"].includes(runConfiguration.policy?.allocation)) {
    fail("RunConfiguration.policy.allocation must be fixed or release-aware");
  }

  const resources = new Map();
  for (const resource of runConfiguration.resources) {
    if (!resource?.id || resources.has(resource.id) || !RESOURCE_KINDS.has(resource.kind) ||
        !positiveInteger(resource.capacity)) {
      fail(`invalid run resource ${resource?.id ?? "?"}`);
    }
    resources.set(resource.id, resource);
  }

  if (!isObject(runConfiguration.taskResources)) {
    fail("RunConfiguration.taskResources must be keyed by stable design task id");
  }
  for (const taskId of prepared.tasks.keys()) {
    const binding = runConfiguration.taskResources[taskId];
    if (!binding) fail(`RunConfiguration missing taskResources.${taskId}`);
    const resource = resources.get(binding.resourcePoolId);
    if (!resource) fail(`taskResources.${taskId}: unknown resource pool ${binding.resourcePoolId}`);
    if (!positiveInteger(binding.resourceCount) || binding.resourceCount > resource.capacity) {
      fail(`taskResources.${taskId}: invalid resourceCount`);
    }
  }

  for (const taskId of Object.keys(runConfiguration.taskResources)) {
    if (!prepared.tasks.has(taskId)) fail(`taskResources: unknown design task ${taskId}`);
  }

  for (const [poolId, reservation] of Object.entries(runConfiguration.policy.fixedReservationByPool ?? {})) {
    const resource = resources.get(poolId);
    if (!resource) fail(`fixedReservationByPool: unknown pool ${poolId}`);
    if (!["cpu", "gpu"].includes(resource.kind)) fail(`fixedReservationByPool: ${poolId} is not CPU/GPU`);
    if (!positiveInteger(reservation) || reservation > resource.capacity) {
      fail(`fixedReservationByPool.${poolId}: invalid reservation`);
    }
  }

  if (runConfiguration.policy.allocation === "fixed") {
    for (const [taskId, binding] of Object.entries(runConfiguration.taskResources)) {
      const resource = resources.get(binding.resourcePoolId);
      if (!["cpu", "gpu"].includes(resource.kind)) continue;
      const reservation =
        runConfiguration.policy.fixedReservationByPool?.[resource.id] ??
        resource.capacity;
      if (binding.resourceCount > reservation) {
        fail(`taskResources.${taskId}: resourceCount exceeds fixed reservation for pool ${resource.id}`);
      }
    }
  }

  for (const [poolId, limit] of Object.entries(runConfiguration.policy.maxInFlightQuantumByPool ?? {})) {
    const resource = resources.get(poolId);
    if (!resource) fail(`maxInFlightQuantumByPool: unknown pool ${poolId}`);
    if (resource.kind !== "qpu") fail(`maxInFlightQuantumByPool: ${poolId} is not QPU`);
    if (!positiveInteger(limit)) fail(`maxInFlightQuantumByPool.${poolId}: invalid limit`);
  }

  for (const [poolId, override] of Object.entries(runConfiguration.costOverridesByPool ?? {})) {
    if (!resources.has(poolId)) fail(`costOverridesByPool: unknown pool ${poolId}`);
    validateProvenanced(override, `costOverridesByPool.${poolId}`);
    if (!nonnegativeFinite(override.value)) fail(`costOverridesByPool.${poolId}.value must be >= 0`);
  }

  for (const actorGroupId of Object.keys(runConfiguration.actorGroupCounts ?? {})) {
    if (!(design.actorGroups ?? []).some((group) => group.id === actorGroupId)) {
      fail(`actorGroupCounts: unknown actor group ${actorGroupId}`);
    }
    if (!positiveInteger(runConfiguration.actorGroupCounts[actorGroupId])) {
      fail(`actorGroupCounts.${actorGroupId} must be a positive integer`);
    }
  }

  return resources;
}

function validateSystemProfile(systemProfile) {
  if (!isObject(systemProfile) || !systemProfile.id) fail("SystemProfile requires id");
  if (!isObject(systemProfile.taskServiceTimes)) fail("SystemProfile.taskServiceTimes is required");
  if (systemProfile.dependencyCommunication !== undefined && !isObject(systemProfile.dependencyCommunication)) {
    fail("SystemProfile.dependencyCommunication must be an object");
  }
  if (systemProfile.costPerUnitSecond !== undefined && !isObject(systemProfile.costPerUnitSecond)) {
    fail("SystemProfile.costPerUnitSecond must be an object");
  }

  for (const [key, entry] of Object.entries(systemProfile.taskServiceTimes)) {
    validateProvenanced(entry, `taskServiceTimes.${key}`);
    if (!isObject(entry.value) || entry.value.kind !== "constant" || !nonnegativeFinite(entry.value.seconds)) {
      fail(`taskServiceTimes.${key}.value must be constant seconds >= 0`);
    }
  }

  for (const [key, entry] of Object.entries(systemProfile.dependencyCommunication ?? {})) {
    validateProvenanced(entry, `dependencyCommunication.${key}`);
    const value = entry.value;
    if (!isObject(value)) fail(`dependencyCommunication.${key}.value must be an object`);
    const latency = value.fixedLatencyS ?? 0;
    const bytes = value.dataBytes ?? 0;
    if (!nonnegativeFinite(latency) || !nonnegativeFinite(bytes)) {
      fail(`dependencyCommunication.${key}: latency/data must be >= 0`);
    }
    if (bytes > 0 && (!Number.isFinite(value.bandwidthBytesPerS) || value.bandwidthBytesPerS <= 0)) {
      fail(`dependencyCommunication.${key}: bandwidthBytesPerS must be > 0 when dataBytes > 0`);
    }
  }

  for (const [key, entry] of Object.entries(systemProfile.costPerUnitSecond ?? {})) {
    validateProvenanced(entry, `costPerUnitSecond.${key}`);
    if (!nonnegativeFinite(entry.value)) fail(`costPerUnitSecond.${key}.value must be >= 0`);
  }
}

function resolvedCost(resource, runConfiguration, systemProfile) {
  const override = runConfiguration.costOverridesByPool?.[resource.id];
  if (override) return override;

  const key = resource.costKey ?? resource.id;
  return systemProfile.costPerUnitSecond?.[key];
}

function expandTasks(design, prepared) {
  const expanded = [];
  const emittedRepeatBlocks = new Set();

  for (const task of design.tasks) {
    const repeat = prepared.repeatByTask.get(task.id);
    if (!repeat) {
      expanded.push({
        designTask: task,
        id: task.id,
        repeat: null,
        repeatIndex: null,
      });
      continue;
    }

    if (emittedRepeatBlocks.has(repeat.id)) continue;
    emittedRepeatBlocks.add(repeat.id);

    const blockTasks = design.tasks.filter(
      (candidate) => prepared.repeatByTask.get(candidate.id)?.id === repeat.id
    );

    for (let index = 0; index < repeat.count; index += 1) {
      for (const blockTask of blockTasks) {
        expanded.push({
          designTask: blockTask,
          id: taskInstanceId(blockTask.id, repeat, index),
          repeat,
          repeatIndex: index,
        });
      }
    }
  }

  return expanded;
}

function expandedDependencyEndpoints(dep, prepared) {
  const sourceRepeat = prepared.repeatByTask.get(dep.sourceTaskId);
  const targetRepeat = prepared.repeatByTask.get(dep.targetTaskId);

  if (!sourceRepeat && !targetRepeat) {
    return [{ id: dep.id, sourceTaskId: dep.sourceTaskId, targetTaskId: dep.targetTaskId }];
  }

  if (sourceRepeat && targetRepeat) {
    return Array.from({ length: sourceRepeat.count }, (_, index) => ({
      id: dependencyInstanceId(dep.id, sourceRepeat, index),
      sourceTaskId: taskInstanceId(dep.sourceTaskId, sourceRepeat, index),
      targetTaskId: taskInstanceId(dep.targetTaskId, targetRepeat, index),
    }));
  }

  if (sourceRepeat) {
    const last = sourceRepeat.count - 1;
    return [{
      id: dep.id,
      sourceTaskId: taskInstanceId(dep.sourceTaskId, sourceRepeat, last),
      targetTaskId: dep.targetTaskId,
    }];
  }

  return [{
    id: dep.id,
    sourceTaskId: dep.sourceTaskId,
    targetTaskId: taskInstanceId(dep.targetTaskId, targetRepeat, 0),
  }];
}

function compileDependencies(design, prepared, systemProfile) {
  const compiled = [];

  for (const dep of design.dependencies) {
    const communicationKey = dep.communicationKey ?? dep.id;
    const assumption = systemProfile.dependencyCommunication?.[communicationKey];
    const resolved = assumption ? clone(assumption.value) : {};

    for (const endpoints of expandedDependencyEndpoints(dep, prepared)) {
      compiled.push({ ...endpoints, ...resolved });
    }
  }

  for (const repeat of prepared.repeats) {
    for (const carry of repeat.carryDependencies ?? []) {
      const communicationKey = carry.communicationKey ?? carry.id;
      const assumption = systemProfile.dependencyCommunication?.[communicationKey];
      const resolved = assumption ? clone(assumption.value) : {};

      for (let index = 0; index < repeat.count - 1; index += 1) {
        compiled.push({
          id: `${repeat.id}:carry:${carry.id}:${index + 1}->${index + 2}`,
          sourceTaskId: taskInstanceId(carry.sourceTaskId, repeat, index),
          targetTaskId: taskInstanceId(carry.targetTaskId, repeat, index + 1),
          ...resolved,
        });
      }
    }
  }

  return compiled;
}

export function compileWorkflowDesign(design, runConfiguration, systemProfile) {
  const prepared = prepareDesign(design);
  const resources = validateRunConfiguration(runConfiguration, prepared, design);
  validateSystemProfile(systemProfile);

  const compiledResources = runConfiguration.resources.map((resource) => {
    const cost = resolvedCost(resource, runConfiguration, systemProfile);
    return {
      id: resource.id,
      kind: resource.kind,
      capacity: resource.capacity,
      ...(cost ? { costPerUnitSecond: cost.value } : {}),
    };
  });

  const compiledTasks = expandTasks(design, prepared).map((instance) => {
    const task = instance.designTask;
    const binding = runConfiguration.taskResources[task.id];
    const timingKey = task.timingKey ?? task.id;
    const timing = systemProfile.taskServiceTimes[timingKey];
    if (!timing) fail(`SystemProfile missing taskServiceTimes.${timingKey} for design task ${task.id}`);

    const metadata = {
      ...(task.metadata ?? {}),
      designTaskId: task.id,
      ...(task.semanticType ? { semanticType: task.semanticType } : {}),
      ...(task.actorGroupIds?.length ? { actorGroupIds: [...task.actorGroupIds] } : {}),
      ...(instance.repeat
        ? {
            repeatBlockId: instance.repeat.id,
            repeatIndex: instance.repeatIndex,
            repeatOrdinal: instance.repeatIndex + 1,
          }
        : {}),
      timingKey,
      timingProvenance: clone(timing.provenance),
    };

    return {
      id: instance.id,
      label: instance.repeat
        ? `${task.label} [${instance.repeatIndex + 1}/${instance.repeat.count}]`
        : task.label,
      resourcePoolId: binding.resourcePoolId,
      resourceCount: binding.resourceCount,
      serviceTime: clone(timing.value),
      metadata,
    };
  });

  const workflowId =
    runConfiguration.workflowId ??
    `${design.id}::${runConfiguration.id}::${systemProfile.id}`;

  return {
    id: workflowId,
    name: runConfiguration.name
      ? `${design.name} — ${runConfiguration.name}`
      : design.name,
    resources: compiledResources,
    tasks: compiledTasks,
    dependencies: compileDependencies(design, prepared, systemProfile),
    policy: clone(runConfiguration.policy),
    assumptions: compileAssumptions(design, runConfiguration, systemProfile),
  };
}

export function createRunRecord({
  id,
  design,
  runConfiguration,
  systemProfile,
  compiledWorkflowSpec,
  simulationResult,
  metadata,
}) {
  if (!id) fail("RunRecord requires id");
  if (simulationResult?.workflowId !== compiledWorkflowSpec?.id) {
    fail("RunRecord simulationResult.workflowId must match compiledWorkflowSpec.id");
  }

  return {
    schemaVersion: 1,
    id,
    design: clone(design),
    runConfiguration: clone(runConfiguration),
    systemProfile: clone(systemProfile),
    compiledWorkflowSpec: clone(compiledWorkflowSpec),
    simulationResult: clone(simulationResult),
    ...(metadata ? { metadata: clone(metadata) } : {}),
  };
}
