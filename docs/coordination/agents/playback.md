# Agent B — Playback / Simulation Visualization

Branch: `agent/playback`

## Mission

Make exact simulation traces human-watchable without changing simulation semantics.

## Initial assignment

Using a mock trace shaped like `SimulationResult`, design and demonstrate:

`events → semantic groups → VisualKeyframes → playback scheduler → renderer`

Stress case: a Scenario-D-like run with hundreds/thousands of repetitive service/completion events.

Required behavior:
- first meaningful transitions readable at human speed;
- repetitive steady regime compressed/accelerated;
- final transitions readable at human speed;
- no blinking;
- stable geometry;
- deterministic replay;
- step mode maps back to source event/keyframe ranges.

## Boundaries

Do not:
- change queue/resource/task semantics;
- compute authoritative metrics;
- hand-code scenario-specific counters as a substitute for trace consumption.

## Current status

Frozen-v1 compatibility pass complete; ready for coordinator review.

### Playback model

Implemented a dependency-free presentation pipeline against the provisional v0 `SimulationResult` shape:

1. **Validate exact source order.** Playback rejects non-increasing `seq` or backward `simTimeS`; it never sorts/reorders the engine trace.
2. **Semantic groups.** Events occurring at the same simulation time become one presentation moment. Repeat signatures use event type + resource pool and intentionally ignore task id, allowing identical work on different tasks to be recognized as repetitive.
3. **Repetitive-run compression.** Consecutive groups with the same semantic signature are compressed only after a configurable threshold. The first two and last two groups remain explicit by default; the middle becomes one keyframe linked to the exact source event sequence range.
4. **Visual snapshots.** Snapshots are derived only from explicit `resourceIntervals`, `taskIntervals`, and `queueSeries` at the keyframe simulation time. Engine `metrics` are neither read nor recomputed.
5. **Presentation schedule.** Default dwell: transition 1100 ms, detail 850 ms, compressed 500 ms, terminal 1200 ms. Presentation time is separate from simulation time.
6. **Playback controller.** Play/pause/speed/step/seek use a caller-supplied monotonic wall-clock timestamp. Step mode exposes the exact `sourceEventSeqRange` of the current keyframe.
7. **Renderer driver.** A `requestAnimationFrame` adapter calls the renderer only when the semantic keyframe index changes. It pauses if the document becomes hidden, avoiding a background-tab time jump. Layout/geometry remains renderer-owned and is not mutated by the scheduler.

### Proof fixture/result

Fixture: `tests/playback/fixtures/scenario-d-like.mjs`

The fixture is explicitly synthetic and is not a second simulator. It emits a v0-shaped result with a bounded-QPU-queue-like ramp, 1000 repetitive service cycles, and a drain transition.

Default proof result:
- 3005 source events;
- 1005 semantic groups;
- 10 visual keyframes;
- one compressed keyframe represents 996 middle service cycles;
- source-event sequence coverage remains complete and ordered;
- total default presentation duration is 10.0 s.

### Validation

Command:

```bash
node --test tests/playback/trace-playback.test.mjs
```

Result: **9/9 passing**.

Tests cover:
- deterministic keyframe generation;
- source trace coverage through compression;
- metrics untouched/no playback metric calculation;
- non-zero minimum dwell and monotonic presentation timestamps;
- step-to-source-event mapping;
- refresh-rate-independent playback clock;
- dwell-boundary lookup;
- no compression below threshold;
- rejection of source traces whose ordering moves backward.

### Playback controls/pacing recommendation

For integration, expose only:
- Play/Pause;
- Restart;
- Previous/Next semantic keyframe;
- 0.5× / 1× / 2× speed (or equivalent bounded selector);
- current simulation-time range and source-event range in step/inspection mode;
- an explicit `×N` marker on compressed repetitive keyframes.

Do not expose raw per-event autoplay as the primary viewing mode. Do not autoplay on page load.

### Frozen-v1 compatibility pass

Coordinator assignment consumed from `agent/integration` commit `ef44462bfbf21621fe669558001f29377995dc2b`.

[verified] Compatibility target:
- frozen shared contract: `SimulationResult` v1;
- real engine source: Agent A commit `4958bdcfda30a5e69127e4756c8575540e3a0f65`;
- pinned real result: `tests/playback/fixtures/engine-v1-minimal-result.mjs`.

[verified] Snapshot interval correction:
- v1 intervals are strictly half-open `[startS,endS)`;
- zero-width intervals are empty and are never rendered as active;
- completion remains visible only through the authoritative `task_completed` event;
- same-time queue snapshots use the last engine-provided sample at that simulation time.

[verified] Real minimal trace:
- 24 engine events;
- 8 semantic groups/keyframes;
- at QPU handoff `t=5.5`, the completed task is absent and the next QPU task is running;
- at terminal `t=9.25`, no task/resource interval remains active.

[verified] Multi-signature compression is required for real v1 traces. A live 24-cycle already-expanded CPU↔QPU DAG executed through Agent A's frozen engine produced:
- 286 source events;
- 96 semantic groups;
- a deterministic repeating 4-group signature cycle;
- 0 compressed groups under the original identical-signature-only algorithm.

The bounded periodic compressor now detects the shortest repeated semantic-signature pattern up to 8 groups, requires at least 4 repeats, preserves at least one full pattern at each boundary, and never modifies or reorders source events.

[verified] With the compatibility correction, the same real-engine stress trace produces:
- 13 visual keyframes;
- one compressed 4-step regime representing 21 middle cycles;
- complete ordered source-event provenance.

[verified] Exact committed playback blob `c77ad95054aaa5315d9d62c7a3309a0b73c3e3a0` passed 14/14 compatibility assertions, covering the original playback invariants plus frozen-v1 half-open snapshots, zero-width interval rejection, periodic compression, and live-engine provenance.

No shared v1 interface change is requested.

## Handoff fields

- **Files intentionally proposed for promotion**
  - `web/assets/playback/trace-playback.mjs`
  - `tests/playback/trace-playback.test.mjs`
  - `tests/playback/fixtures/scenario-d-like.mjs`
- **Files created only for investigation:** none committed.
- **Dependencies added/changed:** none.
- **Interface changes requested:** none. The module consumes provisional v0 and adds presentation-only fields (`dwellMs`, `kind`, `repeatCount`) to Agent-B-owned keyframes.
- **Known failures/discarded approaches:** legacy Scenario D's independent counter/state machine is not reused; raw event-by-event frame swapping is rejected because it exposes high-frequency trace detail directly and caused prior blinking/readability problems.
- **Unresolved risks:** periodic detection is intentionally bounded to patterns of at most 8 semantic groups and at least 4 repeats. This is a presentation-safety bound, not an engine semantic limitation; expand only if a validated workflow requires a longer repeated cycle.
- **Promotion recommendation:** **PORT** the playback module/tests into the new scaffold after Agent F freezes the v1 `SimulationResult`; retain the fixture as regression evidence.


## Coordinator review — 2026-10-02

**Agent F decision:** **PORT — accepted checkpoint, integration held until engine v1 contract is frozen.**

### Accepted

- Correct architectural boundary: consumes a `SimulationResult`-shaped trace and does not simulate workflow execution.
- Exact source ordering is preserved and invalid backward traces are rejected.
- Presentation time is explicitly separated from simulation time.
- Repetitive steady-state events are compressed while retaining source-event sequence ranges.
- Playback clock is deterministic and wall-clock/refresh-rate independent.
- Browser adapter renders only on semantic keyframe changes and pauses on page hide.
- No production dependencies were added.
- Synthetic Scenario-D-like fixture is correctly labeled as a playback stress fixture rather than engine evidence.
- 9/9 reported tests cover the main contract claims.

### Integration prerequisites / follow-up

1. Agent A v1 must define interval-boundary semantics used by snapshots (the current implementation assumes half-open active intervals: `startS <= t < endS`).
2. Re-check compression against the real v1 trace. Current compression handles consecutive identical semantic signatures; if the engine emits a repetitive multi-state cycle (for example A→B→C repeated), B should add deterministic repeated-pattern compression rather than weakening signatures.
3. Coordinate reduced-motion / animation-disable behavior with Agent C during UI integration. No autoplay remains the default.
4. The current path `web/assets/playback/` is not a commitment to the final scaffold. Agent F may port/rehome the module and tests if Agent C adopts a new React/TypeScript structure.

### Promotion scope

Proposed for later port after v1 compatibility check:
- `web/assets/playback/trace-playback.mjs`
- `tests/playback/trace-playback.test.mjs`
- `tests/playback/fixtures/scenario-d-like.mjs`

Do **not** merge the whole branch to main. No further Agent-B work is required until Agent A's v1 trace contract or Agent F requests a compatibility pass.


## Next task — v1 compatibility pass (2026-10-02)

Agent F has frozen shared engine contract v1 on `agent/integration`.

Start one bounded compatibility pass now.

### Required work

1. Read the frozen `docs/coordination/INTERFACE_CONTRACTS.md` from `agent/integration`.
2. Inspect the repaired engine output contract on `agent/engine`; do **not** merge/copy the engine implementation into the playback branch.
3. Exercise playback against at least one actual v1 `SimulationResult` trace generated by the repaired engine semantics.
4. Verify:
   - half-open task/resource interval handling;
   - `queued` task state replacing v0 generic waiting;
   - admission/policy wait is not inferred from queue depth;
   - `aggregateCommunicationSeconds` remains untouched by playback;
   - zero-cost control edges create no fake communication keyframes;
   - exact source event provenance remains intact.
5. Determine whether real v1 traces require repeated **multi-signature-cycle** compression. Add it only if the actual trace demonstrates the need.
6. Re-run playback tests and add only regression tests required by v1 compatibility.

### Boundaries

- no new playback features;
- no UI work;
- no engine semantics;
- no raw event autoplay;
- no geometry/layout work.

### Handoff

Report:
- exact v1 trace used;
- compatibility defects found/fixed;
- test result;
- whether multi-signature compression was necessary;
- exact commits/files proposed for PORT.

After this pass, Agent B should stop pending integration.


## Coordinator final review — 2026-10-02

**Agent F decision:** **PORT accepted; Agent B CLOSED/IDLE.**

The frozen-v1 compatibility pass satisfies the requested contract checks:

- actual Agent-A v1 trace used and pinned with producer commit provenance;
- half-open `[startS,endS)` snapshots handled correctly;
- zero-width intervals are not rendered active;
- v1 `queued` state is consumed directly;
- queue samples remain engine-provided evidence;
- playback does not touch/recompute `aggregateCommunicationSeconds`;
- source-event provenance remains complete and ordered;
- real v1 stress trace demonstrated that multi-signature periodic compression was necessary;
- bounded periodic compression reduced 96 semantic groups to 13 keyframes while preserving source ranges;
- 14/14 compatibility assertions reported passing.

### One integration wording constraint

Periodic compression detects a repeated **event-signature pattern**, not necessarily an algorithmically declared loop. Therefore production UI should label a compressed multi-signature segment neutrally (for example, `Repeated 4-step activity ×21`) unless explicit workflow metadata proves that it is a loop/cycle.

Do not present heuristic periodicity alone as semantic loop identity.

This is a presentation-label constraint, not a request for further Agent-B work.

### Promotion scope

PORT:
- playback/keyframe pipeline;
- periodic-compression logic;
- controller/RAF driver;
- v1 compatibility tests and pinned trace evidence.

Rehome/rewrite paths as needed in the React/TypeScript scaffold. Do not merge the laboratory branch wholesale.

No further Agent-B work is required unless integration reveals a concrete compatibility defect.


## Round 2B task — causal system-state derivation

**Status:** CHECKPOINT COMPLETE — awaiting Agent F review; Agent B stopped.

Agent F has reconciled A/E and accepted the A-D execution mechanisms. Frozen engine v1 remains unchanged for this task.

### Goal

Determine whether the human-facing whole-system state needed by the Explorer can be **derived defensibly** from frozen `WorkflowSpec + SimulationResult`, especially the HPC distinction among working, blocked/waiting, policy-held, idle, and released capacity.

Use the accepted A-D fixtures from Agent A and the source-grounded contract from Agent E.

### Required output

For each scenario and selected semantic timepoints, attempt to derive a non-overlapping explanatory snapshot containing only quantities justified by the model, for example:

- classical resource units actively working;
- QPU active / queued;
- active communication dependencies;
- policy-held quantum work / admission wait;
- fixed-reservation allocated-idle units;
- dependency-gated classical continuation;
- released capacity.

Then answer explicitly:

1. Can a top-level `Working / Blocked / Idle / Released` HPC view be derived without ambiguity?
2. If `Blocked` can be derived, can its cause be separated into:
   - waiting on own QPU result,
   - waiting on communication,
   - waiting on global synchronization/join?
3. Can policy-held Scenario-D work be converted into an HPC-rank/resource-unit count without inventing affinity that v1 does not model?
4. What quantities are exact engine evidence vs explanatory inference?
5. What is the smallest additional provenance field/event, if any, needed from the engine?

### Rules

- Do not change engine v1.
- Do not change playback timing/compression.
- Do not make visualization decisions beyond the minimum schema needed to communicate findings.
- Do not equate `allocated-idle` with `Blocked`.
- Do not infer persistent rank identity across CPU → QPU → CPU stages unless the model explicitly proves it.
- Prefer a derived explanation layer over an engine change if it is unambiguous and deterministic.
- If derivation is ambiguous, demonstrate the ambiguity with a concrete A-D counterexample.

### Deliverable

- proposed `SystemStateSnapshot` / explanation schema;
- A-D example snapshots;
- exact-vs-derived provenance table;
- any proven frozen-v1 explanatory gap;
- recommendation: DERIVE / EXTEND ENGINE / MIXED.

Stop after this checkpoint for Agent F review.

### Agent B Round 2B checkpoint

[verified] Deliverable committed:

- `docs/coordination/agents/playback-round2b-causal-state.md`
- checkpoint commit: `fcc7e91ae95497cc7e1ffb2f58f193793f900770`

[verified] Evidence used:
- Agent A engine head `0229d60ba28e2f728fac092e76affe74e0e614c4`;
- engine blob `4023b3daf8ae7e50c6e7b7be8a886e2ea392dc84`;
- accepted A-D fixture blob `5c4e64f58d5e0be4e8db5cc1697736b254f12482`;
- Agent F reconciled acceptance blob `939782b8d34a0e50962eb2772d47dfd1d4778a8a`;
- Agent E scenario-contract blob `b8351375ddfb0103b73db3c93444319689ebed09`.

[verified] Main result:
- exact resource state can be partitioned as active / allocated-idle / released;
- causal task state can be deterministically overlaid from DAG + trace;
- `Blocked` cannot be a mutually exclusive classical resource-unit bucket without inventing task→resource/rank affinity;
- Scenario D policy-held QPU task counts cannot be converted to HPC-rank counts;
- communication wait is directly attributable;
- QPU-predecessor gating and structural joins are derivable, but generic labels `own result` and `global synchronization` require authored semantic provenance.

[verified] Concrete capacity counterexamples are documented for A-D. Example A at t=2 has CPU capacity 2 = 1 active + 1 released while a 1-unit downstream task is QPU-gated; treating that demand as a blocked CPU produces an impossible 3-unit total.

[opinion] Recommendation: **DERIVE** a two-layer explanation snapshot over frozen `WorkflowSpec + SimulationResult`. No engine-v1 change is recommended. If stronger wording is required, use existing `TaskSpec.metadata` for local-result vs collective-join semantics. Exact rank-level blocked counts would require a substantive persistent affinity model and should not be added merely for presentation.

No playback timing/compression, UI, graphics, or engine code was changed in Round 2B.

**Agent B stops here pending Agent F review.**


## Coordinator Round 2B review — 2026-10-03

**Agent F decision:** **DERIVE accepted; Agent B CLOSED/IDLE.**

### Accepted finding

Frozen v1 is sufficient for the current 10-day product **provided the UI keeps two state spaces separate**:

1. exact resource allocation/execution state;
2. causal task/dependency explanation.

A generic mutually-exclusive HPC partition `Working / Blocked / Idle / Released` cannot be derived rigorously from v1 because pending task demand is not bound to persistent classical resource/rank identity.

### Accepted exact resource view

For each classical pool:
- Working / active units = exact;
- Allocated-idle units = exact;
- Released units = exact;
- queued task identities = exact.

For QPU pools:
- active units = exact;
- queued task identities/depth = exact.

### Accepted causal overlay

Deterministically derive:
- active communication dependencies;
- policy-held QPU tasks;
- classical continuations gated by unresolved dependencies;
- QPU-predecessor gating;
- structural multi-input joins.

Do not convert these task-level causal states into blocked classical resource-unit counts unless explicit authored affinity/provenance exists.

### Terminology constraint

Generic UI:
- use `working/active`, `allocated-idle`, `released` for resource units;
- use `waiting/gated by ...` for causal work state;
- do not claim `blocked ranks` generically.

Preset-specific explanatory metadata may support stronger labels such as:
- `local QPU-result wait`;
- `collective synchronization wait`.

Exact rank-level blocked counts would require a persistent actor/allocation-affinity model and are deferred rather than added to frozen v1.

### External sanity check

This separation is consistent with scheduler practice: Slurm records a job state such as PENDING separately from a reason such as Dependency or Resources. This is only corroboration; the project decision is based on the A-D counterexamples.

### Promotion scope

PORT the Round-2B causal-state specification into integration documentation. No engine or playback code change is required.

Agent B can stop unless integration reveals a concrete derivation defect.
