# Cross-Track Matrix

Updated: 2026-10-11

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
