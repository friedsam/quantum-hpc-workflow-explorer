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
## Coordinator checkpoint — 2026-10-12

**F Round 4G review accepted:** indexed actor projection (A) and public 1,000-rank Scenario A (C). Selective app staging commits `e8d872c67e6e0530c4bcfb14ca7a7818ccb70ec9` and `d57abf519babb9a8a9770b6ff9c6dd11927f3b6f`; respective CI runs `38313659986` and `38313789867` SUCCESS. Frozen DES/GitHub Actions unchanged. Documentation at D016 and Round 4G final review.

**Round 4H:** A is activated for minimal high-level `queued` actor wait trigger (D017); C is activated for public B200 and whole-playback/browser perf. Both STOP at bounded checkpoint. Do not represent actor-blocked counts through UI guesswork; high-level wait claims + exact DES events only. C must not render expanded 401-node DES graph while Advanced is closed.

**F next:** review A/C; port selectively; run CI/browser acceptance; then C/D public conversion; dependency lock, deployment root migration, README, main promotion. FTQC D015 documentation-only.
## Coordinator checkpoint — 2026-10-12 (Round 4H A accepted)

**A repair:** PORT accepted; `queued` authored actor-wait event compiles to existing frozen-v1 `task_queued`. Integration `db73f506eeee0649ffe0ee972900695a528e92e9`; CI `38322036602` SUCCESS. Source `agent/engine@099cdf46f2b3dfd00a1a1dd7d2a7fcff4e32bf3d`; CI `38321701185` SUCCESS. No DES event/scheduler modification. D stress fixture in `app/tests/fixtures`, no public D conversion yet. See D018/REVIEW_QUEUE.
**Agent status:** A CLOSED/IDLE, C ACTIVE on B200, B/D/E idle. C should consume queued-wait contract at its natural heartbeat and must not be interrupted before B checkpoint. F next reviews B then coordinates C/D and release gates. D's full return to 1000 Working requires explicit authored next cycle; cannot fabricate it at final makespan.
## Coordinator checkpoint — 2026-10-12 (B200 accepted, C underway)

Agent-C public B200 PORT accepted from `c80de454f1814dd42e7878a80113affea9760d67` to integration `39a8a628ce122342b88794d6c8914b657c81521c`, CI `38322560759` green (122/122 tests). Preserves frozen DES and A's D018 `queued` actor-wait. B200 logical view 3 tasks / 1,000 actors, 200 serial QPU results, explicit synchronization wall; state/provenance and lazy diagnostics validated. Node timing is not browser proof.

D019/Round 4I: C ACTIVE for source-grounded communication-dominated Scenario C with QPU idle during positive transfer + actor Blocked, no sustained queue or global barrier. A/B/D/E idle. Next F gate: C review/port, then D, browser acceptance, npm lock/CI, deployment, final docs and main. FTQC future only.
