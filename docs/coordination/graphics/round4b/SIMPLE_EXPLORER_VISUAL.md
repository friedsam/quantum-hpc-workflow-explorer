# Round 4B — Simple Default Explorer Visual Language

Agent D · `agent/graphics` · 2026-10-10  
Status: **checkpoint candidate for Agent F review**

## Scope

This task defines the default Explore surface after Round 4A restored logical task multiplicity and persistent actor/rank semantics above the frozen DES.

Inputs:
- Agent A Round-4 actor model;
- Agent F Round-4B instructions;
- current Round-3 integrated Explore surfaces;
- accepted React Flow + ELK workflow renderer and structured-SVG runtime grammar.

No staging/application code is changed by this checkpoint.

## Default product hierarchy

The default Explore page should answer three questions in this order:

1. **What is happening now?**
2. **Where is the workflow active or waiting?**
3. **What can I do next — play, pause, or step?**

Everything mainly required for implementation audit moves behind **Advanced / Diagnostics**.

### 1. Current-state header

Always visible:
- authored workflow name;
- selected simulation time / makespan;
- one plain-language semantic-state sentence;
- Previous / Play-Pause / Next;
- one shared simulation-time rail;
- Advanced / Diagnostics disclosure.

Do not show raw event sequence numbers, keyframe counts, compilation IDs, or presentation-time bookkeeping by default.

### 2. Actor state when authored actors exist

For each persistent actor group show:
- actor-group label and total actor count;
- first-class **Working / Blocked / Idle** counts;
- blocked-reason badges;
- explicit note when blocked reasons overlap.

Actor state is separate from CPU/GPU/QPU resource allocation.

For large groups such as 1000 ranks, aggregate counts and proportional bars. Do not render one glyph per rank by default.

### 3. Generic fallback when actors do not exist

Do not invent Working / Blocked / Idle actor counts.

Show compact path/system progress instead:
- complete paths;
- resumed classical paths;
- QPU-running paths;
- resource-queued paths;
- policy-held paths.

### 4. Quantum bottleneck

Always visible for hybrid workflows:
- current QPU-running work;
- resource-queued work;
- policy-held work;
- either a synchronization-wall callout or explicit **no global synchronization** callout where authored semantics support it.

Resource queue and policy hold remain distinct.

### 5. Logical authored DAG

The default graph source is the authored `WorkflowDesign`, not the expanded compiled `WorkflowSpec`.

Rules:
- one authored logical task = one node;
- multiplicity N is a compact `×N` badge;
- playback changes status styling/text only; geometry remains fixed;
- current bottleneck/wait edge may be emphasized;
- expanded DES graph moves to Advanced.

### 6. Minimal resource context

Resource facts remain secondary to actor state in actor-aware workflows.

Examples:
- `CPU · active 0 · allocated-idle 4`;
- `QPU · active 1 / capacity 1`.

## Default vs Advanced mapping

| Current Round-3 surface | Round-4B placement |
|---|---|
| PlaybackPanel | **Default, simplified**: Previous / Play-Pause / Next + shared simulation time |
| Shared time slider | **Default** |
| WorkflowDag over compiled WorkflowSpec | **Replace in Default with authored logical DAG**; compiled graph → Advanced |
| Actor-aware state summary | **Default, new** when authored actor semantics exist |
| Compact QPU running / queue / policy-held | **Default, new/reduced** |
| MetricsGrid | **Advanced**; optionally 2–3 high-value summary metrics later |
| CompilationProvenance | **Advanced** |
| FullSystemDebugger | **Advanced** |
| AnalyticalStrips | **Advanced** |
| TaskTimeline | **Advanced** |
| ResourceTimeline | **Advanced** |
| QueueEvidence | **Advanced** |
| Assumptions | **Advanced** |
| source event seq / keyframe count / presentation duration | **Advanced** |
| expanded compiled DES graph | **Advanced** |

## Logical node/tag grammar

### Multiplicity badge

`×N`

Meaning: number of logical task instances represented by this authored node.

Examples:
- `Preparation ×2`
- `Quantum evaluation ×2`
- `Collective ×1`
- `Quantum evaluation ×200`

Accessible name should include “logical multiplicity N”.

### Resource-per-instance tag

Separate secondary footer:

- `CPU · 1 unit / instance`
- `QPU · 1 unit / instance`
- `CPU · 4 units / instance`

Meaning: resource allocation required by **each compiled task instance**.

Never write `×2 CPU` or otherwise merge multiplicity and resource demand.

### Actor-group label

Third independent quantity:

`MPI ranks · 4 actors`

Actor count does not belong in the multiplicity badge.

### Current-state tag

Fourth visual channel:
- RUNNING
- WAITING
- COMPLETE
- POLICY HELD
- RESOURCE QUEUED

Use text plus border/pattern/fill; color is not the sole state encoding.

## Scenario B prototype

Artifact: `scenario-b-simple-explorer.svg`

Selected time: **t = 5.0 s** from the accepted Round-4A actor fixture.

Authoritative actor projection:
- MPI ranks = 4;
- Working = 0;
- Blocked = 4;
- Idle = 0;
- blocked reason `global-synchronization` applies to all 4;
- blocked reason `quantum-result` additionally applies to rank 2;
- blocked-reason counts overlap while top-level actor counts do not.

System context:
- quantum instance 2/2 is running;
- QPU resource queue = 0;
- policy-held quantum work = 0;
- CPU fixed reservation = 4; active 0; allocated-idle 4.

Logical authored DAG:
`Preparation ×2 → Quantum evaluation ×2 → Collective ×1`

Per-instance resource tags:
- Preparation: `CPU · 1 unit / instance`;
- Quantum: `QPU · 1 unit / instance`;
- Collective: `CPU · 4 units / instance`.

Primary callout:
`SYNC WALL — 4 / 4 ranks blocked · waiting for complete quantum result set`.

## Scenario D prototype

Artifact: `scenario-d-simple-explorer.svg`

Selected time: **t = 4.5 s** from the accepted scaled Scenario-D fixture.

Scenario D currently has no authored persistent actor group, so the prototype deliberately uses path/system progress instead of invented blocked-rank counts.

At the selected state:
- 6 asynchronous paths total;
- path 1 complete;
- path 2 has resumed classical continuation;
- quantum 3 running;
- quantum 4 resource queued;
- quantum 5 and 6 policy held;
- QPU capacity = 1;
- CPU release-aware state = 1 active / 5 released;
- no global synchronization.

Compact partition:
`complete 1 | classical resumed 1 | QPU running 1 | resource queued 1 | policy held 2`

Logical authored DAG:
`Preparation ×6 → Quantum evaluation ×6 → Classical continuation ×6`

Primary callout:
`ASYNC PIPELINE — results release paths independently · no global sync`.

## Playback behavior

Default playback is one semantic transport bar:
- Previous / Play-Pause / Next;
- selected simulation time and makespan;
- one scrubber;
- plain-language semantic label;
- no autoplay on page load;
- no node movement during playback;
- count changes update text/bar segments, not geometry.

Compressed repetitive activity uses a neutral label such as `Repeated activity ×N`. Detailed source-event ranges and compression provenance remain Advanced.

## Scaling

- Actor groups: aggregate counts + proportional state bar at large N; no one-glyph-per-actor default.
- Logical multiplicity: badge text scales, node size does not scale with N.
- Multiple actor groups: one state card per group; do not merge counts unless the model explicitly defines that aggregation.

## Accessibility / clarity requirements

- status is never conveyed by color alone;
- every logical node accessible name includes label, multiplicity and resource demand;
- playback controls have explicit text labels;
- the Advanced / Diagnostics control clearly indicates hidden detail;
- preserve React Flow keyboard/screen-reader behavior;
- preserve reduced-motion behavior.

External sanity-check references:
- https://www.w3.org/WAI/people-use-web/tools-techniques/presentation/
- https://www.w3.org/WAI/WCAG2/supplemental/objectives/o2-find/
- https://www.w3.org/WAI/WCAG2/supplemental/objectives/o1-understandable/
- https://reactflow.dev/learn/customization/custom-nodes
- https://reactflow.dev/learn/advanced-use/accessibility

## Checkpoint recommendation

**PORT / REIMPLEMENT** this information hierarchy and visual grammar after Agent F reconciles Agent B's actor-aware playback view model.

Do not port the static SVG prototypes as runtime implementation wholesale.

No new graphics dependency, engine change, or shared-contract change is requested.
