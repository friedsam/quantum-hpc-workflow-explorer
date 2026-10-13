# Workflow Explorer — Release Acceptance (Round 4K)

**Owner:** Agent F. **Status:** feature-complete A–D on `agent/integration`; not yet browser/release accepted.  
**Code checkpoint:** `e49954bc9caf5f3e18472b3d229c96b9ebdd2c70` — GitHub Actions `38332756103` SUCCESS (143/143 Node tests, TypeScript, Vite).  
**Source:** `AGENTS.md`, D021/D022, QAMP `scenario-a.md`–`scenario-d.md`; all numerical simulation timings below are **synthetic**.  
**Main policy:** do not promote `main` until acceptance evidence is recorded; no further model features are part of this gate.

## 1. Required reproducible build (P0 — pending)

- [ ] Commit a reviewed `app/package-lock.json` for Node 22 and current `app/package.json`; no unapproved production dependency changes.
- [ ] In a clean Node 22 checkout: `cd app && npm ci --no-audit --no-fund && npm test && npm run build`.
- [ ] Preserve existing GitHub Actions workflows and validation triggers. After reviewing the lockfile, change the *integration* app-validation install step from `npm install` to `npm ci` and confirm fresh CI success.
- [ ] Review the Vite bundle warning (~610 kB gzip JS). Non-blocking only if actual demo startup/navigation is responsive.

## 2. Real-browser acceptance (P0 — not performed by Node CI)

Run the `agent/integration` app with Node 22 (`cd app; npm install; npm run dev`) or a deployed preview built from the **same SHA**. Record tested browser/version, branch/commit and screenshot/video or reproducible steps for each. The desktop UI must not freeze when scrubbing, expanding/closing diagnostics, navigating between Builder/Explore/Compare, or loading a new preset.

- [ ] **A** — 4 logical tasks / 1,000 persistent ranks: t=0.5 → 1,000 Working; t=1.5 → 999 Working / 1 Blocked; t=4 → restored 1,000 Working with QPU idle; local t=8 precedes overall t=10. QPU queue/policy wait = 0. No unexpected status overlap.
- [ ] **B** — 3 logical nodes / 401 compiled tasks: 200 submitters and 1,000 actors. t=1 → 200 Blocked /800 Idle, QPU Run1 / resource Queue0 / PolicyHeld199; t=2 → all 1,000 Blocked through authored global result gate; t=201.5 → all 1,000 Working. Observe a coherent synchronization-wall explanation. Verify opening the 401-task Advanced graph is usable (collapsed content must not mount/layout).
- [ ] **C** — 15 logical tasks / five *aggregate* 200-rank cohorts (only five aggregate QPU calls). t=4.5 → all 1,000 Blocked with five active transfers, QPU Run0 / Queue0; t=8.5 → 200 Working /800 Blocked; makespan ~12.8. Transfer delay, not backend capacity, is the bottleneck. No global gate.
- [ ] **D** — 3 logical nodes / 3,000 compiled tasks, 1,000 corresponding QPU requests. t=1 → 50 Blocked /950 Idle, QPU Run1 / ResourceQueue49 / PolicyHeld950. t=2 → 1 Working /50 Blocked /949 Idle. After the single drain, t=1001.5 → all 1,000 Idle. Do **not** render the old hypothetical all-Working loop without authored work. Scrub and watch the slow introduction/compressed middle/terminal segment. When Advanced is opened, display bounded/omitted task-level graph diagnostics rather than mounting 3,000 React Flow nodes.
- [ ] **Editing / comparison** — select a preset, change a valid modeled wall time, simulate, save at least two RunRecords, Compare exact makespan/queue/policy metrics and assumptions. Changing B quantum duration 1→1.5 s should make 202→302 s; changing D quantum duration 1→0.5 s should make 1001.5→501.5 s. Invalid DAG inputs must be rejected with clear validation, not silently adjusted.
- [ ] **Playback / interaction** — Play/Pause, step, scrub and reset use one consistent cursor; no rapid raw-event blinking, inaccessible overlays, severe layout shifts, stale state after changing presets, unbounded QPU task-ID text, or synthetic count resets. Reduced-motion preference respected.

**Evidence status:** The current CI proves model/adapter tests, not DOM paint, browser click, ELK performance or deployed runtime behavior. Mark unmet items unverified; do not claim they passed. For defects, record exact preset, time cursor, browser, error, reproduction and proposed narrowly scoped repair.

## 3. Deployment and release (P0 — pending)

- [ ] Confirm the existing production deployment currently targets legacy `web/` or another root, and deliberately configure/build **`app/`** with Node 22, Vite build `npm run build`, output `app/dist` (relative to repo root). Do not assume a Vercel configuration file exists: none is currently tracked.
- [ ] Verify deployed pages actually serve the new Builder/Explore/Compare app and that page refresh/navigation works. Preserve legacy history; do not silently wipe old `web/` files.
- [ ] Review top-level and `app/` README claims, limitations, source provenance and correct installation commands. Keep FTQC **future only** per D015 (`FTQC_EXTENSION_OUTLOOK.md`).
- [ ] Verify final integration HEAD and action run, record browser/deployment evidence, make a selective reviewed promotion to `main` and confirm `main` CI. Do not wholesale merge laboratory branches.

## 4. Technical scope / explicit exclusions

The Explorer is a deterministic, pre-execution *what-if* model. Its time/cost numbers are synthetic unless a user supplies justified measured inputs. DES assumes expanded DAGs, fixed service times, deterministic FIFO, explicit modeled resource pools, non-contended overlapping dependency transfers, and explicit bounded admission. It does **not** predict provider queues, emulate Slurm, model network contention, run QEC/FTQC, or optimize a physical quantum processor.

Scenario C's five quantum tasks **aggregate** 1,000 actors; D's 1,000 QPU tasks are modeled individually. Persistent actor Working/Blocked/Idle states are authored + derived and must never be inferred directly from raw CPU utilization.

## Release verdict

**As of Round 4J:** A–D integration/model tests PASS; browser acceptance, lockfile/reproducible CI, deployment migration, and `main` promotion remain **PENDING**.
