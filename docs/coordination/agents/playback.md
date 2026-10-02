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

Ready to start independently against v0 mock data.

## Handoff fields

Record:
- playback model;
- timing/compression rules;
- proof fixture/result;
- exact commit/path;
- discarded approaches;
- requested contract changes;
- promotion recommendation.
