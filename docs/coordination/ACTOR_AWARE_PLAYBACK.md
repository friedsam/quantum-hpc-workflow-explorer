# Round 4B — actor-aware playback and causal-state checkpoint

Date: 2026-10-10  
Agent: B — Playback / Simulation Visualization  
Status: **checkpoint complete; stop for Agent F review**

## Inputs and provenance

Round 4B uses Agent A's accepted actor model above frozen DES.

Pinned producer evidence:
- Agent A head: `33f588033aa45ad811264e795f06242a2bec5ac9`
- frozen DES engine blob: `4023b3daf8ae7e50c6e7b7be8a886e2ea392dc84`
- Round-4 compiler blob: `bb487feede9ca0eb2b9f499aea44a21d7fbdb83b`
- actor-state derivation blob: `72d62283115faf63ab941ba643d06771feb81c9d`
- Scenario-B actor example blob: `f6ae694aec16bf40f3661e0923ece4366214964f`

Pinned playback evidence:
- `tests/playback/fixtures/qamp-b-actor-result.mjs`
- `tests/playback/fixtures/qamp-d-generic-snapshot.mjs`

No engine semantics were changed.

## Result

**[verified]** Actor-aware workflows can expose persistent logical actor state in playback without changing or conflating the exact resource layer.

**[verified]** Generic workflows remain on the Round-2B exact-resource + causal-overlay fallback and do not acquire invented actor/rank state.

## Minimal view-model/API for C

The integration seam is additive to the existing generic `SystemStateSnapshot`.

```ts
interface ActorGroupStateSummary {
  actorGroupId: string;
  label: string;
  kind?: string;
  count: number;

  working: number;
  blocked: number;
  idle: number;

  // Counts actors carrying each reason.
  // These may sum to > blocked because one actor can carry multiple reasons.
  blockedReasonCounts: Record<string, number>;

  evidence: "authored+derived";
}

interface ActorStateProjection {
  mode: "actor-aware" | "generic";
  groups: readonly ActorGroupStateSummary[];
}

interface ActorAwareSystemStateSnapshot extends SystemStateSnapshot {
  actors: ActorStateProjection;
}

interface ActorAwareVisualKeyframe extends VisualKeyframe {
  actors: ActorStateProjection;
}
```

Recommended integration functions:

```ts
attachActorStateToSystemSnapshot(
  genericSnapshot,
  compilationManifest,
  simulationResult,
  deriveActorStateDetailAt
): ActorAwareSystemStateSnapshot

buildActorAwareVisualKeyframes(
  simulationResult,
  {
    manifest: compilationManifest,
    deriveActorStateDetailAt
  }
): readonly ActorAwareVisualKeyframe[]
```

The accepted Agent-A `deriveActorStateDetailAt` remains the actor-state authority. Playback only aggregates actor details into counts/reason counts and uses that aggregate as presentation metadata.

## Separation of state spaces

**[verified]** Actor state and resource state remain independent:

- actor `Working / Blocked / Idle` is persistent logical actor state from authored participation/wait claims;
- resource `active / allocated-idle / released` remains exact frozen-DES allocation state;
- QPU queue and policy-held work remain exact/derived causal resource/work states;
- actor counts are never substituted for CPU resource-unit counts.

This preserves the Round-2B guardrail while allowing stronger actor-aware workflows to show legitimate blocked-rank counts.

## Scenario B playback sequence

The Round-4 Scenario B engine trace has 21 events at five semantic times: 0, 1, 4, 7, 8 s.

Playback remains aggregate: **5 keyframes**, not one frame per actor.

| Simulation time | Working | Blocked | Idle | Blocked reasons | Meaning |
|---:|---:|---:|---:|---|---|
| 0 s | 2 | 0 | 2 | — | two submitter ranks prepare; two ranks idle |
| 1 s | 0 | 2 | 2 | `quantum-result: 2` | submitters wait for their own authored result paths |
| 4 s | 0 | 4 | 0 | `global-synchronization: 4`, `quantum-result: 1` | first result activates the all-rank synchronization gate; second submitter still also waits on its own result |
| 7 s | 4 | 0 | 0 | — | complete result set releases gate; full collective starts |
| 8 s | 0 | 0 | 4 | — | collective complete; actors idle |

This satisfies the requested material sequence:

`subset working -> submitters blocked -> all blocked -> full group working`.

### Overlapping blocked reasons

At t=4:
- blocked actors = 4;
- `global-synchronization` reason count = 4;
- `quantum-result` reason count = 1.

Reason counts sum to 5 because actor 2 carries both reasons. Playback must not treat reason counts as mutually exclusive actor buckets.

## Actor-aware compression rule

The base playback API now accepts an optional presentation-only semantic signature function.

Actor-aware playback appends a deterministic signature containing, per actor group:
- Working count;
- Blocked count;
- Idle count;
- sorted blocked-reason counts.

Therefore compression cannot cross a material actor-state or reason-composition boundary.

**[verified stress case]** In a 40-event repeated raw event pattern where actor counts remain identical but the blocked reason changes at t=20, playback still compresses the repetitive regions but preserves t=20 as an explicit semantic frame.

This prevents causal-state changes from being hidden by event-signature compression without introducing per-actor animation frames.

## Generic fallback

When `CompilationManifest.actorGroups` is absent/empty:

- `actors.mode = "generic"`;
- `actors.groups = []`;
- existing exact resource state is unchanged;
- existing causal overlays are unchanged;
- no `Blocked` actor/rank count is invented.

### Scenario D guardrail

Pinned Scenario D generic snapshot at t=1 preserves:
- QPU resource queue depth from the generic system-state adapter;
- policy-held quantum tasks as a separate causal list.

Adding the actor-aware wrapper leaves both values unchanged and exposes no generic blocked-rank count.

Thus Scenario D remains:
- resource queue != policy-held work;
- policy-held work != blocked ranks.

Only a future/explicit actor-authored Scenario D model could legitimately expose actor Blocked/Idle counts.

## Code changes

### Proposed for PORT

- `web/assets/playback/trace-playback.mjs`
  - adds optional `semanticSignatureAtTime` presentation hook;
  - default behavior remains unchanged.

- `web/assets/playback/actor-aware-view.mjs`
  - actor-group aggregate summaries;
  - blocked-reason aggregate counts;
  - generic fallback wrapper;
  - actor-aware keyframe builder.

- `tests/playback/actor-aware-view.test.mjs`
  - Scenario B actor sequence;
  - overlapping reason counts;
  - aggregate keyframe behavior;
  - reason-aware compression;
  - generic Scenario D fallback.

- `tests/playback/fixtures/qamp-b-actor-result.mjs`
  - pinned Round-4 Scenario B manifest/result with producer provenance.

- `tests/playback/fixtures/qamp-d-generic-snapshot.mjs`
  - pinned generic Scenario D fallback evidence.

### Not changed

- frozen DES;
- engine actor model;
- UI/layout;
- graphics;
- playback dwell timing;
- playback controls.

## Validation

Exact remote branch blobs were fetched and executed through the tool V8 runtime.

Result: **20/20 assertions passed, 0 failed**.

Coverage:
- 13 prior playback/v1 invariants;
- Scenario B Working/Blocked/Idle sequence;
- blocked-reason overlap;
- five aggregate semantic actor frames from 21 engine events;
- actor reason composition in compression signature;
- Scenario D generic queue/policy-held fallback;
- actor-less playback without actor derivation;
- reason-only actor transition preserved during repetitive compression.

The environment does not expose a local repository checkout, so the Node `node --test` files were not executed through a local git worktree. The exact committed module/fixture blobs themselves were executed.

## Recommendation

**PORT.**

C should compose:
1. existing generic `deriveSystemStateSnapshot`;
2. accepted Agent-A actor-state derivation;
3. this small playback actor projection.

No new canonical model or engine state is required.

Stop here for Agent F review.
