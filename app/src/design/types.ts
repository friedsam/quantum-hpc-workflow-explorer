import type { WorkflowSpec, SimulationResult, ResourceKind, PolicySpec } from "../domain/types";

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

export type ActorGroupKind = "mpi-rank" | "worker" | "logical";

export interface ActorGroup {
  id: string;
  label: string;
  kind?: ActorGroupKind;
  metadata?: Record<string, unknown>;
}

export type ActorParticipationSelection =
  | { kind: "all" }
  | { kind: "one-per-instance" }
  | { kind: "ordinals"; actorOrdinals: number[] }
  | { kind: "range"; startActorOrdinal: number; endActorOrdinal: number }
  | { kind: "all-except"; actorOrdinals: number[] };

export interface ActorParticipation {
  actorGroupId: string;
  selection: ActorParticipationSelection;
  stateDuringTask: "working" | "blocked";
}

export type ActorWaitTaskEvent = "ready" | "queued" | "started" | "completed";
export type ActorWaitInstanceCondition =
  | "matching-instance"
  | "any-instance"
  | "all-instances";

export interface ActorWaitTaskEventCondition {
  kind: "task-event";
  taskId: string;
  event: ActorWaitTaskEvent;
  instance: ActorWaitInstanceCondition;
}

export interface ActorWaitClaim {
  id: string;
  actorGroupId: string;
  selection: ActorParticipationSelection;
  activation: ActorWaitTaskEventCondition;
  release: ActorWaitTaskEventCondition;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowDesign {
  schemaVersion: 1;
  id: string;
  name: string;
  tasks: DesignTask[];
  dependencies: DesignDependency[];
  actorGroups?: ActorGroup[];
  actorWaits?: ActorWaitClaim[];
  repeatBlocks?: RepeatBlock[];
  assumptions?: string[];
  metadata?: Record<string, unknown>;
}

export interface DesignTask {
  id: string;
  label: string;
  timingKey?: string;
  semanticType?: string;
  /**
   * Number of concrete task instances represented by this logical task.
   * Defaults to 1. Distinct from actor count and resourceCount.
   */
  multiplicity?: number;
  /**
   * Legacy/semantic actor-group annotation retained for compatibility.
   * Exact actor-state derivation uses actorParticipation.
   */
  actorGroupIds?: string[];
  actorParticipation?: ActorParticipation[];
  metadata?: Record<string, unknown>;
}

export interface DesignDependency {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  communicationKey?: string;
  /**
   * Defaults to pairwise when source/target multiplicities are equal.
   * Required when multiplicities differ.
   */
  instanceMapping?: "pairwise" | "all-to-all";
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
  /**
   * Modeled wall time for one concrete task instance. This is not a CPU
   * instruction-speed parameter. Internal communication may be folded into
   * this wall time or represented explicitly by dependencies/phases.
   */
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
      /** Synthetic deterministic stagger for pairwise dependencies only.
       * Instance k latency = fixedLatencyS + (k - 1)*instanceStaggerS.
       * Not a network-contention or backend-queue simulation. */
      instanceStaggerS?: number;
    }>
  >;
  costPerUnitSecond?: Record<string, Provenanced<number>>;
  assumptions?: string[];
  metadata?: Record<string, unknown>;
}

export interface CompiledActorAssignment {
  actorGroupId: string;
  selection:
    | { kind: "all" }
    | { kind: "one"; actorOrdinal: number }
    | { kind: "ordinals"; actorOrdinals: number[] }
    | { kind: "range"; startActorOrdinal: number; endActorOrdinal: number }
    | { kind: "all-except"; actorOrdinals: number[] };
  stateDuringTask: "working" | "blocked";
}

export interface CompiledTaskManifestEntry {
  designTaskId: string;
  logicalMultiplicity: number;
  logicalInstanceOrdinal: number;
  repeatBlockId?: string;
  repeatOrdinal?: number;
  timingKey: string;
  timingProvenance: Provenance;
  actorAssignments?: CompiledActorAssignment[];
}

export interface CompiledDependencyManifestEntry {
  kind: "design-dependency" | "repeat-carry";
  designDependencyId?: string;
  carryDependencyId?: string;
  repeatBlockId?: string;
  sourceRepeatOrdinal?: number;
  targetRepeatOrdinal?: number;
  sourceLogicalInstanceOrdinal?: number;
  targetLogicalInstanceOrdinal?: number;
  communicationKey: string;
  communicationProvenance?: Provenance;
}

export type CompiledActorWaitEventType =
  | "task_ready"
  | "task_queued"
  | "task_started"
  | "task_completed";

export interface CompiledActorWaitBoundary {
  eventType: CompiledActorWaitEventType;
  taskIds: string[];
  quantifier: "any" | "all";
}

export interface CompiledActorWaitClaim {
  designWaitId: string;
  actorGroupId: string;
  selection:
    | { kind: "all" }
    | { kind: "one"; actorOrdinal: number }
    | { kind: "ordinals"; actorOrdinals: number[] }
    | { kind: "range"; startActorOrdinal: number; endActorOrdinal: number }
    | { kind: "all-except"; actorOrdinals: number[] };
  logicalInstanceOrdinal?: number;
  activation: CompiledActorWaitBoundary;
  release: CompiledActorWaitBoundary;
  reason: string;
}

export interface CompiledResourceManifestEntry {
  runResourceId: string;
  costKey: string;
  costSource: "run-override" | "system-profile" | "unset";
  costProvenance?: Provenance;
}

export interface CompiledActorGroupManifestEntry {
  actorGroupId: string;
  label: string;
  kind?: ActorGroupKind;
  count: number;
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
  actorGroups: Record<string, CompiledActorGroupManifestEntry>;
  actorWaits: Record<string, CompiledActorWaitClaim>;
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

export type DerivedActorState = "working" | "blocked" | "idle";

export interface DerivedActorStateDetail {
  actorGroupId: string;
  actorOrdinal: number;
  simTimeS: number;
  state: DerivedActorState;
  blockedReasons: string[];
}

export interface ActorStateCounts {
  actorGroupId: string;
  simTimeS: number;
  working: number;
  blocked: number;
  idle: number;
}

export interface ActorGroupSummary {
  actorGroupId: string;
  label: string;
  kind?: ActorGroupKind;
  count: number;
  working: number;
  blocked: number;
  idle: number;
  blockedReasonCounts: Record<string, number>;
  evidence: "authored+derived";
}

export interface ActorStateProjectorStats {
  actorGroupCount: number;
  actorCount: number;
  participationClaimCount: number;
  waitClaimCount: number;
  actorSegmentCount: number;
  summarySegmentCount: number;
  indexedEventCount: number;
  indexedRunningIntervalCount: number;
}

export interface ActorStateProjector {
  detailAt(
    actorGroupId: string,
    actorOrdinal: number,
    simTimeS: number
  ): DerivedActorStateDetail;
  countsAt(
    actorGroupId: string,
    simTimeS: number
  ): ActorStateCounts;
  summaryAt(
    actorGroupId: string,
    simTimeS: number
  ): ActorGroupSummary;
  transitionTimes(actorGroupId: string): number[];
  stats: ActorStateProjectorStats;
}

