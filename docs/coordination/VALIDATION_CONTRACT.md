# Validation Contract

Shared engineering/research evidence contract for all tracks.

## Claim labels

Use when documenting research/model assertions:

- **[verified]** — primary source or a reproducible project test/run directly supports it.
- **[likely]** — strong inference; not directly established.
- **[uncertain]** — unresolved.
- **[opinion]** — design recommendation/judgment.

Do not combine separately true facts into a causal claim without testing/labeling the missing link.

## Engine invariants

At minimum, Agent A must test:

1. **Dependency safety:** a task cannot begin before required predecessors/data are available.
2. **Resource capacity:** active allocation never exceeds configured capacity.
3. **Queue consistency:** queue depth never becomes negative; bounded policies respect their configured bound.
4. **Determinism:** identical deterministic inputs produce identical event ordering/metrics.
5. **Time monotonicity:** simulation event time never moves backward.
6. **Accounting consistency:** resource intervals integrate to reported resource-time metrics.
7. **Completion consistency:** makespan equals the final required completion time.
8. **Limiting cases:** zero latency, effectively infinite QPU capacity, strictly serial graph, saturated QPU, and fixed-vs-release-aware allocation behave sensibly.

## Playback invariants

Agent B must demonstrate:

- no blinking caused by raw high-frequency event exposure;
- stable geometry during state changes;
- deterministic playback for the same `SimulationResult`;
- user-visible minimum dwell time for meaningful states;
- repetitive event sequences can be compressed without changing metrics;
- step mode can identify the underlying event/keyframe relationship.

## UI invariants

Agent C must demonstrate:

- UI metrics equal the engine result exactly;
- parameter edits produce a new explicit `WorkflowSpec`;
- comparison mode clearly identifies the two configs/results;
- invalid workflow inputs are rejected/explained rather than silently normalized where semantics would change;
- core use is possible without interpreting legacy scenario animations.

## Graphics/toolchain validation

Agent D compares candidate approaches on the same benchmark diagram and edits.

Required benchmark:
1. reproduce one representative old Explorer system/workflow graphic;
2. move the QPU block;
3. add a GPU lane;
4. change serial flow to fork/join;
5. assess whether alignment/layout survives without reconstruction.

Evaluate:
- edit robustness;
- deterministic layout;
- runtime suitability;
- agent editability;
- accessibility/text quality;
- dependency/runtime cost;
- exportability.

## Research/model validation

Agent E should distinguish:
- published equations/results;
- platform/tool capability claims;
- project-specific assumptions;
- illustrative presets.

The Explorer must not present synthetic queue times/service times as measured production predictions.

## Promotion evidence

A contribution proposed for integration must include:
- exact commit/path;
- tests/checks;
- known assumptions;
- known failures;
- affected shared interfaces;
- recommendation for promotion status.

Agent F decides final promotion status.
