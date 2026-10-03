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
  schemaVersion: 1;
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
  schemaVersion: 1;
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
  schemaVersion: 1;
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

export interface CompiledTaskManifestEntry {
  designTaskId: string;
  repeatBlockId?: string;
  repeatOrdinal?: number;
  timingKey: string;
  timingProvenance: Provenance;
}

export interface CompiledDependencyManifestEntry {
  kind: "design-dependency" | "repeat-carry";
  designDependencyId?: string;
  carryDependencyId?: string;
  repeatBlockId?: string;
  sourceRepeatOrdinal?: number;
  targetRepeatOrdinal?: number;
  communicationKey: string;
  communicationProvenance?: Provenance;
}

export interface CompiledResourceManifestEntry {
  runResourceId: string;
  costKey: string;
  costSource: "run-override" | "system-profile" | "unset";
  costProvenance?: Provenance;
}

export interface CompilationManifest {
  schemaVersion: 1;
  designId: string;
  runConfigurationId: string;
  systemProfileId: string;
  workflowSpecId: string;
  tasks: Record<string, CompiledTaskManifestEntry>;
  dependencies: Record<string, CompiledDependencyManifestEntry>;
  resources: Record<string, CompiledResourceManifestEntry>;
}

export interface CompilationResult {
  workflowSpec: WorkflowSpec;
  manifest: CompilationManifest;
}

export interface RunRecord {
  schemaVersion: 1;
  id: string;
  design: WorkflowDesign;
  runConfiguration: RunConfiguration;
  systemProfile: SystemProfile;
  compiledWorkflowSpec: WorkflowSpec;
  compilationManifest: CompilationManifest;
  simulationResult: SimulationResult;
  metadata?: Record<string, unknown>;
}

export function compileWorkflowDesignDetailed(
  design: WorkflowDesign,
  runConfiguration: RunConfiguration,
  systemProfile: SystemProfile
): CompilationResult;

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
  compilationManifest: CompilationManifest;
  simulationResult: SimulationResult;
  metadata?: Record<string, unknown>;
}): RunRecord;
