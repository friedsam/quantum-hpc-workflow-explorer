import type {
  ActorGroupSummary,
  CompilationManifest,
  DerivedActorStateDetail
} from "../design/types";
import type { SimulationResult } from "../domain/types";
import type { SystemStateSnapshot } from "../causal/systemState.mjs";
import type { VisualKeyframe } from "./trace-playback.mjs";

export interface ActorGroupStateSummary {
  actorGroupId: string;
  label: string;
  kind?: string;
  count: number;
  working: number;
  blocked: number;
  idle: number;
  blockedReasonCounts: Readonly<Record<string, number>>;
  evidence: "authored+derived";
}

export interface ActorStateProjection {
  mode: "actor-aware" | "generic";
  groups: readonly ActorGroupStateSummary[];
}

export interface ActorAwareSystemStateSnapshot
  extends SystemStateSnapshot {
  actors: ActorStateProjection;
}

export interface ActorAwareVisualKeyframe
  extends VisualKeyframe {
  actors: ActorStateProjection;
}

export type ActorDeriver = (
  manifest: CompilationManifest,
  result: SimulationResult,
  actorGroupId: string,
  actorOrdinal: number,
  simTimeS: number
) => DerivedActorStateDetail;

export type ActorSummaryDeriver = (
  manifest: CompilationManifest,
  result: SimulationResult,
  actorGroupId: string,
  simTimeS: number
) => ActorGroupSummary;

export function deriveActorGroupSummariesAt(
  manifest: CompilationManifest,
  result: SimulationResult,
  simTimeS: number,
  deriveActorStateDetailAt?: ActorDeriver,
  deriveActorGroupSummaryAt?: ActorSummaryDeriver
): readonly ActorGroupStateSummary[];

export function actorCompositionSignatureAt(
  manifest: CompilationManifest,
  result: SimulationResult,
  simTimeS: number,
  deriveActorStateDetailAt?: ActorDeriver,
  deriveActorGroupSummaryAt?: ActorSummaryDeriver
): string;

export function attachActorStateToSystemSnapshot(
  genericSnapshot: SystemStateSnapshot,
  manifest: CompilationManifest | undefined,
  result: SimulationResult,
  deriveActorStateDetailAt?: ActorDeriver,
  deriveActorGroupSummaryAt?: ActorSummaryDeriver
): ActorAwareSystemStateSnapshot;

export function buildActorAwareVisualKeyframes(
  result: SimulationResult,
  options?: {
    manifest?: CompilationManifest;
    deriveActorStateDetailAt?: ActorDeriver;
    deriveActorGroupSummaryAt?: ActorSummaryDeriver;
    [key: string]: unknown;
  }
): readonly ActorAwareVisualKeyframe[];
