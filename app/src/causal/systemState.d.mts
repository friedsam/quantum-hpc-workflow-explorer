import type {
  ResourceKind,
  SimulationResult,
  WorkflowSpec
} from "../domain/types";

export type EvidenceKind = "engine" | "derived" | "conditional";
export type DebugTaskState =
  | "running"
  | "queued"
  | "policy-held"
  | "dependency-gated"
  | "complete"
  | "pending";

export interface ExactPoolState {
  resourcePoolId: string;
  kind: ResourceKind;
  capacity: number;
  activeUnits: number;
  allocatedIdleUnits: number;
  releasedUnits: number;
  queuedTaskIds: string[];
  queueDepth: number;
}

export interface ActiveCommunication {
  dependencyId: string;
  sourceTaskId: string;
  targetTaskId: string;
  evidence: "engine";
}

export interface PolicyHeldQuantumTask {
  taskId: string;
  resourcePoolId: string;
  qpuDemandUnits: number;
  reason: "maxInFlightQuantumByPool";
  actorGroupIds?: string[];
  evidence: "derived";
}

export interface UnresolvedDependency {
  dependencyId: string;
  sourceTaskId: string;
  directState:
    | "communication-active"
    | "qpu-predecessor-incomplete"
    | "upstream-incomplete";
}

export interface DependencyGate {
  taskId: string;
  classicalDemandUnits: number;
  incomingDependencyCount: number;
  unresolved: UnresolvedDependency[];
  structuralJoin: boolean;
  semanticType?: string;
  actorGroupIds?: string[];
  explanation:
    | "dependency-gate"
    | "collective-synchronization";
  evidence: EvidenceKind;
}

export interface SystemStateSnapshot {
  simTimeS: number;
  resources: {
    classicalByPool: Record<string, ExactPoolState>;
    qpuByPool: Record<string, ExactPoolState>;
  };
  causal: {
    activeCommunications: ActiveCommunication[];
    policyHeldQuantumTasks: PolicyHeldQuantumTask[];
    dependencyGatedClassical: DependencyGate[];
  };
  dag: {
    taskStateById: Record<string, DebugTaskState>;
    activeCommunicationDependencyIds: string[];
  };
}

export function deriveSystemStateSnapshot(
  spec: WorkflowSpec,
  result: SimulationResult,
  simTimeS: number
): SystemStateSnapshot;
