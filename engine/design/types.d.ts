import type { WorkflowSpec, SimulationResult, ResourceKind, PolicySpec } from "../types";

export type ProvenanceKind =
  | "synthetic"
  | "user-entered"
  | "measured"
  | "fitted";

export interface Provenance {
  kind: ProvenanceKind;
  source?: string;
  observedAt?: string;
  notes?: string;
}

export interface Provenanced<T> {
  value: T;
  provenance: Provenance;
}

export interface ActorGroup {
  id: string;
  label: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowDesign {
  id: string;
  name: string;
  tasks: DesignTask[];
  dependencies: DesignDependency[];
  actorGroups?: ActorGroup[];
  repeatBlocks?: RepeatBlock[];
  assumptions?: string[];
  metadata?: Record<string, unknown>;
}

export interface DesignTask {
  id: string;
  label: string;
  timingKey?: string;
  semanticType?: string;
  actorGroupIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface DesignDependency {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  communicationKey?: string;
  metadata?: Record<string, unknown>;
}

export interface RepeatBlock {
  id: string;
  count: number;
  taskIds: string[];
  carryDependencies?: RepeatCarryDependency[];
  metadata?: Record<string, unknown>;
}

export interface RepeatCarryDependency {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  communicationKey?: string;
}

export interface RunConfiguration {
  id: string;
  name?: string;
  workflowId?: string;
  resources: RunResource[];
  taskResources: Record<string, TaskResourceBinding>;
  policy: PolicySpec;
  costOverridesByPool?: Record<string, Provenanced<number>>;
  actorGroupCounts?: Record<string, number>;
  assumptions?: string[];
  metadata?: Record<string, unknown>;
}

export interface RunResource {
  id: string;
  kind: ResourceKind;
  capacity: number;
  costKey?: string;
}

export interface TaskResourceBinding {
  resourcePoolId: string;
  resourceCount: number;
}

export interface SystemProfile {
  id: string;
  name?: string;
  taskServiceTimes: Record<
    string,
    Provenanced<{ kind: "constant"; seconds: number }>
  >;
  dependencyCommunication?: Record<
    string,
    Provenanced<{
      fixedLatencyS?: number;
      dataBytes?: number;
      bandwidthBytesPerS?: number;
    }>
  >;
  costPerUnitSecond?: Record<string, Provenanced<number>>;
  assumptions?: string[];
  metadata?: Record<string, unknown>;
}

export interface RunRecord {
  schemaVersion: 1;
  id: string;
  design: WorkflowDesign;
  runConfiguration: RunConfiguration;
  systemProfile: SystemProfile;
  compiledWorkflowSpec: WorkflowSpec;
  simulationResult: SimulationResult;
  metadata?: Record<string, unknown>;
}

export function compileWorkflowDesign(
  design: WorkflowDesign,
  runConfiguration: RunConfiguration,
  systemProfile: SystemProfile
): WorkflowSpec;

export function createRunRecord(input: {
  id: string;
  design: WorkflowDesign;
  runConfiguration: RunConfiguration;
  systemProfile: SystemProfile;
  compiledWorkflowSpec: WorkflowSpec;
  simulationResult: SimulationResult;
  metadata?: Record<string, unknown>;
}): RunRecord;
