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
