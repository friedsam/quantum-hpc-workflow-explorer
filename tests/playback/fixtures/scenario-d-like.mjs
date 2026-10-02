/**
 * Deterministic v0-shaped stress fixture. This is not an engine and does not
 * claim to reproduce legacy Scenario D semantics exactly.
 */
export function makeScenarioDLikeResult({cycles = 1000} = {}) {
  if (!Number.isInteger(cycles) || cycles < 12) throw new RangeError("cycles must be an integer >= 12");

  const events = [];
  const queueSeries = [];
  let seq = 1;

  const push = (simTimeS, type, taskId, resourcePoolId, metadata) => {
    events.push({seq: seq++, simTimeS, type, taskId, resourcePoolId, metadata});
  };

  push(0, "workflow_started", undefined, "cpu", {phase: "baseline"});
  push(1, "quantum_submission_opened", "q-0", "qpu", {phase: "ramp"});
  queueSeries.push({simTimeS: 1, resourcePoolId: "qpu", depth: Math.min(50, cycles)});
  push(2, "throttle_limit_reached", undefined, "qpu", {phase: "bounded"});
  queueSeries.push({simTimeS: 2, resourcePoolId: "qpu", depth: Math.min(50, cycles)});

  // Each service cycle is a same-time semantic group. Task ids vary, but the
  // event-type/pool signature remains stable and is therefore compressible.
  for (let i = 0; i < cycles; i += 1) {
    const t = 3 + i;
    push(t, "qpu_task_completed", `q-${i}`, "qpu", {cycle: i});
    push(t, "classical_task_released", `c-${i}`, "cpu", {cycle: i});
    push(t, "qpu_task_started", `q-${i + 1}`, "qpu", {cycle: i + 1});
    queueSeries.push({
      simTimeS: t,
      resourcePoolId: "qpu",
      depth: Math.max(0, Math.min(50, cycles - i - 1)),
    });
  }

  const drainT = 3 + cycles;
  push(drainT, "qpu_queue_drained", undefined, "qpu", {phase: "drain"});
  queueSeries.push({simTimeS: drainT, resourcePoolId: "qpu", depth: 0});
  push(drainT + 1, "workflow_completed", undefined, "cpu", {phase: "done"});

  return {
    workflowId: "mock-scenario-d-like",
    events,
    resourceIntervals: [
      {resourcePoolId: "cpu", startS: 0, endS: drainT + 2, state: "active", units: 1000},
      {resourcePoolId: "qpu", startS: 1, endS: drainT, state: "active", units: 1},
    ],
    taskIntervals: [],
    queueSeries,
    metrics: {
      makespanS: drainT + 1,
      utilizationByPool: {cpu: 1, qpu: cycles / (drainT + 1)},
      allocatedResourceSecondsByPool: {cpu: 1000 * (drainT + 2), qpu: drainT - 1},
      idleAllocatedResourceSecondsByPool: {cpu: 0, qpu: 0},
      queueWaitSecondsByPool: {qpu: 0},
      communicationSeconds: 0,
    },
    assumptions: [
      "Synthetic deterministic stress fixture for playback validation only.",
      "QPU queue is bounded at 50 in the illustrative queue series.",
    ],
  };
}
