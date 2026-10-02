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

Checkpoint implementation ready for coordinator review.

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

## Handoff fields

- **Files intentionally proposed for promotion**
  - `web/assets/playback/trace-playback.mjs`
  - `tests/playback/trace-playback.test.mjs`
  - `tests/playback/fixtures/scenario-d-like.mjs`
- **Files created only for investigation:** none committed.
- **Dependencies added/changed:** none.
- **Interface changes requested:** none. The module consumes provisional v0 and adds presentation-only fields (`dwellMs`, `kind`, `repeatCount`) to Agent-B-owned keyframes.
- **Known failures/discarded approaches:** legacy Scenario D's independent counter/state machine is not reused; raw event-by-event frame swapping is rejected because it exposes high-frequency trace detail directly and caused prior blinking/readability problems.
- **Unresolved risks:** compression currently recognizes consecutive same-signature semantic groups. If Agent A's v1 trace emits a repetitive cycle as several distinct simulation-time signatures (A→B→C→A→B→C), add deterministic repeated-pattern compression rather than weakening the semantic signature.
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
