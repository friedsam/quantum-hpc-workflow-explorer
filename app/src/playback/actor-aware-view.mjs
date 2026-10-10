import { buildVisualKeyframes } from "./trace-playback.mjs";

function actorGroups(manifest) {
  return Object.values(manifest?.actorGroups ?? {}).sort((a, b) =>
    String(a.actorGroupId).localeCompare(String(b.actorGroupId))
  );
}

function requireActorDeriver(manifest, deriveActorStateDetailAt) {
  if (actorGroups(manifest).length === 0) return;
  if (typeof deriveActorStateDetailAt !== "function") {
    throw new TypeError(
      "deriveActorStateDetailAt is required when authored actor groups exist"
    );
  }
}

function summarizeGroup(
  manifest,
  result,
  group,
  simTimeS,
  deriveActorStateDetailAt
) {
  const counts = { working: 0, blocked: 0, idle: 0 };
  const blockedReasonCounts = {};

  for (let actorOrdinal = 1; actorOrdinal <= group.count; actorOrdinal += 1) {
    const detail = deriveActorStateDetailAt(
      manifest,
      result,
      group.actorGroupId,
      actorOrdinal,
      simTimeS
    );

    if (!(detail.state in counts)) {
      throw new Error(
        `unsupported actor state ${detail.state} for ${group.actorGroupId}:${actorOrdinal}`
      );
    }
    counts[detail.state] += 1;

    if (detail.state === "blocked") {
      for (const reason of detail.blockedReasons ?? []) {
        blockedReasonCounts[reason] =
          (blockedReasonCounts[reason] ?? 0) + 1;
      }
    }
  }

  if (counts.working + counts.blocked + counts.idle !== group.count) {
    throw new Error(
      `actor-state count mismatch for ${group.actorGroupId} at t=${simTimeS}`
    );
  }

  const sortedReasons = Object.fromEntries(
    Object.entries(blockedReasonCounts).sort(([a], [b]) =>
      a.localeCompare(b)
    )
  );

  return Object.freeze({
    actorGroupId: group.actorGroupId,
    label: group.label,
    ...(group.kind ? { kind: group.kind } : {}),
    count: group.count,
    working: counts.working,
    blocked: counts.blocked,
    idle: counts.idle,
    blockedReasonCounts: Object.freeze(sortedReasons),
    evidence: "authored+derived",
  });
}

export function deriveActorGroupSummariesAt(
  manifest,
  result,
  simTimeS,
  deriveActorStateDetailAt
) {
  requireActorDeriver(manifest, deriveActorStateDetailAt);
  return Object.freeze(
    actorGroups(manifest).map((group) =>
      summarizeGroup(
        manifest,
        result,
        group,
        simTimeS,
        deriveActorStateDetailAt
      )
    )
  );
}

export function actorCompositionSignatureAt(
  manifest,
  result,
  simTimeS,
  deriveActorStateDetailAt
) {
  const summaries = deriveActorGroupSummariesAt(
    manifest,
    result,
    simTimeS,
    deriveActorStateDetailAt
  );
  if (summaries.length === 0) return "";

  return summaries
    .map((group) => {
      const reasons = Object.entries(group.blockedReasonCounts)
        .map(([reason, count]) => `${reason}=${count}`)
        .join(",");
      return [
        group.actorGroupId,
        `w=${group.working}`,
        `b=${group.blocked}`,
        `i=${group.idle}`,
        `r=${reasons}`,
      ].join("|");
    })
    .join("||");
}

/**
 * Compose actor state onto the existing generic resource/causal snapshot.
 * The resource and causal layers are never rewritten.
 */
export function attachActorStateToSystemSnapshot(
  genericSnapshot,
  manifest,
  result,
  deriveActorStateDetailAt
) {
  if (!genericSnapshot || !Number.isFinite(genericSnapshot.simTimeS)) {
    throw new TypeError("genericSnapshot with finite simTimeS is required");
  }

  const summaries = deriveActorGroupSummariesAt(
    manifest,
    result,
    genericSnapshot.simTimeS,
    deriveActorStateDetailAt
  );

  return Object.freeze({
    ...genericSnapshot,
    actors: Object.freeze({
      mode: summaries.length > 0 ? "actor-aware" : "generic",
      groups: summaries,
    }),
  });
}

/**
 * Actor-aware playback remains event/keyframe based. Authored actor-state
 * composition and blocked-reason composition augment presentation signatures,
 * preventing compression across material actor-state changes without creating
 * per-actor keyframes.
 */
export function buildActorAwareVisualKeyframes(
  result,
  {
    manifest,
    deriveActorStateDetailAt,
    ...playbackOptions
  } = {}
) {
  const groups = actorGroups(manifest);
  if (groups.length === 0) {
    return buildVisualKeyframes(result, playbackOptions).map((frame) =>
      Object.freeze({
        ...frame,
        actors: Object.freeze({ mode: "generic", groups: Object.freeze([]) }),
      })
    );
  }

  requireActorDeriver(manifest, deriveActorStateDetailAt);

  const frames = buildVisualKeyframes(result, {
    ...playbackOptions,
    semanticSignatureAtTime: (simTimeS) =>
      actorCompositionSignatureAt(
        manifest,
        result,
        simTimeS,
        deriveActorStateDetailAt
      ),
  });

  return Object.freeze(
    frames.map((frame) =>
      Object.freeze({
        ...frame,
        actors: Object.freeze({
          mode: "actor-aware",
          groups: deriveActorGroupSummariesAt(
            manifest,
            result,
            frame.snapshot.simTimeS,
            deriveActorStateDetailAt
          ),
        }),
      })
    )
  );
}
