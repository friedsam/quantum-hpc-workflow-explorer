export type ResourceKind = "cpu" | "gpu" | "qpu" | "network";
export type AllocationPolicy = "fixed" | "release-aware";

export interface TimeModel {
  kind: "constant";
  seconds: number;
}

export interface WorkflowSpec {
  id: string;
  name: string;
  tasks: TaskSpec[];
  dependencies: DependencySpec[];
  resources: ResourcePoolSpec[];
  policy: PolicySpec;
}

export interface TaskSpec {
  id: string;
  label: string;
  resourceKind: ResourceKind;
  resourceCount: number;
  serviceTime: TimeModel;
  batchable?: boolean;
  metadata?: Record<string, unknown>;
}

export interface DependencySpec {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  dataBytes?: number;
  fixedLatencyS?: number;
  bandwidthBytesPerS?: number;
}

export interface ResourcePoolSpec {
  id: string;
  kind: ResourceKind;
  capacity: number;
  costPerUnitSecond?: number;
}

export interface PolicySpec {
  allocation: AllocationPolicy;
  maxInFlightQuantum?: number;
  batching?: number;
}

export interface SimulationEvent {
  seq: number;
  simTimeS: number;
  type: string;
  taskId?: string;
  resourcePoolId?: string;
  metadata?: Record<string, unknown>;
}

export interface ResourceInterval {
  resourcePoolId: string;
  startS: number;
  endS: number;
  state: "active" | "allocated-idle" | "released";
  units: number;
  taskId?: string;
}

export interface TaskInterval {
  taskId: string;
  startS: number;
  endS: number;
  state: "ready" | "running" | "waiting" | "complete";
}

export interface QueueSample {
  simTimeS: number;
  resourcePoolId: string;
  depth: number;
}

export interface Metrics {
  makespanS: number;
  utilizationByPool: Record<string, number>;
  allocatedResourceSecondsByPool: Record<string, number>;
  idleAllocatedResourceSecondsByPool: Record<string, number>;
  queueWaitSecondsByPool: Record<string, number>;
  communicationSeconds: number;
}

export interface SimulationResult {
  workflowId: string;
  events: SimulationEvent[];
  resourceIntervals: ResourceInterval[];
  taskIntervals: TaskInterval[];
  queueSeries: QueueSample[];
  metrics: Metrics;
  assumptions: string[];
}

export interface FixturePair {
  key: string;
  label: string;
  description: string;
  spec: WorkflowSpec;
  result: SimulationResult;
}

export interface ValidationIssue {
  severity: "error" | "warning";
  path: string;
  message: string;
}

export function cloneWorkflowSpec(spec: WorkflowSpec): WorkflowSpec {
  return JSON.parse(JSON.stringify(spec)) as WorkflowSpec;
}

export function validateWorkflowSpec(spec: WorkflowSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!spec.name.trim()) issues.push({ severity: "error", path: "name", message: "Workflow name is required." });
  if (spec.tasks.length === 0) issues.push({ severity: "error", path: "tasks", message: "At least one task is required." });

  const taskIds = new Set<string>();
  for (const task of spec.tasks) {
    if (taskIds.has(task.id)) issues.push({ severity: "error", path: "tasks", message: "Duplicate task id: " + task.id });
    taskIds.add(task.id);
    if (!task.label.trim()) issues.push({ severity: "error", path: "tasks." + task.id + ".label", message: "Task label is required." });
    if (!Number.isInteger(task.resourceCount) || task.resourceCount < 1) issues.push({ severity: "error", path: "tasks." + task.id + ".resourceCount", message: "Resource count must be a positive integer." });
    if (!Number.isFinite(task.serviceTime.seconds) || task.serviceTime.seconds < 0) issues.push({ severity: "error", path: "tasks." + task.id + ".serviceTime", message: "Service time must be a finite non-negative number." });
  }

  const poolIds = new Set<string>();
  for (const pool of spec.resources) {
    if (poolIds.has(pool.id)) issues.push({ severity: "error", path: "resources", message: "Duplicate resource pool id: " + pool.id });
    poolIds.add(pool.id);
    if (!Number.isInteger(pool.capacity) || pool.capacity < 1) issues.push({ severity: "error", path: "resources." + pool.id + ".capacity", message: "Resource capacity must be a positive integer." });
  }

  for (const task of spec.tasks) {
    const capacities = spec.resources.filter((pool) => pool.kind === task.resourceKind).map((pool) => pool.capacity);
    if (capacities.length === 0) {
      issues.push({ severity: "error", path: "tasks." + task.id + ".resourceKind", message: "No resource pool exists for " + task.resourceKind + "." });
    } else if (task.resourceCount > Math.max(...capacities)) {
      issues.push({ severity: "error", path: "tasks." + task.id + ".resourceCount", message: "Task requests more " + task.resourceKind + " units than any configured pool provides." });
    }
  }

  const dependencyIds = new Set<string>();
  const indegree = new Map(spec.tasks.map((task) => [task.id, 0]));
  const adjacency = new Map(spec.tasks.map((task) => [task.id, [] as string[]]));
  for (const dependency of spec.dependencies) {
    if (dependencyIds.has(dependency.id)) issues.push({ severity: "error", path: "dependencies", message: "Duplicate dependency id: " + dependency.id });
    dependencyIds.add(dependency.id);
    if (!taskIds.has(dependency.sourceTaskId) || !taskIds.has(dependency.targetTaskId)) {
      issues.push({ severity: "error", path: "dependencies." + dependency.id, message: "Dependency endpoints must reference existing tasks." });
      continue;
    }
    if (dependency.sourceTaskId === dependency.targetTaskId) {
      issues.push({ severity: "error", path: "dependencies." + dependency.id, message: "A task cannot depend on itself." });
      continue;
    }
    adjacency.get(dependency.sourceTaskId)?.push(dependency.targetTaskId);
    indegree.set(dependency.targetTaskId, (indegree.get(dependency.targetTaskId) ?? 0) + 1);
  }

  const ready = [...indegree.entries()].filter(([, count]) => count === 0).map(([id]) => id);
  let visited = 0;
  while (ready.length > 0) {
    const id = ready.shift();
    if (!id) break;
    visited += 1;
    for (const target of adjacency.get(id) ?? []) {
      const next = (indegree.get(target) ?? 1) - 1;
      indegree.set(target, next);
      if (next === 0) ready.push(target);
    }
  }
  if (visited !== spec.tasks.length && spec.tasks.length > 0) issues.push({ severity: "error", path: "dependencies", message: "Dependency graph contains a cycle. Use bounded repeat metadata rather than dependency cycles." });

  if (spec.policy.maxInFlightQuantum !== undefined && (!Number.isInteger(spec.policy.maxInFlightQuantum) || spec.policy.maxInFlightQuantum < 1)) {
    issues.push({ severity: "error", path: "policy.maxInFlightQuantum", message: "Max in-flight quantum jobs must be a positive integer." });
  }
  if (spec.policy.batching !== undefined && (!Number.isInteger(spec.policy.batching) || spec.policy.batching < 1)) {
    issues.push({ severity: "error", path: "policy.batching", message: "Batching must be a positive integer." });
  }

  if (spec.dependencies.length === 0 && spec.tasks.length > 1) issues.push({ severity: "warning", path: "dependencies", message: "Multiple tasks are present but no dependencies are defined." });
  return issues;
}

const baselineSpec: WorkflowSpec = {
  id: "qamp-async-baseline",
  name: "QAMP async baseline",
  tasks: [
    { id: "prepare", label: "Classical prepare", resourceKind: "cpu", resourceCount: 64, serviceTime: { kind: "constant", seconds: 2.2 } },
    { id: "quantum", label: "Quantum evaluate", resourceKind: "qpu", resourceCount: 1, serviceTime: { kind: "constant", seconds: 1.4 }, batchable: true },
    { id: "post", label: "Classical post-process", resourceKind: "cpu", resourceCount: 32, serviceTime: { kind: "constant", seconds: 1.0 } }
  ],
  dependencies: [
    { id: "prepare-to-quantum", sourceTaskId: "prepare", targetTaskId: "quantum", dataBytes: 2000000, fixedLatencyS: 0.15, bandwidthBytesPerS: 1000000000 },
    { id: "quantum-to-post", sourceTaskId: "quantum", targetTaskId: "post", dataBytes: 400000, fixedLatencyS: 0.12, bandwidthBytesPerS: 1000000000 }
  ],
  resources: [
    { id: "hpc", kind: "cpu", capacity: 128, costPerUnitSecond: 0.0015 },
    { id: "qpu", kind: "qpu", capacity: 1, costPerUnitSecond: 0.22 },
    { id: "fabric", kind: "network", capacity: 1 }
  ],
  policy: { allocation: "fixed", maxInFlightQuantum: 4, batching: 1 }
};

const releaseAwareSpec: WorkflowSpec = {
  ...baselineSpec,
  id: "qamp-release-aware",
  name: "QAMP release-aware + batched",
  policy: { allocation: "release-aware", maxInFlightQuantum: 2, batching: 4 }
};

const baselineResult: SimulationResult = {
  workflowId: baselineSpec.id,
  events: [
    { seq: 0, simTimeS: 0, type: "task-start", taskId: "prepare", resourcePoolId: "hpc" },
    { seq: 1, simTimeS: 2.2, type: "task-complete", taskId: "prepare", resourcePoolId: "hpc" },
    { seq: 2, simTimeS: 2.35, type: "queue-enter", taskId: "quantum", resourcePoolId: "qpu" },
    { seq: 3, simTimeS: 3.95, type: "task-start", taskId: "quantum", resourcePoolId: "qpu" },
    { seq: 4, simTimeS: 5.35, type: "task-complete", taskId: "quantum", resourcePoolId: "qpu" },
    { seq: 5, simTimeS: 5.47, type: "task-start", taskId: "post", resourcePoolId: "hpc" },
    { seq: 6, simTimeS: 6.47, type: "task-complete", taskId: "post", resourcePoolId: "hpc" }
  ],
  resourceIntervals: [
    { resourcePoolId: "hpc", startS: 0, endS: 2.2, state: "active", units: 64, taskId: "prepare" },
    { resourcePoolId: "hpc", startS: 2.2, endS: 5.47, state: "allocated-idle", units: 128 },
    { resourcePoolId: "hpc", startS: 5.47, endS: 6.47, state: "active", units: 32, taskId: "post" },
    { resourcePoolId: "qpu", startS: 3.95, endS: 5.35, state: "active", units: 1, taskId: "quantum" }
  ],
  taskIntervals: [
    { taskId: "prepare", startS: 0, endS: 2.2, state: "running" },
    { taskId: "quantum", startS: 2.2, endS: 3.95, state: "waiting" },
    { taskId: "quantum", startS: 3.95, endS: 5.35, state: "running" },
    { taskId: "post", startS: 5.35, endS: 5.47, state: "waiting" },
    { taskId: "post", startS: 5.47, endS: 6.47, state: "running" }
  ],
  queueSeries: [
    { simTimeS: 0, resourcePoolId: "qpu", depth: 0 },
    { simTimeS: 2.35, resourcePoolId: "qpu", depth: 1 },
    { simTimeS: 3.95, resourcePoolId: "qpu", depth: 0 },
    { simTimeS: 6.47, resourcePoolId: "qpu", depth: 0 }
  ],
  metrics: {
    makespanS: 6.47,
    utilizationByPool: { hpc: 0.34, qpu: 0.216 },
    allocatedResourceSecondsByPool: { hpc: 828.16, qpu: 1.4 },
    idleAllocatedResourceSecondsByPool: { hpc: 534.0, qpu: 0 },
    queueWaitSecondsByPool: { hpc: 0, qpu: 1.6 },
    communicationSeconds: 0.27
  },
  assumptions: [
    "Synthetic deterministic UI fixture, not a measured production prediction.",
    "Metrics are fixture values representing authoritative engine output for UI integration tests.",
    "QPU capacity is one only for this preset; the UI does not assume that globally."
  ]
};

const releaseAwareResult: SimulationResult = {
  workflowId: releaseAwareSpec.id,
  events: [
    { seq: 0, simTimeS: 0, type: "task-start", taskId: "prepare", resourcePoolId: "hpc" },
    { seq: 1, simTimeS: 2.2, type: "task-complete", taskId: "prepare", resourcePoolId: "hpc" },
    { seq: 2, simTimeS: 2.31, type: "queue-enter", taskId: "quantum", resourcePoolId: "qpu" },
    { seq: 3, simTimeS: 3.36, type: "task-start", taskId: "quantum", resourcePoolId: "qpu" },
    { seq: 4, simTimeS: 4.76, type: "task-complete", taskId: "quantum", resourcePoolId: "qpu" },
    { seq: 5, simTimeS: 4.92, type: "task-start", taskId: "post", resourcePoolId: "hpc" },
    { seq: 6, simTimeS: 5.92, type: "task-complete", taskId: "post", resourcePoolId: "hpc" }
  ],
  resourceIntervals: [
    { resourcePoolId: "hpc", startS: 0, endS: 2.2, state: "active", units: 64, taskId: "prepare" },
    { resourcePoolId: "hpc", startS: 2.2, endS: 4.92, state: "released", units: 96 },
    { resourcePoolId: "hpc", startS: 4.92, endS: 5.92, state: "active", units: 32, taskId: "post" },
    { resourcePoolId: "qpu", startS: 3.36, endS: 4.76, state: "active", units: 1, taskId: "quantum" }
  ],
  taskIntervals: [
    { taskId: "prepare", startS: 0, endS: 2.2, state: "running" },
    { taskId: "quantum", startS: 2.2, endS: 3.36, state: "waiting" },
    { taskId: "quantum", startS: 3.36, endS: 4.76, state: "running" },
    { taskId: "post", startS: 4.76, endS: 4.92, state: "waiting" },
    { taskId: "post", startS: 4.92, endS: 5.92, state: "running" }
  ],
  queueSeries: [
    { simTimeS: 0, resourcePoolId: "qpu", depth: 0 },
    { simTimeS: 2.31, resourcePoolId: "qpu", depth: 1 },
    { simTimeS: 3.36, resourcePoolId: "qpu", depth: 0 },
    { simTimeS: 5.92, resourcePoolId: "qpu", depth: 0 }
  ],
  metrics: {
    makespanS: 5.92,
    utilizationByPool: { hpc: 0.37, qpu: 0.236 },
    allocatedResourceSecondsByPool: { hpc: 380.0, qpu: 1.4 },
    idleAllocatedResourceSecondsByPool: { hpc: 86.0, qpu: 0 },
    queueWaitSecondsByPool: { hpc: 0, qpu: 1.05 },
    communicationSeconds: 0.18
  },
  assumptions: [
    "Synthetic deterministic UI fixture, not a measured production prediction.",
    "This fixture differs in allocation, batching and queue assumptions; it is not a universal policy claim.",
    "Metrics are fixture values representing authoritative engine output for UI integration tests."
  ]
};

export const fixtures: FixturePair[] = [
  { key: "baseline", label: "Baseline", description: "Fixed allocation, single-circuit batches.", spec: baselineSpec, result: baselineResult },
  { key: "release", label: "Release-aware", description: "Release-aware allocation with a larger batch preset.", spec: releaseAwareSpec, result: releaseAwareResult }
];

export function getFixture(key: string): FixturePair {
  return fixtures.find((fixture) => fixture.key === key) ?? fixtures[0];
}
