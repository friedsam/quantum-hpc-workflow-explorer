# Decision Log

## D001 — Multi-agent split
**Date:** 2026-10-02  
**Decision:** Separate engine, playback, UI, graphics, research/validation, and coordination/integration into Agents A–F.  
**Reason:** Previous Explorer work stalled because semantics, animation, graphics and UI were debugged together.

## D002 — Agent F promotion authority
**Date:** 2026-10-02  
**Decision:** Only Agent F approves what is promoted/ported/reimplemented into staging/main.  
**Reason:** Agent branches will contain experiments and clutter that should not automatically enter the product.

## D003 — Main is shippable
**Date:** 2026-10-02  
**Decision:** `main` represents coherent product state, not collective work-in-progress.

## D004 — QAMP is a reference, not a constraint
**Date:** 2026-10-02  
**Decision:** Preserve conceptual continuity with QAMP, but do not preserve stale didactic representations if they impair functionality/correctness.

## D005 — Simulation source of truth
**Date:** 2026-10-02  
**Decision:** Engine trace/metrics are authoritative. UI/playback/graphics do not independently simulate execution.

## D006 — Presentation time separated from simulation time
**Date:** 2026-10-02  
**Decision:** Playback may aggregate/re-time visual presentation while preserving exact trace semantics.

## D007 — Graphics benchmark before graphics standard
**Date:** 2026-10-02  
**Decision:** Agent D compares structured SVG/grid, graph layout, Figma-assisted design, and other justified candidates before the project adopts a graphics stack.

## D008 — Historical prototype retained
**Date:** 2026-10-02  
**Decision:** Keep `prototype-vqe-runner` untouched as historical evidence; port selectively only after review.


## D009 — QAMP Scenarios A–D are the first acceptance suite
**Date:** 2026-10-02  
**Decision:** Scenarios A–D from the QAMP documentation are the first workflow fixtures used to validate the rebuilt generic engine and visualization pipeline. They must be regenerated from the new model rather than preserved as hand-coded state machines. The IBM Fe4S4 SQD workflow is a later serious real-workflow reference preset, not the primary acceptance suite.  
**Reason:** The Explorer was originally created to make these orchestration patterns actionable; they collectively exercise handoff/overlap, global synchronization, latency/data movement, and bounded asynchronous submission more directly than SQD does.


## D010 — User-authored workflow design is core product functionality
**Date:** 2026-10-02  
**Decision:** The rebuilt Explorer must let users create or materially edit their own supported hybrid workflow, simulate it, inspect/animate the resulting execution trace, and compare alternative designs/policies. QAMP Scenarios A–D are the first acceptance/preset suite, not the product scope. The IBM Fe4S4 SQD workflow is a later real-workflow reference preset.  
**Reason:** This is the original purpose of the Explorer documented in QAMP: apply orchestration concepts to the user's own application rather than merely replay curated scenarios. The new technical foundation should make this capability more credible, not reduce it.


## D011 — Visual execution/debugging is the product differentiator
**Date:** 2026-10-02  
**Decision:** Preserve the 10-day closure goal, but treat the Explorer's primary differentiation as a human-readable visual simulator/debugger: editable DAG + synchronized slow semantic playback + full HPC/QPU state + analytical plots. Do not compete primarily on scheduler sophistication. Optional optimization should remain explainable and secondary to direct user exploration.  
**Reason:** Mature systems already provide scheduling/resource optimization, while the Explorer can occupy a distinct usability niche centered on visual execution/debugging. LabVIEW is a useful retrospective analogy for that interaction model, recognized only after the Explorer concept already existed.


## D012 — Tutorial-scale public A–D demos; small fixtures retained
**Date:** 2026-10-11  
**Decision:** Public A–D presets should approximate the tutorial's rank/job scale and recognizable workflow patterns (about 1,000 HPC ranks where the tutorial uses that scale), without rendering one DAG node per rank. The existing 4-rank/3-job/6-job examples remain deterministic regression fixtures, not the final user-facing demos. Identical grouped instances are acceptable for this prototype; arbitrary per-instance heterogeneity is deferred.  
**Reason:** The tiny acceptance fixtures prove engine mechanisms but cannot communicate the HPC-scale actor and queue behavior the public tutorial describes.

**Architecture:** Preserve the frozen deterministic DES and the separation of logical multiplicity, persistent actor count, and resource units per concrete task. Agent A may propose only a minimal compact actor-selection extension above the DES for scaling; Agent F reviews before integration; Agent C updates public presets only afterward. Slurm execution-plan export is post-prototype and does not block this round.


## D013 — Round 4F compact actor selectors and Scenario-A demo accepted
**Date:** 2026-10-11  
**Decision:** PORT Agent A Round-4F selectors `range` and `all-except` above the frozen DES, plus a dedicated compact 1,000-rank Scenario A model. Keep the existing four-rank producer as regression. Correct small A background time from 8 to 10 synthetic seconds while retaining its 5 s post-result continuation: the local QPU path finishes at t=8, strictly before the overall t=10 makespan.  
**Evidence:** Agent A source `agent/engine@1254de649fb0c15d458df20879c40a745e5e9e6d`, its 47/47-test CI run `38118493908`; staging commits `3cb83d81a09c9e41246975ddd975a66ce1859f13`, `92f0332bcf38167a1ebdd9143db83965e697ae8b`, and test correction `b52116ddaff7e435f16ab8c7e13336d0d9ffd7b6`; integration CI run `38119401020` SUCCESS.  
**Scope:** Higher-level selector/type/compiler/actor-state projection additions only; DES `WorkflowSpec`, `SimulationResult`, scheduling, and metrics unchanged. The 999-rank background is one 999-CPU-unit aggregate DES task, not 999 independent task instances.

## D014 — Scale actor-state projection before high-multiplicity public B/D playback
**Date:** 2026-10-11  
**Decision:** Parallel bounded tracks: C converts the public A-D presets in stages; A benchmarks and optimizes post-DES actor-state projection for high task/wait multiplicity. Actor-state count/blocked-reason semantics remain derived and authoritative only from authored participation/gates + exact DES events. Preserve the old detail/count functions or propose a backward-compatible, explicitly reviewed index API. Do not optimize by inventing ranks, ignoring wait reasons, or changing DES results.  
**Reason:** Round-4F measured ~0.65 ms per actor snapshot for 1,000 actors with only 4 tasks + 1 wait, but source-derived scan-count extrapolation indicates a 200-job B or 1,000-request D could be much slower. Those extrapolations are not measured. C must not claim browser responsiveness without actual measurement.  
**Guardrail:** If exact tutorial C/D actor counts require missing actor-admission/transfer semantics, record and escalate the representational gap rather than hand-code storyboard counters.

## D015 — Document an FTQC roadmap without expanding the prototype
**Date:** 2026-10-12  
**Decision:** Complete the existing QAMP/IBM Workflow Explorer prototype and mention fault-tolerant quantum computing (FTQC) only as a clearly labeled **future extension** in the release/project description. Reference `docs/coordination/FTQC_EXTENSION_OUTLOOK.md` for the conceptual model.  
**Technical direction:** Future FTQC exploration should consider *joint application-level orchestration and internal FTQC resource tuning*, with explicit remote/cloud vs co-located HPC–QPU deployment profiles. Separate real-time QEC/decoder/feed-forward constraints from slower HPC job scheduling, and represent logical-qubit/code-distance/magic-state tradeoffs through a separately validated estimator/profile. A cloud-accessed QPU still has local real-time classical control; deeper tuning is only possible when interfaces expose it.  
**Guardrail:** No FTQC engine features, QEC model, decoder scheduling, optimizer, schema rewrite, or agent task until the current A–D prototype passes acceptance and release cleanup. Do not imply implemented FTQC support or measured FTQC performance.

## D016 — Round 4G Agent A actor index and Agent C public Scenario A accepted
**Date:** 2026-10-12  
**Decision:** PORT both bounded checkpoints. A's indexed actor-state projector preserves the prior Working/Blocked/Idle and blocked-reason APIs through a cached immutable-run-evidence projection. C's first public preset now uses the accepted 1,000-rank Scenario A four-logical-task producer; the original four-rank fixture stays a regression.  
**Evidence:** A head `054dce39c5becf214c4f2718f5d8ea2cd4bd53e1`, branch CI `38311060733`; B-200 benchmark CI `38310735762`, which reported 405-cursor current-style projection p95 ≈0.454 ms and indexed precompute ≈14.6 ms mean on its runner. C head `efc3b11c513a911b1f0f5905ce8743a5215c508e`, CI `38310788980`; C code checkpoint `5f68a9337c7d898f5c70ebb732a220327f59e677` CI `38310612630`.  
**Selective staging:** `e8d872c67e6e0530c4bcfb14ca7a7818ccb70ec9` (A indexed actor projector, semantic oracle and 1,000-actor/200-QPU B stress fixture/tests) passed integration CI `38313659986`. `d57abf519babb9a8a9770b6ff9c6dd11927f3b6f` (C public A switch and tests) passed integration CI `38313789867`. No frozen DES, playback controller, third-party dependency, or GitHub Actions workflow changed.  
**Caveats:** A's actor-query benchmark is not an end-to-end React Flow/render/playback benchmark. The current Advanced expanded 401-node DES graph may still be expensive even while visually collapsed. Browser acceptance is not complete. The projector WeakMap cache assumes immutable manifest/result objects.

## D017 — Accept the minimal Scenario-D actor wait admission event above frozen DES
**Date:** 2026-10-12  
**Decision:** Permit an additive high-level `ActorWaitTaskEvent = "queued"` boundary, compiled to the existing frozen-v1 DES `task_queued` event, subject to one bounded Agent A implementation/test checkpoint. This is **not yet implemented** in staging.  
**Evidence/reason:** Existing `app/src/engine/runtime.mjs` emits `task_queued` for each admitted QPU task (including a task that starts immediately); dependency-ready QPU tasks blocked by `maxInFlightQuantumByPool` remain policy-held without that event. At D's proposed 1 running +49 resource-queued with max-in-flight 50, the admitted actors may be marked Blocked by a `queued → completed` actor wait while 950 policy-held actors remain Idle. The current `ready` event would block all 1,000, and `started` only the active one.  
**Guardrail:** No new DES event, QPU queue policy, scheduling change, provider-queue estimate, or fabricated actor counts. Explicit authored actor identity/wait claims remain essential. `task_queued` is admission evidence, **not** equivalent to currently consuming QPU capacity. Agent A must validate exact large-D transitions and compatibility before F ports this contract to staging.

## D018 — Round 4H queued-admission actor wait accepted, no DES revision
**Date:** 2026-10-12  
**Decision:** PORT one backward-compatible higher-layer actor wait event `queued`, compiled to **existing** DES `task_queued`. It means that an explicitly authored actor begins its local admitted-QPU-result wait at the moment its matching task is admitted, including immediate start (zero queued interval), and waits until matching `task_completed`. Dependency-ready tasks still held by `maxInFlightQuantumByPool` have no `task_queued` event and are not thereby marked Blocked. Actor-state remains derived from declared actor participation/wait claims, not from resource allocation or UI counters.
**Evidence:** Agent-A branch `agent/engine@099cdf46f2b3dfd00a1a1dd7d2a7fcff4e32bf3d`, engine CI `38321518049` (63/63 tests; report) and latest head CI `38321701185` SUCCESS. Selective staging `db73f506eeee0649ffe0ee972900695a528e92e9`; integration CI `38322036602` SUCCESS (Node suites, TypeScript and production build).
**Acceptance:** Test-only D1000 has 1,000 persistent actors and 1,000 QPU requests with max-in-flight 50 and QPU capacity 1. At t=1 after prep: QPU 1 running +49 resource queued +950 policy-held; actors 0 Working /50 Blocked /950 Idle. At t=2: 1 Working /50 Blocked /949 Idle. Exact `task_queued` / `task_started` at t=1 and local continuation are tested. The modeled final state at t=1001.5 is 1,000 Idle; a further 1,000 Working cycle would require an explicitly authored next phase, not a UI animation counter.
**Interfaces:** Only `ActorWaitTaskEvent` and `CompiledActorWaitEventType` unions and compiler mapping change; existing persisted designs remain supported at schemaVersion 1. Frozen `WorkflowSpec`, `SimulationResult`, DES event set/scheduling/metrics, QPU limits, provider queue semantics, dependencies and playback remain unchanged. Benchmark and extra CI files stay on A's lab branch. Public D demo is **not yet implemented**.

## D019 — Round 4H public B200 accepted; next gate is transfer-dominated C
**Date:** 2026-10-12
**Decision:** PORT Agent C's public Scenario B200, indexed actor-summary playback, bounded QPU task IDs, and lazy Advanced diagnostics. Keep all pre-existing A/B/D source fixtures and D018 `queued` admission semantics. Next C checkpoint is public transfer-dominated Scenario C, not FTQC or an automatic switch to D.
**Evidence:** Source `agent/ui@c80de454f1814dd42e7878a80113affea9760d67`, CI `38321963530` SUCCESS (checkpoint CI `38321799519`: 115 tests); staging `39a8a628ce122342b88794d6c8914b657c81521c`, CI `38322560759` SUCCESS (122/122 Node tests, TypeScript, Vite production build).
**B contract:** 1,000 actors; 200 submitters; 200 quantum evaluations; one all-rank collective; 3 logical/401 expanded task nodes. At t=1, 200 Blocked/800 Idle with QPU running=1, resource queue=0, policy-held=199. At t=2, all 1,000 Blocked by authored full-result global gate; at t=201.5, all 1,000 Working. Makespan 202 synthetic seconds. QPU admission serialization is not itself global synchronization.
**Performance/limits:** C CI median full B200 keyframe construction 35.451 ms (203 frames), cursor state p95 0.988 ms over 405 positions. These are Node state/adapter timings, not browser interaction measurements. Collapsed Advanced content is no longer mounted, but opening the 401-node graph still needs browser acceptance. Vite large-chunk warning remains. No DES, packages, or GitHub Actions changed. The Explorer is educational, not a measured performance predictor.

## D020 — Public Scenario C transfer wall accepted; final D public preset is next
**Date:** 2026-10-12
**Decision:** PORT Agent C's source-grounded public Scenario C1000 grouped model. Maintain its 1,000 persistent actors as **five synthetic 200-rank cohorts**, with **five aggregate QPU requests**, not 1,000 independent quantum evaluations. The accepted 15-node logical/DES graph demonstrates independently consumed results and communication-dominated stalls without a global barrier or QPU saturation. Public D is the next *separate* acceptance gate. Preserve existing small A–D regression fixtures.

**Evidence:** Agent C source `agent/ui@e25d21b8c85b263efc4e8947dbf261632d4b28e7` CI `38326263206` SUCCESS; code checkpoint `f539b22a4a4bdbd260b1259b987b99b9ac6cb6be` CI `38326092092` SUCCESS. Selective integration `53248bf1a2c7488d52982a77191919f5ff4b0b0e`, app CI `38326633662` SUCCESS (135/135 Node tests, TypeScript and Vite production build). Canonical source: `HPC-Quantum/Documentation-website/scenario-c.md`.

**Mechanism:** Five staggered cohort preparations (0.2,1.2,2.2,3.2,4.2 s synthetic), 5 s outbound and 3 s return dependency transfers, 0.1 s QPU service, 0.5 s local continuation; one QPU lane. At t=4.5, 1,000 authored actors Blocked, five transfers active, QPU Idle, queue/admission waits zero; first cohort resumes after return transfer while later cohorts still wait. Synthetic makespan ~12.8 s; transfer-edit variant ~8.8 s at identical topology. No provider queue or bandwidth contention is assumed.

**Measured bounds/limits:** C Node CI 23 keyframes, full keyframe median 1.291 ms; 257-cursor data snapshot p95 0.160 ms. Browser/React interaction is *not yet measured*. Transfer is a dependency delay, not network contention/resource simulation; five aggregate QPU requests cannot be interpreted as 1,000 individually scheduled provider jobs. Frozen DES, QPU scheduling, D018 `queued` wait, dependencies and GitHub Actions untouched.

**Next:** A credible public Scenario D should model throughput/service-capacity mismatch with one QPU running, bounded resource queue, distinct policy-held demand, and independently resuming actors. Do **not** force legacy frame D6/D9 counts through invented offload/clock/collective events. An all-Working restored state is allowed only when it follows from explicit useful work; otherwise explain why the single asynchronous drain ends Idle and show the actual causal result.

## D021 — Round 4J public Scenario D accepted; A–D feature scope frozen
**Date:** 2026-10-12
**Decision:** PORT C's public 1,000-rank throughput-limited D preset with 1,000 corresponding classical preparation, QPU and local continuation instances; cap admitted QPU requests to 50 on a single-lane QPU; maintain exact separation of running, QPU-resource-queued, and admission-policy-held work. Keep the default authored DAG compact (3 nodes), retain scale guards for Advanced at >500 compiled tasks, and preserve all earlier A/B/C public models and small regression fixtures.
**Evidence:** Source `agent/ui@806459aeebc2bac22e8acc5fdd86c3c1309eba40`, CI `38328951941` SUCCESS (implementation checkpoint `f2127b04d769b35f62f4ffd7aee539a317faf025`, CI `38328657367` SUCCESS). Selective staging `e49954bc9caf5f3e18472b3d229c96b9ebdd2c70`; integration CI `38332756103` SUCCESS: 143/143 Node tests, TypeScript, Vite build.
**Exact modeled behaviors:** t=0.5 1000 Working; t=1 50 Blocked/950 Idle with 1 QPU running, 49 QPU-resource-queued, 950 policy-held. t=2 one Working, 50 Blocked, 949 Idle. One-shot complete at t=1001.5 with all 1000 Idle; no unmodeled new cycle or fake 1000-Working terminal state. `task_queued` is QPU admission (D018), not provider queue.
**Limitations:** Unlike historical didactic animation D6/D9, no intermediate off-load transfer re-entry or terminal all-Working loop is claimed without authored work. Queue/admission policy model is deterministic synthetic FIFO; timings are not hardware estimates. Performance evidence is CI Node (107 compressed frames; median keyframe build ~65 ms, cursor p95 ~4.35 ms), **not actual browser latency**. Advanced compiled task graph is intentionally omitted beyond 500 tasks rather than drawn as 3,000 nodes.

## D022 — Freeze feature additions; release acceptance required before main
**Date:** 2026-10-12
**Decision:** A–D public scenarios and the core Builder → DES → Explore → Compare product are **feature-complete in `agent/integration`**, but **not yet release/browser-accepted**. No further orchestration-feature rounds should be opened without a specific demonstrated defect. A, B, D, E remain idle; C may perform *bounded release verification/hardening only* under F; F owns staging, release documentation, deployment configuration, and main promotion.
**Blocking release gates:** (1) actual browser A–D interactions with correct state, playback, and safe Advanced disclosure; (2) custom edit/re-simulate/Compare in browser, not only Node tests; (3) reproducible lockfile and clean `npm ci` validation (currently `app/package-lock.json` absent); (4) migration/deployment of `app/` instead of old `web/` without silently replacing history; (5) accurate README with synthetic limits and FTQC *future* scope; (6) green final integration CI. Main stays unchanged until gates pass or limitations are explicitly accepted.

## D023 — Round 4K reproducible build and browser-lab acceptance; deployed preview still required
**Date:** 2026-10-12
**Decision:** PORT Agent C's npm v3 `app/package-lock.json` (Node 22/npm 10) and switch only integration `.github/workflows/app-validation.yml` install command to `npm ci --no-audit --no-fund`. Feature scope remains frozen. Accept C's real Chromium 141 *functional* smoke as strong evidence for the exact app source, while distinguishing it from direct staging SHA/deployed-provider validation.
**Evidence:** C `agent/ui@c0f597c401c519053e54097cc4b8290157053184`, CI `38334927602` success, clean bootstrap `38333574146` success and Chromium run `38334619801` success with 19 checkpoints; screenshots and logs [artifact 11783928804](https://github.com/friedsam/quantum-hpc-workflow-explorer/actions/runs/38334619801/artifacts/11783928804). Integration `736e0968ea6e49b24109726acd6697aae8b054d8`, clean `npm ci` CI `38337192791` success (143/143 Node tests, TypeScript, Vite build). README/release-evidence update `09023fba87c5b5d30d90318e49fef8e0eaa59349`.
**Source equivalence:** Browser run on C `de733c930be15e0cea7b207c87326a17897758bc` and integration `f3f49f30d6dbf3d71d684f8454cb48f975ebda66` have identical app source tree `6158a42b341583db4a60bbac4e7b898e32bbcef7` and identical Vite config / index.html blobs. Both package manifests declare identical production/dev dependencies. Lockfile integration does not modify `app/src`. This supports functional equivalence, **not verification of production deployment settings**.
**Observed caveats:** browser slider coarse for B/D interior times (semantic stepping works); some long graph labels/status strings clipped at 1440×900 (zoom/pan works); opening B401 Advanced first time ~3 seconds in GitHub CI Chromium. These are targeted UX concerns, not DES test failures. No new dependency/framework or feature code was accepted. Test-only Playwright script and temporary workflows stay on C's branch; only lockfile and one integration workflow line were ported. C track CLOSED/IDLE.
**Release rule:** `main` not promoted until an actual preview/deployed route from the correct `app/` root is verified, including refresh/navigation and signoff on acceptable UX limitations. Current hosting/provider project configuration has not been observed. Do not assert deployment success or silently overwrite historical `web/`.


## D024 — Scenario C corrected to 1,000 individually transferred requests
**Date:** 2026-10-13
**Decision:** Supersede D020's 5×200-cohort Scenario C public preset with 1,000 **individual** HPC/QPU request pairs and 1,000 actor-specific waits, while preserving the compact three-node logical DAG. After all preparations end at t=0.2, 1,000 outbound transfers are active and all 1,000 ranks Blocked before any QPU job arrives; one job starts at t=5.2, completes t=5.25, returns by t=5.5 (releasing precisely one rank), and the next job reaches QPU no earlier than t=5.9. Repeat independently for all jobs, no global barrier, QPU resource queue or admission policy hold. A later rank has no dependency on earlier quantum results.
**Mechanism:** Higher-level `SystemProfile.dependencyCommunication.value.instanceStaggerS` is an *optional*, validated, synthetic pairwise-instance latency increment: concrete edge k gets `fixedLatencyS + (k−1)*instanceStaggerS`. C assumes 5 s base outbound latency, 0.7 s successive delivery spacing, 0.05 s quantum service, 0.25 s return transfer, 0.3 s local continuation; QPU capacity 1, release-aware allocation. An explicit network-capacity/transport contention simulation is **not** claimed; the stagger is input schedule provenance, not a measured network model. No frozen DES, engine scheduling, queue metric definition or QPU execution assumption changed.
**Accepted behavior:** 3 logical /3,000 compiled tasks, 2,000 pairwise transfer edges, 1,000 per-rank actor waits. t=0.3/4.5: Working0/Blocked1000, outbound transfers 1,000, QPU Run0/Queue0. t=5.6: Working1/Blocked999, QPU idle, next request not yet arrived. One-shot makespan ≈705.1 synthetic s. Output and README/acceptance have been updated to eliminate stale 5-cohort claims.
**Presentation:** A very dense exact event trace is retained. A bounded source-range-preserving presentation samples the repetitive middle while keeping initial single-rank releases and final recovery events explicit; users can inspect arbitrary exact times through numeric cursor input.
**Release caveat:** This corrects the *causal sequence*, not provider/network physics or the tutorial's multi-iteration execution loop. Browser rendering/performance needs QA against the new preview before release and IBM reporting.
