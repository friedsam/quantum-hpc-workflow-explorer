import {
  createActorStateProjector,
} from "./actor-state-index.mjs";

const projectorCache = new WeakMap();

function cachedProjector(manifest, simulationResult) {
  if (
    !manifest ||
    typeof manifest !== "object" ||
    !simulationResult ||
    typeof simulationResult !== "object"
  ) {
    return createActorStateProjector(
      manifest,
      simulationResult
    );
  }

  let byResult = projectorCache.get(manifest);
  if (!byResult) {
    byResult = new WeakMap();
    projectorCache.set(manifest, byResult);
  }

  let projector = byResult.get(simulationResult);
  if (!projector) {
    projector = createActorStateProjector(
      manifest,
      simulationResult
    );
    byResult.set(simulationResult, projector);
  }
  return projector;
}

export { createActorStateProjector };

export function deriveActorStateDetailAt(
  manifest,
  simulationResult,
  actorGroupId,
  actorOrdinal,
  simTimeS
) {
  return cachedProjector(
    manifest,
    simulationResult
  ).detailAt(
    actorGroupId,
    actorOrdinal,
    simTimeS
  );
}

export function deriveActorStateAt(
  manifest,
  simulationResult,
  actorGroupId,
  actorOrdinal,
  simTimeS
) {
  return deriveActorStateDetailAt(
    manifest,
    simulationResult,
    actorGroupId,
    actorOrdinal,
    simTimeS
  ).state;
}

export function deriveActorStateCountsAt(
  manifest,
  simulationResult,
  actorGroupId,
  simTimeS
) {
  return cachedProjector(
    manifest,
    simulationResult
  ).countsAt(
    actorGroupId,
    simTimeS
  );
}

export function deriveActorGroupSummaryAt(
  manifest,
  simulationResult,
  actorGroupId,
  simTimeS
) {
  return cachedProjector(
    manifest,
    simulationResult
  ).summaryAt(
    actorGroupId,
    simTimeS
  );
}

export function actorStateTransitionTimes(
  manifest,
  simulationResult,
  actorGroupId
) {
  return cachedProjector(
    manifest,
    simulationResult
  ).transitionTimes(actorGroupId);
}
