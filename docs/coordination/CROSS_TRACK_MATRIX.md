# Cross-Track Matrix

Updated: 2026-10-12

| Track | Accepted contribution | Production location/status |
|---|---|---|
| A Engine | frozen v1 DES + tests | `app/src/engine/`; staged |
| B Playback | semantic keyframes + periodic compression + controller | `app/src/playback/`; staged |
| C UI | editable Builder / Explore / Compare app | `app/`; staged |
| D Graphics | React Flow+ELK DAG + structured SVG state view | implemented in C staging app |
| E Research | A-D acceptance framing, IBM/QAMP preset, Rao analytical baseline | evidence retained for methodology/presets |
| F Integration | curation, staging, E2E, deployment, main promotion | active |

## Current integration risks

1. No browser-level E2E/visual smoke test yet.
2. Current deployment still points at legacy `web/`, not the new `app/`.
3. User-facing repeat/template authoring is deferred; custom workflows are currently explicit DAGs.
4. Bundle is large enough to warrant later code-splitting review, but this is not a functional blocker.
5. No dependency lockfile is committed yet.

## Round 4G active status

| Track | Status / scope | Next checkpoint |
|---|---|---|
| A Engine | Active: high-multiplicity actor-state projection performance, semantics of admitted/blocked ranks | Bench 1,000-actor/200-job B; exact count/reason compatibility; F review |
| B Playback | Idle | No separate task pending actor projection result |
| C UI | Active: tutorial-scale public A-D, starting A 1,000 ranks and B 200 submitters | Builder/Explore/Compare tests; full playback timings; F review |
| D Graphics | Idle | Resume only for concrete UI defect |
| E Research | Idle | Accepted QAMP/Slurm contract remains authoritative |
| F Integration | Active: selective promotion/CI, staging coherence, browser acceptance | Review A/C checkpoints independently; preserve release gates |

**Accepted Round-4F staging:** `b52116ddaff7e435f16ab8c7e13336d0d9ffd7b6` and successful app CI `38119401020`. Frozen DES and .github Actions unchanged. New actor selectors are **above** the engine input/output contract. Source-derived performance extrapolation is not a measured B/C/D benchmark.
## Round 4H active status (supersedes Round 4G table above)

| Track | Current state | Gate |
|---|---|---|
| A | Round 4G actor index accepted/ported; active on D017 `queued` actor-wait trigger above frozen DES | Exact D50 admissions / actor semantics, CI, F review |
| B | Idle | No assignment |
| C | Round 4G public A accepted/ported; active on B200 public preset | Full playback, hidden expanded-graph work, browser/perf, CI, F review |
| D | Idle | No assignment |
| E | Idle | No assignment |
| F | Coordinator active; acceptance, selective staging, release | A/C review, C/D completion and browser smoke, lock/deploy/docs/main |

Integration CI after A-index: `38313659986` SUCCESS. Integration CI after C public A: `38313789867` SUCCESS. The 401-task B expansion and D actor-admission state are **not yet browser-accepted**. FTQC remains post-prototype documentation only.
## Round 4H Agent-A completion — 2026-10-12

| Track | Current status |
|---|---|
| A Engine | **CLOSED/IDLE** — `queued → task_queued` actor-wait adapter accepted, D1000 tests staged, CI green |
| C UI | **ACTIVE** — public B200 checkpoint; no C/D public demo acceptance yet |
| B / D / E | CLOSED/IDLE |
| F | ACTIVE — C review, browser, deployment/release |

Agent A source `099cdf46f2b3dfd00a1a1dd7d2a7fcff4e32bf3d`, integration `db73f506eeee0649ffe0ee972900695a528e92e9`, CI `38322036602` SUCCESS. No frozen DES or GitHub Actions changes. D1000 acceptance remains test-only; A's 1000 Idle at makespan is not a rendered next-loop Working phase.
## Current status — Round 4I, 2026-10-12
- A/B/D/E: CLOSED/IDLE.
- C: ACTIVE on source-faithful C communication wall; public A1000 and B200 accepted/ported.
- F: ACTIVE integration, browser and release gates.
- Staging B200: `39a8a628ce122342b88794d6c8914b657c81521c`; CI `38322560759` SUCCESS. Deferred D018 next-cycle fidelity and FTQC D015 future scope preserved.
## Round 4J status — 2026-10-12

| Track | Status / next gate |
|---|---|
| A / B / D / E | CLOSED/IDLE |
| C | ACTIVE on public D: 1,000 ranks, max-in-flight 50, faithful admission/queue/actor state and watchable playback |
| F | ACTIVE for C review, browser acceptance, release hardening, main gate |

Public C1000 accepted on integration `53248bf1a2c7488d52982a77191919f5ff4b0b0e`, CI `38326633662` SUCCESS. Five synthetic 200-rank cohorts mean 5 aggregate QPU requests, **not 1,000 independently simulated QPU calls**. FTQC remains post-prototype.
