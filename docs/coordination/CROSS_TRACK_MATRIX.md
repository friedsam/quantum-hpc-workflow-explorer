# Cross-Track Matrix

Updated: 2026-10-02

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
