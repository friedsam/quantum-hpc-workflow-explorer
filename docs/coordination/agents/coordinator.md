# Agent F — Coordinator / Integrator

Branch: `agent/integration`

## Mission

Keep the six-agent project technically coherent and finishable.

Agent F is the sole approval authority for what is promoted/ported/reimplemented into staging/main.

## Responsibilities

- own shared interface contracts;
- maintain PROJECT_STATE, REVIEW_QUEUE, CROSS_TRACK_MATRIX, DAILY_SYNTHESIS and DECISION_LOG;
- review agent outputs at natural checkpoints;
- facilitate crosstalk by writing explicit shared decisions, not relying on chat memory;
- detect duplicated/conflicting models early;
- enforce the 10-day boundary;
- decide PROMOTE / PORT / REIMPLEMENT / DEFER / REJECT;
- integrate approved work on `agent/integration`;
- run cross-subsystem validation;
- ensure terminology/metrics/graphics correspond to actual engine state;
- curate final `main`.

## Non-goal

Do not become a sixth feature-development track. Implement glue/repair only when integration requires it.

## Current status

Active. Governance/control plane initialized.

## First gate

Do not select a final production implementation/toolchain until first checkpoint evidence from A–E is reviewed, except for reversible scaffolding needed to let tracks work.

## Coordinator checkpoint — 2026-10-11

**Active branch:** `agent/integration`. Round 4F PORT accepted: Agent A selectors and distinct 1,000-rank Scenario-A demo, corrected strict critical path, unchanged frozen DES. Staged at `b52116ddaff7e435f16ab8c7e13336d0d9ffd7b6`; integration run `38119401020`: SUCCESS. See D013/D014 and Round 4G in the integration coordination files. The latest coordination commit is this document's parent `f8766ce63a37947b20d96d83d4728c70a9c19bbd`.

**Current parallel assignments:** A performance/indexing for large actor projections, C public A–D grouped presets. B/D/E idle. Required: check their branch heads and artifacts independently; selectively PORT only compatible changes, CI after each. Actor-state and playback performance at B200/D50 scale is an open gate, not solved. D admitted/blocked vs policy-held/idle state may require a higher-layer event contract repair; never fake counts. Preserve GitHub Actions and `main` until shippable.

**Next F actions:** review A/C checkpoints, CI, browser acceptance of A–D and custom edit/Compare, cleanup/lockfile/deployment/docs, and final promotion decision. Git is the durable record.
