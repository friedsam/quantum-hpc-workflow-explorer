const RESOURCE_KINDS = new Set(["cpu", "gpu", "qpu"]);
const PROVENANCE_KINDS = new Set(["synthetic", "user-entered", "measured", "fitted"]);
const ACTOR_WAIT_EVENTS = new Set(["ready", "started", "completed"]);
const ACTOR_WAIT_INSTANCES = new Set([
  "matching-instance",
  "any-instance",
  "all-instances",
]);
const ACTOR_WAIT_EVENT_TYPE = {
  ready: "task_ready",
  started: "task_started",
  completed: "task_completed",
};

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

function validateSchemaVersion(value, label) {
  if (!isObject(value) || value.schemaVersion !== 1) {
    fail(`${label}.schemaVersion must be 1`);
  }
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

function validateActorSelectionShape(selection, label) {
  if (!isObject(selection) ||
      !["all", "one-per-instance", "ordinals"].includes(selection.kind)) {
    fail(`${label} must be all, one-per-instance, or ordinals`);
  }

  if (selection.kind !== "ordinals") return;

  if (!Array.isArray(selection.actorOrdinals) ||
      selection.actorOrdinals.length === 0) {
    fail(`${label}.actorOrdinals must be a non-empty array`);
  }

  const seen = new Set();
  for (const ordinal of selection.actorOrdinals) {
    if (!positiveInteger(ordinal) || seen.has(ordinal)) {
      fail(`${label}.actorOrdinals must contain unique positive integers`);
    }
    seen.add(ordinal);
  }
}

function validateActorSelectionAgainstCount(selection, count, label) {
  validateActorSelectionShape(selection, label);
  if (selection.kind !== "ordinals") return;

  for (const ordinal of selection.actorOrdinals) {
    if (ordinal > count) {
      fail(`${label}: actor ordinal ${ordinal} exceeds actor count ${count}`);
    }
  }
}

function taskMultiplicity(task) {
  return task.multiplicity ?? 1;
}

function logicalTaskInstanceId(taskId, multiplicity, index) {
  return multiplicity === 1 ? taskId : `${taskId}#${index + 1}`;
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
  validateSchemaVersion(design, "WorkflowDesign");
  if (!design.id || !design.name) {
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
    if (!positiveInteger(taskMultiplicity(task))) {
      fail(`design task ${task.id}: multiplicity must be a positive integer`);
    }
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

    const participationGroups = new Set();
    for (const participation of task.actorParticipation ?? []) {
      if (!isObject(participation) || !actorGroups.has(participation.actorGroupId)) {
        fail(`design task ${task.id}: actorParticipation references unknown actor group ${participation?.actorGroupId ?? "?"}`);
      }
      if (participationGroups.has(participation.actorGroupId)) {
        fail(`design task ${task.id}: duplicate actorParticipation for group ${participation.actorGroupId}`);
      }
      participationGroups.add(participation.actorGroupId);

      if (!["working", "blocked"].includes(participation.stateDuringTask)) {
        fail(`design task ${task.id}: stateDuringTask must be working or blocked`);
      }
      validateActorSelectionShape(
        participation.selection,
        `design task ${task.id}.actorParticipation.selection`
      );
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
      if (taskMultiplicity(tasks.get(taskId)) !== 1) {
        fail(`design task ${taskId}: multiplicity > 1 inside repeatBlocks is outside Round 4A scope`);
      }
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

    const sourceMultiplicity = taskMultiplicity(tasks.get(dep.sourceTaskId));
    const targetMultiplicity = taskMultiplicity(tasks.get(dep.targetTaskId));
    if ((sourceRepeat || targetRepeat) &&
        (sourceMultiplicity !== 1 || targetMultiplicity !== 1)) {
      fail(`dependency ${dep.id}: repeat-block edges cannot also use logical multiplicity in Round 4A`);
    }

    if (dep.instanceMapping !== undefined &&
        !["pairwise", "all-to-all"].includes(dep.instanceMapping)) {
      fail(`dependency ${dep.id}: instanceMapping must be pairwise or all-to-all`);
    }

    if (!sourceRepeat && !targetRepeat) {
      const mapping = dep.instanceMapping ??
        (sourceMultiplicity === targetMultiplicity ? "pairwise" : null);
      if (!mapping) {
        fail(`dependency ${dep.id}: instanceMapping is required when task multiplicities differ`);
      }
      if (mapping === "pairwise" && sourceMultiplicity !== targetMultiplicity) {
        fail(`dependency ${dep.id}: pairwise mapping requires equal task multiplicities`);
      }
    }
  }

  const actorWaitIds = new Set();
  for (const wait of design.actorWaits ?? []) {
    if (!wait?.id || actorWaitIds.has(wait.id)) {
      fail(`invalid or duplicate actor wait ${wait?.id ?? "?"}`);
    }
    actorWaitIds.add(wait.id);

    if (!actorGroups.has(wait.actorGroupId)) {
      fail(`actor wait ${wait.id}: unknown actor group ${wait.actorGroupId}`);
    }
    validateActorSelectionShape(
      wait.selection,
      `actor wait ${wait.id}.selection`
    );
    if (typeof wait.reason !== "string" || wait.reason.length === 0) {
      fail(`actor wait ${wait.id}: reason is required`);
    }

    for (const [label, condition] of [
      ["activation", wait.activation],
      ["release", wait.release],
    ]) {
      if (!isObject(condition) ||
          condition.kind !== "task-event" ||
          !tasks.has(condition.taskId) ||
          !ACTOR_WAIT_EVENTS.has(condition.event) ||
          !ACTOR_WAIT_INSTANCES.has(condition.instance)) {
        fail(`actor wait ${wait.id}: invalid ${label} task-event condition`);
      }
      if (repeatByTask.has(condition.taskId)) {
        fail(`actor wait ${wait.id}: wait conditions on repeatBlocks are outside Round 4A scope`);
      }
    }

    if (wait.selection.kind === "one-per-instance") {
      if (wait.activation.instance !== "matching-instance" ||
          wait.release.instance !== "matching-instance") {
        fail(`actor wait ${wait.id}: one-per-instance waits require matching-instance activation/release`);
      }
      const activationMultiplicity =
        taskMultiplicity(tasks.get(wait.activation.taskId));
      const releaseMultiplicity =
        taskMultiplicity(tasks.get(wait.release.taskId));
      if (activationMultiplicity !== releaseMultiplicity) {
        fail(`actor wait ${wait.id}: matching-instance activation/release tasks must have equal multiplicity`);
      }
    } else if (
      wait.activation.instance === "matching-instance" ||
      wait.release.instance === "matching-instance"
    ) {
      fail(`actor wait ${wait.id}: non-one-per-instance waits require any-instance or all-instances conditions`);
    }
  }

  return { tasks, taskOrder, dependencies, actorGroups, repeatByTask, repeats };
}

function validateRunConfiguration(runConfiguration, prepared, design) {
  validateSchemaVersion(runConfiguration, "RunConfiguration");
  if (!runConfiguration.id) fail("RunConfiguration requires id");
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

  for (const group of design.actorGroups ?? []) {
    const count = runConfiguration.actorGroupCounts?.[group.id];
    if (!positiveInteger(count)) {
      fail(`RunConfiguration.actorGroupCounts.${group.id} is required for persistent actor group ${group.id}`);
    }
  }

  for (const task of prepared.tasks.values()) {
    for (const participation of task.actorParticipation ?? []) {
      const count = runConfiguration.actorGroupCounts[participation.actorGroupId];
      validateActorSelectionAgainstCount(
        participation.selection,
        count,
        `design task ${task.id}.actorParticipation.selection`
      );
      if (participation.selection.kind === "one-per-instance" &&
          taskMultiplicity(task) > count) {
        fail(`design task ${task.id}: multiplicity exceeds actor count for group ${participation.actorGroupId}`);
      }
    }
  }

  for (const wait of design.actorWaits ?? []) {
    const count = runConfiguration.actorGroupCounts[wait.actorGroupId];
    validateActorSelectionAgainstCount(
      wait.selection,
      count,
      `actor wait ${wait.id}.selection`
    );
    if (wait.selection.kind !== "one-per-instance") continue;
    const multiplicity =
      taskMultiplicity(prepared.tasks.get(wait.activation.taskId));
    if (multiplicity > count) {
      fail(`actor wait ${wait.id}: multiplicity exceeds actor count for group ${wait.actorGroupId}`);
    }
  }

  return resources;
}

function validateSystemProfile(systemProfile) {
  validateSchemaVersion(systemProfile, "SystemProfile");
  if (!systemProfile.id) fail("SystemProfile requires id");
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
      const multiplicity = taskMultiplicity(task);
      for (let logicalInstanceIndex = 0;
           logicalInstanceIndex < multiplicity;
           logicalInstanceIndex += 1) {
        expanded.push({
          designTask: task,
          id: logicalTaskInstanceId(
            task.id,
            multiplicity,
            logicalInstanceIndex
          ),
          logicalMultiplicity: multiplicity,
          logicalInstanceIndex,
          repeat: null,
          repeatIndex: null,
        });
      }
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
          logicalMultiplicity: 1,
          logicalInstanceIndex: 0,
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
    const sourceTask = prepared.tasks.get(dep.sourceTaskId);
    const targetTask = prepared.tasks.get(dep.targetTaskId);
    const sourceMultiplicity = taskMultiplicity(sourceTask);
    const targetMultiplicity = taskMultiplicity(targetTask);
    const mapping = dep.instanceMapping ??
      (sourceMultiplicity === targetMultiplicity ? "pairwise" : null);

    if (sourceMultiplicity === 1 && targetMultiplicity === 1) {
      return [{
        id: dep.id,
        sourceTaskId: dep.sourceTaskId,
        targetTaskId: dep.targetTaskId,
        sourceLogicalInstanceOrdinal: 1,
        targetLogicalInstanceOrdinal: 1,
      }];
    }

    if (mapping === "pairwise") {
      return Array.from({ length: sourceMultiplicity }, (_, index) => ({
        id: `${dep.id}#${index + 1}`,
        sourceTaskId: logicalTaskInstanceId(
          dep.sourceTaskId,
          sourceMultiplicity,
          index
        ),
        targetTaskId: logicalTaskInstanceId(
          dep.targetTaskId,
          targetMultiplicity,
          index
        ),
        sourceLogicalInstanceOrdinal: index + 1,
        targetLogicalInstanceOrdinal: index + 1,
      }));
    }

    const endpoints = [];
    for (let sourceIndex = 0;
         sourceIndex < sourceMultiplicity;
         sourceIndex += 1) {
      for (let targetIndex = 0;
           targetIndex < targetMultiplicity;
           targetIndex += 1) {
        endpoints.push({
          id: `${dep.id}#${sourceIndex + 1}->${targetIndex + 1}`,
          sourceTaskId: logicalTaskInstanceId(
            dep.sourceTaskId,
            sourceMultiplicity,
            sourceIndex
          ),
          targetTaskId: logicalTaskInstanceId(
            dep.targetTaskId,
            targetMultiplicity,
            targetIndex
          ),
          sourceLogicalInstanceOrdinal: sourceIndex + 1,
          targetLogicalInstanceOrdinal: targetIndex + 1,
        });
      }
    }
    return endpoints;
  }

  if (sourceRepeat && targetRepeat) {
    return Array.from({ length: sourceRepeat.count }, (_, index) => ({
      id: dependencyInstanceId(dep.id, sourceRepeat, index),
      sourceTaskId: taskInstanceId(dep.sourceTaskId, sourceRepeat, index),
      targetTaskId: taskInstanceId(dep.targetTaskId, targetRepeat, index),
      sourceRepeatOrdinal: index + 1,
      targetRepeatOrdinal: index + 1,
      sourceLogicalInstanceOrdinal: 1,
      targetLogicalInstanceOrdinal: 1,
    }));
  }

  if (sourceRepeat) {
    const last = sourceRepeat.count - 1;
    return [{
      id: dep.id,
      sourceTaskId: taskInstanceId(dep.sourceTaskId, sourceRepeat, last),
      targetTaskId: dep.targetTaskId,
      sourceRepeatOrdinal: sourceRepeat.count,
      sourceLogicalInstanceOrdinal: 1,
      targetLogicalInstanceOrdinal: 1,
    }];
  }

  return [{
    id: dep.id,
    sourceTaskId: dep.sourceTaskId,
    targetTaskId: taskInstanceId(dep.targetTaskId, targetRepeat, 0),
    targetRepeatOrdinal: 1,
    sourceLogicalInstanceOrdinal: 1,
    targetLogicalInstanceOrdinal: 1,
  }];
}

function compileDependencies(design, prepared, systemProfile) {
  const compiled = [];

  for (const dep of design.dependencies) {
    const communicationKey = dep.communicationKey ?? dep.id;
    const assumption = systemProfile.dependencyCommunication?.[communicationKey];
    const resolved = assumption ? clone(assumption.value) : {};

    for (const endpoint of expandedDependencyEndpoints(dep, prepared)) {
      compiled.push({
        id: endpoint.id,
        sourceTaskId: endpoint.sourceTaskId,
        targetTaskId: endpoint.targetTaskId,
        ...resolved,
      });
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

function resolvedCostManifest(resource, runConfiguration, systemProfile) {
  const costKey = resource.costKey ?? resource.id;
  const override = runConfiguration.costOverridesByPool?.[resource.id];
  if (override) {
    return {
      costKey,
      costSource: "run-override",
      costProvenance: clone(override.provenance),
    };
  }

  const profileEntry = systemProfile.costPerUnitSecond?.[costKey];
  if (profileEntry) {
    return {
      costKey,
      costSource: "system-profile",
      costProvenance: clone(profileEntry.provenance),
    };
  }

  return { costKey, costSource: "unset" };
}

function buildDependencyManifest(design, prepared, systemProfile) {
  const manifest = {};

  for (const dep of design.dependencies) {
    const sourceRepeat = prepared.repeatByTask.get(dep.sourceTaskId);
    const targetRepeat = prepared.repeatByTask.get(dep.targetTaskId);
    const endpoints = expandedDependencyEndpoints(dep, prepared);
    const communicationKey = dep.communicationKey ?? dep.id;
    const provenance =
      systemProfile.dependencyCommunication?.[communicationKey]?.provenance;

    endpoints.forEach((endpoint) => {
      manifest[endpoint.id] = {
        kind: "design-dependency",
        designDependencyId: dep.id,
        ...(sourceRepeat || targetRepeat
          ? { repeatBlockId: (sourceRepeat ?? targetRepeat).id }
          : {}),
        ...(endpoint.sourceRepeatOrdinal !== undefined
          ? { sourceRepeatOrdinal: endpoint.sourceRepeatOrdinal }
          : {}),
        ...(endpoint.targetRepeatOrdinal !== undefined
          ? { targetRepeatOrdinal: endpoint.targetRepeatOrdinal }
          : {}),
        ...(endpoint.sourceLogicalInstanceOrdinal !== undefined
          ? { sourceLogicalInstanceOrdinal: endpoint.sourceLogicalInstanceOrdinal }
          : {}),
        ...(endpoint.targetLogicalInstanceOrdinal !== undefined
          ? { targetLogicalInstanceOrdinal: endpoint.targetLogicalInstanceOrdinal }
          : {}),
        communicationKey,
        ...(provenance
          ? { communicationProvenance: clone(provenance) }
          : {}),
      };
    });
  }

  for (const repeat of prepared.repeats) {
    for (const carry of repeat.carryDependencies ?? []) {
      const communicationKey = carry.communicationKey ?? carry.id;
      const provenance =
        systemProfile.dependencyCommunication?.[communicationKey]?.provenance;

      for (let index = 0; index < repeat.count - 1; index += 1) {
        const id =
          `${repeat.id}:carry:${carry.id}:${index + 1}->${index + 2}`;
        manifest[id] = {
          kind: "repeat-carry",
          carryDependencyId: carry.id,
          repeatBlockId: repeat.id,
          sourceRepeatOrdinal: index + 1,
          targetRepeatOrdinal: index + 2,
          communicationKey,
          ...(provenance
            ? { communicationProvenance: clone(provenance) }
            : {}),
        };
      }
    }
  }

  return manifest;
}

function buildActorAssignments(task, instance, runConfiguration) {
  const assignments = [];

  for (const participation of task.actorParticipation ?? []) {
    const actorCount =
      runConfiguration.actorGroupCounts[participation.actorGroupId];

    if (participation.selection.kind === "all") {
      assignments.push({
        actorGroupId: participation.actorGroupId,
        selection: { kind: "all" },
        stateDuringTask: participation.stateDuringTask,
      });
      continue;
    }

    if (participation.selection.kind === "ordinals") {
      assignments.push({
        actorGroupId: participation.actorGroupId,
        selection: {
          kind: "ordinals",
          actorOrdinals: [...participation.selection.actorOrdinals],
        },
        stateDuringTask: participation.stateDuringTask,
      });
      continue;
    }

    const actorOrdinal = instance.logicalInstanceIndex + 1;
    if (actorOrdinal > actorCount) {
      fail(`design task ${task.id}: actor ordinal ${actorOrdinal} exceeds actor count ${actorCount} for group ${participation.actorGroupId}`);
    }

    assignments.push({
      actorGroupId: participation.actorGroupId,
      selection: { kind: "one", actorOrdinal },
      stateDuringTask: participation.stateDuringTask,
    });
  }

  return assignments;
}

function compiledInstancesForDesignTask(expandedTasks, designTaskId) {
  return expandedTasks.filter(
    (instance) => instance.designTask.id === designTaskId
  );
}

function compileActorWaitBoundary(condition, expandedTasks, logicalInstanceIndex) {
  const instances = compiledInstancesForDesignTask(
    expandedTasks,
    condition.taskId
  );
  if (instances.length === 0) {
    fail(`actor wait boundary: no compiled tasks for ${condition.taskId}`);
  }

  if (condition.instance === "matching-instance") {
    const instance = instances[logicalInstanceIndex];
    if (!instance) {
      fail(`actor wait boundary: missing logical instance ${logicalInstanceIndex + 1} for ${condition.taskId}`);
    }
    return {
      eventType: ACTOR_WAIT_EVENT_TYPE[condition.event],
      taskIds: [instance.id],
      quantifier: "all",
    };
  }

  return {
    eventType: ACTOR_WAIT_EVENT_TYPE[condition.event],
    taskIds: instances.map((instance) => instance.id),
    quantifier:
      condition.instance === "any-instance" ? "any" : "all",
  };
}

function buildActorWaitManifest(
  design,
  prepared,
  expandedTasks,
  runConfiguration
) {
  const manifest = {};

  for (const wait of design.actorWaits ?? []) {
    if (wait.selection.kind === "all" ||
        wait.selection.kind === "ordinals") {
      manifest[wait.id] = {
        designWaitId: wait.id,
        actorGroupId: wait.actorGroupId,
        selection:
          wait.selection.kind === "all"
            ? { kind: "all" }
            : {
                kind: "ordinals",
                actorOrdinals: [...wait.selection.actorOrdinals],
              },
        activation: compileActorWaitBoundary(
          wait.activation,
          expandedTasks,
          null
        ),
        release: compileActorWaitBoundary(
          wait.release,
          expandedTasks,
          null
        ),
        reason: wait.reason,
      };
      continue;
    }

    const multiplicity =
      taskMultiplicity(prepared.tasks.get(wait.activation.taskId));
    const actorCount =
      runConfiguration.actorGroupCounts[wait.actorGroupId];

    for (let index = 0; index < multiplicity; index += 1) {
      const actorOrdinal = index + 1;
      if (actorOrdinal > actorCount) {
        fail(`actor wait ${wait.id}: actor ordinal ${actorOrdinal} exceeds actor count ${actorCount}`);
      }
      manifest[`${wait.id}#${actorOrdinal}`] = {
        designWaitId: wait.id,
        actorGroupId: wait.actorGroupId,
        selection: { kind: "one", actorOrdinal },
        logicalInstanceOrdinal: actorOrdinal,
        activation: compileActorWaitBoundary(
          wait.activation,
          expandedTasks,
          index
        ),
        release: compileActorWaitBoundary(
          wait.release,
          expandedTasks,
          index
        ),
        reason: wait.reason,
      };
    }
  }

  return manifest;
}

function buildActorGroupManifest(design, runConfiguration) {
  const manifest = {};
  for (const group of design.actorGroups ?? []) {
    manifest[group.id] = {
      actorGroupId: group.id,
      label: group.label,
      ...(group.kind ? { kind: group.kind } : {}),
      count: runConfiguration.actorGroupCounts[group.id],
    };
  }
  return manifest;
}

export function compileWorkflowDesignDetailed(
  design,
  runConfiguration,
  systemProfile
) {
  const prepared = prepareDesign(design);
  validateRunConfiguration(runConfiguration, prepared, design);
  validateSystemProfile(systemProfile);

  const resourceManifest = {};
  const compiledResources = runConfiguration.resources.map((resource) => {
    const cost = resolvedCost(resource, runConfiguration, systemProfile);
    const costManifest = resolvedCostManifest(
      resource,
      runConfiguration,
      systemProfile
    );
    resourceManifest[resource.id] = {
      runResourceId: resource.id,
      ...costManifest,
    };

    return {
      id: resource.id,
      kind: resource.kind,
      capacity: resource.capacity,
      ...(cost ? { costPerUnitSecond: cost.value } : {}),
    };
  });

  const expandedTasks = expandTasks(design, prepared);
  const taskManifest = {};
  const compiledTasks = expandedTasks.map((instance) => {
    const task = instance.designTask;
    const binding = runConfiguration.taskResources[task.id];
    const timingKey = task.timingKey ?? task.id;
    const timing = systemProfile.taskServiceTimes[timingKey];
    if (!timing) fail(`SystemProfile missing taskServiceTimes.${timingKey} for design task ${task.id}`);

    const actorAssignments = buildActorAssignments(
      task,
      instance,
      runConfiguration
    );

    const metadata = {
      ...(task.metadata ?? {}),
      designTaskId: task.id,
      logicalMultiplicity: instance.logicalMultiplicity,
      logicalInstanceOrdinal: instance.logicalInstanceIndex + 1,
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
      ...(actorAssignments.length
        ? { actorAssignments: clone(actorAssignments) }
        : {}),
    };

    taskManifest[instance.id] = {
      designTaskId: task.id,
      logicalMultiplicity: instance.logicalMultiplicity,
      logicalInstanceOrdinal: instance.logicalInstanceIndex + 1,
      ...(instance.repeat
        ? {
            repeatBlockId: instance.repeat.id,
            repeatOrdinal: instance.repeatIndex + 1,
          }
        : {}),
      timingKey,
      timingProvenance: clone(timing.provenance),
      ...(actorAssignments.length
        ? { actorAssignments: clone(actorAssignments) }
        : {}),
    };

    return {
      id: instance.id,
      label: instance.repeat
        ? `${task.label} [${instance.repeatIndex + 1}/${instance.repeat.count}]`
        : instance.logicalMultiplicity > 1
          ? `${task.label} [${instance.logicalInstanceIndex + 1}/${instance.logicalMultiplicity}]`
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

  const compiledDependencies = compileDependencies(
    design,
    prepared,
    systemProfile
  );

  const workflowSpec = {
    id: workflowId,
    name: runConfiguration.name
      ? `${design.name} — ${runConfiguration.name}`
      : design.name,
    resources: compiledResources,
    tasks: compiledTasks,
    dependencies: compiledDependencies,
    policy: clone(runConfiguration.policy),
    assumptions: compileAssumptions(design, runConfiguration, systemProfile),
  };

  const manifest = {
    schemaVersion: 1,
    designId: design.id,
    runConfigurationId: runConfiguration.id,
    systemProfileId: systemProfile.id,
    workflowSpecId: workflowSpec.id,
    tasks: taskManifest,
    dependencies: buildDependencyManifest(
      design,
      prepared,
      systemProfile
    ),
    resources: resourceManifest,
    actorGroups: buildActorGroupManifest(design, runConfiguration),
    actorWaits: buildActorWaitManifest(
      design,
      prepared,
      expandedTasks,
      runConfiguration
    ),
  };

  return { workflowSpec, manifest };
}

export function compileWorkflowDesign(
  design,
  runConfiguration,
  systemProfile
) {
  return compileWorkflowDesignDetailed(
    design,
    runConfiguration,
    systemProfile
  ).workflowSpec;
}

export function createRunRecord({
  id,
  design,
  runConfiguration,
  systemProfile,
  compiledWorkflowSpec,
  compilationManifest,
  simulationResult,
  metadata,
}) {
  if (!id) fail("RunRecord requires id");
  validateSchemaVersion(design, "WorkflowDesign");
  validateSchemaVersion(runConfiguration, "RunConfiguration");
  validateSchemaVersion(systemProfile, "SystemProfile");
  if (compilationManifest?.schemaVersion !== 1) {
    fail("CompilationManifest.schemaVersion must be 1");
  }
  if (compilationManifest.workflowSpecId !== compiledWorkflowSpec?.id) {
    fail("CompilationManifest.workflowSpecId must match compiledWorkflowSpec.id");
  }
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
    compilationManifest: clone(compilationManifest),
    simulationResult: clone(simulationResult),
    ...(metadata ? { metadata: clone(metadata) } : {}),
  };
}
