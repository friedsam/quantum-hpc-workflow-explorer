import { buildVisualKeyframes } from "./trace-playback.mjs";

function actorGroups(manifest) {
  return Object.values(manifest?.actorGroups ?? {}).sort((a, b) =>
    String(a.actorGroupId).localeCompare(String(b.actorGroupId))
  );
}

function requireActorProvider(
  manifest,
  deriveActorStateDetailAt,
  deriveActorGroupSummaryAt
) {
  if (actorGroups(manifest).length === 0) return;
  if (
    typeof deriveActorStateDetailAt !== "function" &&
    typeof deriveActorGroupSummaryAt !== "function"
  ) {
    throw new TypeError(
      "actor detail or group-summary derivation is required when authored actor groups exist"
    );
  }
}

function validateSummary(group, summary, simTimeS) {
  if (!summary || summary.actorGroupId !== group.actorGroupId) {
    throw new Error(
      `invalid actor summary for ${group.actorGroupId} at t=${simTimeS}`
    );
  }

  const total =
    summary.working +
    summary.blocked +
    summary.idle;

  if (summary.count !== group.count || total !== group.count) {
    throw new Error(
      `actor-state count mismatch for ${group.actorGroupId} at t=${simTimeS}`
    );
  }

  return Object.freeze({
    actorGroupId: group.actorGroupId,
    label: group.label,
    ...(group.kind ? { kind: group.kind } : {}),
    count: group.count,
    working: summary.working,
    blocked: summary.blocked,
    idle: summary.idle,
    blockedReasonCounts: Object.freeze({
      ...(summary.blockedReasonCounts ?? {}),
    }),
    evidence: "authored+derived",
  });
}

function summarizeGroupFromDetails(
  manifest,
  result,
  group,
  simTimeS,
  deriveActorStateDetailAt
) {
  const counts = { working: 0, blocked: 0, idle: 0 };
  const blockedReasonCounts = {};

  for (
    let actorOrdinal = 1;
    actorOrdinal <= group.count;
    actorOrdinal += 1
  ) {
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

  const sortedReasons = Object.fromEntries(
    Object.entries(blockedReasonCounts).sort(([a], [b]) =>
      a.localeCompare(b)
    )
  );

  return validateSummary(
    group,
    {
      actorGroupId: group.actorGroupId,
      count: group.count,
      ...counts,
      blockedReasonCounts: sortedReasons,
    },
    simTimeS
  );
}

function summarizeGroup(
  manifest,
  result,
  group,
  simTimeS,
  deriveActorStateDetailAt,
  deriveActorGroupSummaryAt
) {
  if (typeof deriveActorGroupSummaryAt === "function") {
    return validateSummary(
      group,
      deriveActorGroupSummaryAt(
        manifest,
        result,
        group.actorGroupId,
        simTimeS
      ),
      simTimeS
    );
  }

  return summarizeGroupFromDetails(
    manifest,
    result,
    group,
    simTimeS,
    deriveActorStateDetailAt
  );
}

export function deriveActorGroupSummariesAt(
  manifest,
  result,
  simTimeS,
  deriveActorStateDetailAt,
  deriveActorGroupSummaryAt
) {
  requireActorProvider(
    manifest,
    deriveActorStateDetailAt,
    deriveActorGroupSummaryAt
  );

  return Object.freeze(
    actorGroups(manifest).map((group) =>
      summarizeGroup(
        manifest,
        result,
        group,
        simTimeS,
        deriveActorStateDetailAt,
        deriveActorGroupSummaryAt
      )
    )
  );
}

export function actorCompositionSignatureAt(
  manifest,
  result,
  simTimeS,
  deriveActorStateDetailAt,
  deriveActorGroupSummaryAt
) {
  const summaries = deriveActorGroupSummariesAt(
    manifest,
    result,
    simTimeS,
    deriveActorStateDetailAt,
    deriveActorGroupSummaryAt
  );
  if (summaries.length === 0) return "";

  return summaries
    .map((group) => {
      const reasons = Object.entries(
        group.blockedReasonCounts
      )
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

export function attachActorStateToSystemSnapshot(
  genericSnapshot,
  manifest,
  result,
  deriveActorStateDetailAt,
  deriveActorGroupSummaryAt
) {
  if (
    !genericSnapshot ||
    !Number.isFinite(genericSnapshot.simTimeS)
  ) {
    throw new TypeError(
      "genericSnapshot with finite simTimeS is required"
    );
  }

  const summaries = deriveActorGroupSummariesAt(
    manifest,
    result,
    genericSnapshot.simTimeS,
    deriveActorStateDetailAt,
    deriveActorGroupSummaryAt
  );

  return Object.freeze({
    ...genericSnapshot,
    actors: Object.freeze({
      mode:
        summaries.length > 0
          ? "actor-aware"
          : "generic",
      groups: summaries,
    }),
  });
}

export function buildActorAwareVisualKeyframes(
  result,
  {
    manifest,
    deriveActorStateDetailAt,
    deriveActorGroupSummaryAt,
    ...playbackOptions
  } = {}
) {
  const groups = actorGroups(manifest);

  if (groups.length === 0) {
    return buildVisualKeyframes(
      result,
      playbackOptions
    ).map((frame) =>
      Object.freeze({
        ...frame,
        actors: Object.freeze({
          mode: "generic",
          groups: Object.freeze([]),
        }),
      })
    );
  }

  requireActorProvider(
    manifest,
    deriveActorStateDetailAt,
    deriveActorGroupSummaryAt
  );

  const frames = buildVisualKeyframes(result, {
    ...playbackOptions,
    semanticSignatureAtTime: (simTimeS) =>
      actorCompositionSignatureAt(
        manifest,
        result,
        simTimeS,
        deriveActorStateDetailAt,
        deriveActorGroupSummaryAt
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
            deriveActorStateDetailAt,
            deriveActorGroupSummaryAt
          ),
        }),
      })
    )
  );
}
