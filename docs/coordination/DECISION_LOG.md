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
