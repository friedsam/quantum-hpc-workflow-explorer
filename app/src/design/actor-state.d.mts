import type {
  ActorStateCounts,
  CompilationManifest,
  DerivedActorState,
  DerivedActorStateDetail
} from "./types";
import type { SimulationResult } from "../domain/types";

export function deriveActorStateDetailAt(
  manifest: CompilationManifest,
  simulationResult: SimulationResult,
  actorGroupId: string,
  actorOrdinal: number,
  simTimeS: number
): DerivedActorStateDetail;

export function deriveActorStateAt(
  manifest: CompilationManifest,
  simulationResult: SimulationResult,
  actorGroupId: string,
  actorOrdinal: number,
  simTimeS: number
): DerivedActorState;

export function deriveActorStateCountsAt(
  manifest: CompilationManifest,
  simulationResult: SimulationResult,
  actorGroupId: string,
  simTimeS: number
): ActorStateCounts;
