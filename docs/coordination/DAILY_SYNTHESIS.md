# Coordinator Daily Synthesis

## 2026-10-02 — first integrated staging build

### Accepted architecture

- generic user-authored WorkflowSpec;
- deterministic frozen-v1 DES;
- QAMP A-D as first acceptance/preset suite;
- IBM/QAMP Fe4S4 SQD as real structural reference preset;
- semantic playback from exact engine traces;
- React Flow + ELK editable workflow DAG;
- structured SVG runtime resource view;
- Builder → Explore/Playback → Compare product flow.

### Agent status

- A: closed/idle; v1 engine accepted.
- B: closed/idle; frozen-v1 playback accepted.
- C: closed/idle; final product checkpoint accepted.
- D: closed/idle; graphics/tool split implemented.
- E: closed/idle; research evidence accepted.
- F: active integration/testing.

### First coherent staging build

Agent C's self-contained app was promoted substantially intact to `agent/integration` at:

`6fdb7954d1aeed4ddf82ea94ae81e9fe1830cd35`

Canonical production subsystem locations are now:
- engine: `app/src/engine/runtime.mjs`
- playback: `app/src/playback/trace-playback.mjs`
- shared domain contract: `app/src/domain/types.ts`
- Builder/UI: `app/src/components/`
- presets: `app/src/presets/presets.ts`

Agent A/B branches remain provenance/history rather than duplicate production modules.

### Verified C evidence

Final Agent-C head `3843b7c60c9a828dae60b8a4483e712616163af9` passed GitHub Actions run `37070602061`.

Branch checks included:
- engine tests;
- playback tests;
- architecture tests;
- TypeScript;
- Vite production build.

Current external package verification:
- `@xyflow/react 12.12.0` is current npm release;
- `elkjs 0.12.0` is current npm release;
- Vite 8 requires Node 20.19+ / 22.12+ and staging CI uses Node 22.

### Remaining gates before main

1. integration-branch CI;
2. browser E2E/visual smoke test;
3. A-D behavioral acceptance review;
4. custom workflow end-to-end authoring test;
5. deployment-root migration from legacy `web/`;
6. dependency lock/reproducibility decision;
7. bounded-repeat authoring decision for final 10-day scope.

## 2026-10-11 — Round 4F accepted; Round 4G parallel work

### Engineering integration
- Accepted `range` / `all-except` actor selectors symbolically in design/manifest, consumed by actor projection. No DES changes.
- Added separate 1,000-rank, four-logical-task Scenario A producer/test while retaining the four-rank regression.
- Fixed A synthetic baseline: local result path finishes at 8 s, independent classical background and makespan 10 s, preserving all actors Working through t=7.
- Source Agent A `1254de649fb0c15d458df20879c40a745e5e9e6d` passed 47/47 Node tests in CI `38118493908`.
- Selective staging code at `3cb83d81a09c9e41246975ddd975a66ce1859f13` and `92f0332bcf38167a1ebdd9143db83965e697ae8b`; corrected the prior Round-4C makespan assertion at `b52116ddaff7e435f16ab8c7e13336d0d9ffd7b6`.
- Staging app CI `38119401020` SUCCESS. Experimental Agent-A benchmark and workflow files were not ported. Existing .github Actions unchanged.

### Parallel work assigned in Git
- A reactivated for a bounded, post-DES, actor-state indexing/performance checkpoint at 1,000 actors and B-like 200 QPU tasks, and to assess Scenario-D admitted/blocked vs policy-held/idle semantics.
- C reactivated to convert public presets to tutorial-like scale in bounded steps (A, B, conditional C/D), retaining compact logical DAG and old fixtures, testing full playback and custom authoring/Compare.
- Agents B/D/E stay closed unless an explicit defect needs them.

### Risks and release gates
- A baseline 1,000-actor snapshots measured ~0.65 ms mean with only four tasks plus one wait; B/D high-multiplicity performance is **unmeasured**, and naïve actor × task/wait scanning can dominate the UI. Do not treat complexity extrapolation as a benchmark.
- Need source-faithful C/D behavior without invented global gates, provider queues, admission-blocked actors, or raw frame counters.
- Browser acceptance, dependency lock/reproducible `npm ci`, deployment root `web/` -> `app/`, product docs, and `main` promotion remain pending.
## 2026-10-12 — Round 4G reviews, staging and Round 4H activation

- A checkpoint: indexed actor-state projection and B-200 stress/equivalence tests accepted. Original API preserved; one-time precompute and cached queries operate above frozen DES. Agent benchmark run `38310735762` reported indexed current-style B200 signature sweep p95 ~0.454 ms/cursor after precompute, but this is **not** end-to-end UI playback. App PORT `e8d872c67e6e0530c4bcfb14ca7a7818ccb70ec9`; app CI `38313659986` SUCCESS.
- C checkpoint: 1,000-rank public Scenario A is live in logical preset registry with four-node DAG, synthetic timing, local wait, full-rank resumed classical work, no admission/queue. Small A fixture remains. App PORT `d57abf519babb9a8a9770b6ff9c6dd11927f3b6f`; app CI `38313789867` SUCCESS.
- D gap proven: actor-wait events cannot distinguish 50 admitted/in-flight actors from 950 policy-held actors using only ready/started/completed. DES already emits `task_queued` on admission, so F accepted a targeted above-DES `queued` actor-wait addition (D017), **implementation pending**.
- New bounded parallel work: A implements/tests D queued-trigger, C public B200 plus full playback/browser performance. B/D/E idle. FTQC outlook remains documentation-only.
- No frozen DES, dependency, or GitHub Actions workflow changed during integration. Browser acceptance, public C/D, lockfile, deployment root, release README and main promotion remain pending.
## 2026-10-12 — Round 4H Agent-A queued wait accepted

- [verified] Agent A completed minimal authored actor-wait `queued` trigger mapped to existing `task_queued` DES event. It distinguishes 50 admitted (1 running +49 resource queued) actor Blocked claims from 950 policy-held/Idle actors. At t=2, one result completes, continuation #1 Working and next task admitted, yielding Working1 /Blocked50 /Idle949.
- [verified] D1000 fixture expands 3×1000 concrete tasks and 1000 one-per-instance waits; at t=1001.5 all 1000 actors Idle, since another work cycle is not authored. No manual reset to 1000 Working.
- Producer `agent/engine@099cdf46f2b3dfd00a1a1dd7d2a7fcff4e32bf3d`, A CI `38321701185` success. Selective staging `db73f506eeee0649ffe0ee972900695a528e92e9`, integration CI `38322036602` success. Frozen DES and release CI workflows intact.
- A benchmark reports mean compile ≈76.81 ms, DES simulation ≈268.27 ms, projector initialization ≈89.77 ms; count-query p95 ≈0.00284 ms. This is engine evidence, **not browser playback acceptance**.
- Agent A CLOSED/IDLE; C still ACTIVE on Round 4H public B200. FTQC D015 remains documented/deferred.
## 2026-10-12 — Round 4H C accepted; public Scenario C assigned

[verified] C source `c80de454f1814dd42e7878a80113affea9760d67`, CI `38321963530` SUCCESS. Integration `39a8a628ce122342b88794d6c8914b657c81521c`, CI `38322560759` SUCCESS (122 tests, typecheck/build). No DES, D018 actor-wait union, dependency, or GitHub Actions change.

Public B: 1,000 persistent actors; 200 paired prepare/QPU instances + full-result all-rank collective; logical DAG 3 nodes, compiled DES 401. At t=1: 200 Blocked/800 Idle, QPU Run 1, Queue 0, policy-held 199; t=2: all 1,000 Blocked; t=201.5: all 1,000 Working. Synthetic makespan 202 s. Indexed playback summary and lazy collapsed Advanced accepted.

C Node benchmark: full 203-keyframe build median ~35.45 ms; cursor p95 ~0.988 ms. Browser paint/click and open Advanced-401 are **unverified**. C now addresses communication-dominated Scenario C; simultaneous 1,000 arrivals would falsely make QPU service the bottleneck, so cohort/stagger modeling must be explicit. D and FTQC remain later.
## 2026-10-12 — Round 4I public C accepted; Round 4J D assigned

- [verified] C source `agent/ui@e25d21b8c85b263efc4e8947dbf261632d4b28e7` CI `38326263206` SUCCESS. Staging `53248bf1a2c7488d52982a77191919f5ff4b0b0e`, integration CI `38326633662` SUCCESS: 135/135 Node tests, TypeScript, Vite production build; no DES, D018, dependency or GitHub Actions change.
- Public Scenario C: five staggered 200-rank *synthetic cohorts* = 1,000 persistent actors but only five aggregate QPU requests, compact 15-task DAG, 5s outbound/3s inbound positive modeled communication versus0.1s QPU service. At t4.5 1000 Blocked, QPU Idle/Queue0/PolicyHeld0 and five transfers active. No global gate. Baseline makespan ~12.8s, reduced transfer profile ~8.8s. Node 23 keyframes median1.291ms, cursor p95 0.160ms; no browser acceptance yet.
- Agent C now ACTIVE on source-faithful public D with 1000 individual quantum requests, one QPU service lane and 50 outstanding/admitted bound. Exact actor Blocked derived only upon `task_queued`, policy-held actors Idle when not working; no scripted return to 1000 Working unless authored. No global sync.
- Remaining: D integration, browser A–D, Builder edit/Compare, lazy diagnostics opened, lock/npm-ci, deployment to app root, README + FTQC outlook, main.
