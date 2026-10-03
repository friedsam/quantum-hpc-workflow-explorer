# Round 2B — Full-System Visual Language

Agent D · `agent/graphics` · 2026-10-02  
Status: **checkpoint candidate for Agent F review**

## Scope and source contract

This workup uses the frozen-v1 engine contract, Agent A's accepted scaled QAMP A–D fixtures, Agent B's accepted semantic playback model, and Agent F's accepted graphics split:

- editable workflow DAG: React Flow + ELK;
- runtime resource/state view: structured inline SVG with stable logical geometry;
- playback may compress/re-time presentation but does not change simulation causality;
- engine output remains authoritative for task/resource/queue/metric semantics.

The two static prototypes use the synthetic Scenario B and D acceptance timings. They are visual-debugger examples, **not measured HPC/QPU performance predictions**.

## Decision

**Replace the old top-level `Working / Idle / Blocked` resource card as the primary debugger view.**

Retain a resource card/bar only as a compact primitive inside a larger full-system board.

The old card is insufficient because it tries to put unlike quantities into one state table:

- resource-capacity state (`active`, `allocated-idle`, `released`);
- task waiting/gating;
- QPU resource queueing;
- admission/policy hold;
- communication;
- synchronization/join causality.

Frozen v1 does not define `Blocked` as a resource state and does not preserve rank identity across CPU → QPU → CPU stages. A defensible visual language therefore needs **separate capacity and causality planes**.

## Full-system composition

The debugger uses four synchronized planes at one selected simulation time.

### 1. Capacity plane — exact resource units

For each CPU/GPU/QPU pool show a fixed-geometry capacity bar and exact counts:

- **Active** — solid fill + label;
- **Allocated idle** — diagonal hatch + label;
- **Released** — dotted neutral fill + label.

These three quantities are mutually exclusive resource-unit accounting. They may be stacked because they share units.

Do not put `dependency wait`, `policy held`, or `queue depth` into this bar. They are task counts or causal facts, not resource-unit partitions.

### 2. Causality plane — task/dependency explanation

Adjacent to the capacity bar, show non-resource-unit facts as separate cards:

- **Dependency gate** — task is not dependency-ready; show unresolved prerequisite count/IDs when derivable;
- **Resource queue** — task has been admitted and is waiting for a resource pool;
- **Policy held** — QPU-target task is dependency-ready but admission-throttled;
- **Active communication** — positive-duration dependency transfer currently active;
- **Synchronization/join** — use only when the preset/metadata or an accepted derivation proves this interpretation. Generic user workflows should default to `dependency gate` rather than claim a barrier.

Every wait card must carry a unit label (`tasks`, `dependencies`, or `transfers`). Never silently convert it to CPU ranks/resource units.

### 3. Workflow DAG lens

The React Flow/ELK DAG keeps topology fixed during playback. At a selected time only state styling changes:

| Visual state | Treatment |
|---|---|
| running | green border/fill + `RUN` text |
| resource queued | violet border/fill + `QUEUE` text |
| policy held | amber dashed border + `POLICY HELD` text |
| dependency gated | blue border/fill + `DEPENDENCY GATE` text |
| active communication | red/orange edge + transfer label |
| complete | neutral gray + `complete` text |

Color is never the only encoding. Status text, border style and/or pattern accompany color.

Auto-layout runs only on topology/size changes. Playback/keyframe changes do not move nodes or reroute edges.

### 4. Linked analytical strips

Below the system state and DAG, use one common simulation-time axis and one movable cursor:

1. **resource composition** — stacked step/area representation from `ResourceInterval` evidence;
2. **QPU run + resource queue** — QPU active interval plus engine queue depth; policy-held task count may be an additional line/strip when the derivation is accepted;
3. **cumulative cost** — conceptually linked to the same cursor, but **not currently produced as a time series by frozen v1**.

The cursor updates the runtime panel and DAG. Selecting/zooming a region defines the interval handed to semantic playback for slow inspection. It must not create a second simulation timeline.

### Cumulative-cost data constraint

Frozen v1 exposes final `costByPool` / `totalCost`, resource intervals, and optional per-pool cost rates, but not a cumulative-cost time series.

Graphics/UI should not independently become the authoritative cost calculator. Production options for Agent F:

- provide a validated analysis adapter that derives cumulative cost from engine intervals/rates and verifies its terminal value against engine metrics; or
- add a producer-owned cost series later if needed.

The static prototypes therefore show the cost strip as **disabled / not configured**, rather than inventing a curve.

## Playback coupling

The current selected time is the single visual cursor.

A semantic playback keyframe may update:

- state text;
- fill/pattern/border styles;
- capacity segment widths;
- queue/policy/dependency cards;
- timeline cursor;
- DAG highlights.

It must not change panel geometry or DAG topology.

When Agent B emits a compressed periodic keyframe, label it neutrally, e.g. `Repeated 4-step activity ×21`, and retain the source-event range. Do not label heuristic periodicity as an algorithmic loop unless workflow metadata proves it.

No blinking, pulsing, or raw event-frame flashing. A production implementation may use a short state transition, but `prefers-reduced-motion: reduce` should remove nonessential transition motion. Current React Flow also provides keyboard/screen-reader support for nodes/edges; preserve it rather than replacing the DAG with an inaccessible canvas.

External standards checks used only for accessibility implementation details:

- React Flow accessibility: https://reactflow.dev/learn/advanced-use/accessibility
- W3C SVG accessible-name guidance: https://www.w3.org/WAI/standards-guidelines/act/rules/7d6734/
- reduced-motion media feature: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion

Structured SVG runtime panels should retain an explicit accessible name (`role="img"` + ARIA labeling) and production state-heavy views should expose a DOM/text equivalent for inspection.

## Presentation-only snapshot schema

This is an Agent-D **view model**, not a shared-engine contract change.

```ts
type EvidenceKind = "engine" | "derived" | "conditional";

interface DebugSystemSnapshot {
  simTimeS: number;
  sourceEventSeqRange?: [number, number]; // when selected via playback keyframe

  pools: Array<{
    resourcePoolId: string;
    capacity: number;
    activeUnits: number;
    allocatedIdleUnits: number;
    releasedUnits: number;
    queueDepth: number;
  }>;

  activeCommunication: Array<{
    dependencyId: string;
    sourceTaskId: string;
    targetTaskId: string;
    evidence: "engine";
  }>;

  explanations: Array<{
    kind: "dependency-gate" | "policy-held" | "join";
    taskIds: string[];
    evidence: EvidenceKind;
    unresolvedDependencyIds?: string[];
  }>;
}
```

This schema deliberately does **not** contain `blockedUnits` or persistent rank identity.

## Provenance: exact vs derived vs unresolved

| Visual quantity | Provenance | Rule |
|---|---|---|
| active resource units | **engine** | active `ResourceInterval`s at selected half-open time |
| allocated-idle units | **engine** | `ResourceInterval.state === "allocated-idle"` |
| released units | **engine** | `ResourceInterval.state === "released"` |
| QPU resource queue depth | **engine** | latest engine `QueueSample` at selected time |
| running / queued task identity | **engine** | half-open `TaskInterval` state |
| active communication | **engine-derived pairing** | pair `communication_started/completed` by `metadata.dependencyId`; zero-cost control edges create none |
| policy-held QPU tasks | **derived, deterministic under current v1** | QPU task has a `ready` interval before queue admission and corresponding `task_throttled(reason=maxInFlightQuantumByPool)` provenance; count as tasks, never resource units |
| dependency-gated task | **derived** | target has unresolved incoming dependencies at selected time from `WorkflowSpec` + completion/communication evidence |
| global synchronization / barrier label | **conditional** | safe for accepted Scenario B preset; not a generic inference from “multiple predecessors” alone |
| “waiting on own QPU result” as a persistent CPU-rank count | **unsupported** | frozen v1 has no cross-stage rank affinity |
| policy-held work converted to HPC units/ranks | **unsupported** | QPU-ready task does not own a persistent CPU allocation under v1 |
| cumulative cost over time | **producer gap for visualization** | only final cost metrics are authoritative today; graphics must not silently recalculate them |

Agent F has accepted Agent B's Round-2B causal-state derivation. Production visuals therefore use the exact-resource layer plus a separate causal-explanation layer. Derived or preset-authored causal labels retain provenance and are never presented as raw resource state.

## Static prototype A — Scenario B synchronization wall

Artifact: `scenario-b-sync-wall.svg`

Selected semantic time: **t = 4.0 s**, immediately after `quantum-a` completes and `quantum-b` begins running.

Accepted fixture evidence:

- CPU capacity/reservation: 4;
- CPU active: 0 units;
- CPU allocated-idle: 4 units;
- CPU released: 0 units;
- QPU running: `quantum-b`;
- QPU resource queue depth: 0 after the same-time handoff;
- policy-held tasks: 0;
- active positive-duration communication: 0;
- collective continuation has one unresolved quantum predecessor at this time; the accepted preset-authored semantic label is `collective synchronization wait`.

The prototype does **not** render “4 blocked CPU units.” It renders `4 allocated idle units` plus a separate `collective synchronization wait` explanation on the continuation.

Timeline evidence shown:

- CPU active 2 / allocated-idle 2 on `[0,1)`;
- CPU allocated-idle 4 on `[1,6)`;
- CPU active 4 on `[6,7)`;
- QPU active on `[1,6)`;
- QPU resource queue depth 1 on `[1,4)`.

## Static prototype B — Scenario D throughput/throttling

Artifact: `scenario-d-throughput-throttling.svg`

Selected semantic time: **t = 4.5 s**, after quantum task 2 completes and causal closure admits/starts the next work.

Accepted fixture state represented:

- CPU capacity: 6, release-aware;
- CPU active: 1 unit (`consumer-2`);
- CPU allocated-idle: 0;
- CPU released: 5 units;
- QPU running: `quantum-3`;
- QPU resource queue: 1 task (`quantum-4`);
- policy-held QPU work: 2 tasks (`quantum-5`, `quantum-6`) — task count, not CPU units;
- active positive-duration communication: 0;
- continuations 3–6 remain dependency-gated on their own quantum tasks;
- no global barrier: path 1 is already complete while path 2 continues and later paths occupy running/queued/held states.

The DAG lens uses six compact path rows to make asynchronous partial completion visible without animating geometry.

Timeline evidence shown:

- all six CPU prep tasks active on `[0,0.5)`;
- CPU capacity otherwise released except for each 0.5 s local continuation after its QPU completion;
- QPU active continuously on `[0.5,12.5)`;
- QPU resource queue depth 1 while the bounded pipeline has a queued follower;
- policy-held task count decreases 4 → 3 → 2 → 1 as admission slots open.

## Evaluation of the previous simple resource-card SVG

**Result: insufficient as the full-system debugger, useful as a primitive.**

What survives:

- stable logical `viewBox`;
- named semantic IDs/anchors;
- deterministic structured SVG;
- real accessible text;
- fixed geometry during state changes.

What must change:

- replace `Working / Idle / Blocked` with the frozen-v1 resource composition vocabulary;
- move waiting/causal concepts out of the resource-capacity partition;
- represent QPU resource queue and admission/policy hold separately;
- add explicit communication and dependency-gate surfaces;
- synchronize the system panel with DAG and analytical time cursor.

The visual system is therefore a **composed debugger board**, not a larger version of the original card.

## Validation

Committed checkpoint snapshots:

```text
B: 12860 bytes sha256=76607670b61e8c71
D:  7743 bytes sha256=bdc74868c70f0a7a
```

Validation performed:

- both committed SVGs carry an accessible `role="img"`, `<title>`, and `<desc>`;
- both contain the whole-system runtime plane, workflow DAG lens, and linked analytical strips;
- neither committed SVG uses the legacy `Blocked` state label;
- Scenario B explicitly separates four allocated-idle CPU units from one dependency-gated task;
- Scenario D explicitly separates QPU resource queueing from two policy-held tasks and labels tasks as distinct from resource units;
- both committed SVGs rasterized successfully with CairoSVG and were visually inspected;
- no staging/product code was changed;
- no production dependency was added.

## Checkpoint recommendation

**PORT / REIMPLEMENT after Agent F review.**

Port the full-system visual grammar, provenance separation, and debugger composition into the accepted React/TypeScript scaffold. Do not merge the prototype generator or static SVGs as production runtime code wholesale.

Remaining integration decisions for Agent F:

1. producer ownership for cumulative-cost time series;
2. ownership/API for selected-time causal explanations (playback, analysis adapter, or a dedicated presentation derivation module).

Agent B's accepted result resolves the visual ontology: exact resource accounting remains separate from task/dependency/policy explanations; Scenario B may use `collective synchronization wait` because that meaning is preset-authored.

Stop here for Agent F review.
