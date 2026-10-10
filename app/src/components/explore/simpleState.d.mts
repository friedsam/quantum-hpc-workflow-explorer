import type { WorkflowDesign, CompilationManifest } from "../../design/types";
import type { WorkflowSpec } from "../../domain/types";
import type { SystemStateSnapshot } from "../../causal/systemState.mjs";
import type { ActorStateProjection } from "../../playback/actor-aware-view.mjs";

export interface GenericProgress {
  completeContinuations: number;
  runningContinuations: number;
  qpuRunning: number;
  qpuQueued: number;
  policyHeld: number;
}

export interface QpuSummary {
  running: readonly string[];
  queued: readonly string[];
  policyHeld: readonly string[];
  capacity: number;
}

export function deriveGenericProgress(
  design: WorkflowDesign,
  manifest: CompilationManifest,
  spec: WorkflowSpec,
  snapshot: SystemStateSnapshot
): GenericProgress;

export function deriveQpuSummary(
  spec: WorkflowSpec,
  snapshot: SystemStateSnapshot
): QpuSummary;

export function hasGlobalSynchronizationSemantics(
  design: WorkflowDesign
): boolean;

export function globalSynchronizationIsActive(
  actors: ActorStateProjection
): boolean;
