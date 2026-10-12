import type { ActorStateProjector, CompilationManifest } from "./types";
import type { SimulationResult } from "../domain/types";

export function createActorStateProjector(manifest: CompilationManifest, simulationResult: SimulationResult): ActorStateProjector;
