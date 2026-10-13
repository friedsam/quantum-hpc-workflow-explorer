# Coordinator Review Queue

Updated: 2026-10-02

## Round 2 — scenario semantics and behavioral acceptance

### A — Engine
**Status:** active.

Task:
- implement scaled A-D WorkflowSpec acceptance fixtures;
- assert conceptual invariants, not legacy screenshot counts;
- keep frozen v1 unchanged unless a concrete representational defect is proven.

### E — Research/validation
**Status:** **Round 2 complete — PORT accepted; CLOSED/IDLE.**

Accepted source-grounded contract:
- A = local overlap / QPU off critical path;
- B = global complete-result dependency / synchronization wall;
- C = communication-dominated local paths with low QPU saturation;
- D = service-capacity mismatch + bounded admission / independent local progress.

No frozen-v1 compatibility defect found.

### B — Playback
**Status:** **Round 2B complete — DERIVE accepted; CLOSED/IDLE.**

Accepted:
- exact resource state remains active / allocated-idle / released;
- causal wait state is a separate deterministic explanation layer;
- generic blocked-rank counts are not derivable without persistent rank/task affinity;
- communication, QPU gating, structural joins and policy-held QPU work can be derived at task/dependency level;
- optional metadata may support stronger labels such as local-result or collective synchronization.

No engine change required.

### C — UI
**Status:** hold.

Starts after A/E reconciliation. Then port the accepted A-D presets/labels into staging; no broad UI redesign in this round.

### D — Graphics
**Status:** **active.**

Agent B's accepted two-layer state model has been written onto the graphics branch. D should finish the full-system visual language using:
- exact resource layer;
- separate causal wait/explanation overlays;
- Scenario B and D static prototypes;
- linked debugger/time-series concept.

### F — Coordinator
**Status:** active.

Next:
1. review A and E independently;
2. reconcile them into one scenario acceptance contract;
3. decide whether any v1 engine gap is real;
4. then activate B and C for the second half of the round.

The integrated staging app remains at the current accepted state while A/E work proceeds.


## Round 2C — model extension guardrail

### A — Engine/model architecture
Status: ACTIVE.

Define the minimal WorkflowDesign + RunConfiguration + SystemProfile layer that compiles to frozen WorkflowSpec. Preserve optional actor/rank affinity, repeat structure, parameter provenance, and future performance-model hooks. Do not implement optimization or change DES semantics.

### C — UI
Status: HOLD until A Round 2C is reviewed.

Then integrate:
- accepted A-D presets;
- B causal explanation layer;
- D full-system debugger visual language;
- the minimal design/config separation accepted from A.

### B/D/E
Status: CLOSED/IDLE unless integration reveals a concrete defect.


## Round 2C review result — 2026-10-03

### A — Engine/model architecture
Status: ONE SMALL REPAIR PASS.

Accepted:
- WorkflowDesign / RunConfiguration / SystemProfile / RunRecord layering;
- pure compile -> frozen WorkflowSpec;
- repeat expansion above DES;
- actor groups as optional future hook;
- provenance separation;
- no optimizer/DES expansion now.

Required before freeze:
1. schemaVersion on persisted WorkflowDesign / RunConfiguration / SystemProfile;
2. explicit CompilationManifest mapping authored IDs/profile keys to expanded compiled task/dependency/resource IDs.

No DES changes requested.

### C — UI
Status: HOLD until the above two persistence/provenance fixes are reviewed.

Then C resumes integration.


## Round 3 — integrated product pass

### A — Engine/model
Status: CLOSED/IDLE.
Round 2C accepted. Frozen DES unchanged. Versioned design/config/profile layer + compilation manifest accepted.

### B — Playback/causal explanation
Status: CLOSED/IDLE.
Accepted derivation contract available in integration.

### D — Graphics
Status: CLOSED/IDLE.
Accepted full-system visual language available in integration.

### C — UI/product integration
Status: ACTIVE.

Integrate:
- design/config/profile/compiler + manifest;
- corrected A-D presets/acceptance tests;
- causal explanation adapter;
- full-system debugger board;
- shared simulation-time cursor with DAG/playback/analytical strips.

Do not broaden into optimizer or UI redesign.

### F — Coordinator
Next gate after C:
- review/port C;
- integration CI;
- browser E2E/visual smoke;
- deployment root cleanup;
- main promotion/closure.


## Round 3 final review — 2026-10-03

### C — UI/product integration
Status: **CLOSED/IDLE — PROMOTE accepted.**

Staging:
- app tree promoted at `e4a617be212055c0364d57124db300961810b2e0`;
- integration CI run `37093643908`: SUCCESS.

Accepted:
- design/config/profile compiler + manifest;
- accepted A-D presets;
- causal system-state explanation;
- full-system debugger;
- shared time cursor / DAG highlighting / analytical strips / playback;
- custom workflow authoring and Compare preserved.

### F — next gates

1. browser E2E/visual smoke on `agent/integration`;
2. inspect A-D visually/behaviorally in browser;
3. test custom workflow author -> simulate -> inspect/playback -> modify -> compare;
4. add reproducible dependency lock / `npm ci`;
5. decide deployment-root migration from legacy `web/` to new `app/`;
6. final documentation/cleanup;
7. promote to `main` only after these gates.


## Round 4B — actor-aware playback + simple Explorer visual

### A — Engine/model
Status: CLOSED/IDLE. Repaired Round 4A accepted.

Accepted additions above frozen DES:
- task multiplicity;
- persistent actor/rank groups;
- actor participation;
- actor wait/gate claims;
- derived Working / Blocked / Idle actor state;
- compact logical DAG -> concrete WorkflowSpec compilation.

### B — Playback/causal
Status: ACTIVE.

Make playback/causal snapshots actor-aware when authored actor semantics exist, retain generic fallback otherwise, and preserve Scenario-D queue/policy distinctions.

### D — Graphics
Status: ACTIVE.

Design the simple default Explorer around logical DAG + actor/system state. Current dense diagnostics become Advanced/Diagnostics.

### C — UI
Status: HOLD until B/D review.

### F — Coordinator
Next:
1. review B and D independently;
2. reconcile view model + visual grammar;
3. activate C for implementation;
4. browser-test the simplified product.


## Round 4B playback review — 2026-10-10

### B — Playback/causal
Status: ONE SMALL REPAIR.

Accepted actor-aware view model and keyframe behavior. Required only:
- rename heuristic compressed multi-step label from "cycle" to neutral "activity";
- update corresponding playback test(s).

No semantic/model changes requested.

### D — Graphics
Status: ACTIVE.

### C — UI
Status: HOLD until B wording repair and D review.


## Round 4B graphics review — 2026-10-10

### D — Graphics
Status: CLOSED/IDLE — PORT/REIMPLEMENT accepted.

Accepted:
- simple default Explore hierarchy;
- authored logical DAG, not expanded DES graph;
- multiplicity ×N distinct from resource units/instance and actor count;
- actor Working/Blocked/Idle first-class when authored;
- compact generic fallback otherwise;
- compact QPU running/resource-queued/policy-held state;
- current diagnostic stack moves behind Advanced / Diagnostics.

### B — Playback/causal
Status: ONE SMALL WORDING REPAIR still pending.

### C — UI
Status: HOLD until B repair closes, then implement reconciled B/D contract.


## Round 4C — production implementation

### A — Engine/model
Status: CLOSED/IDLE. Round-4 actor model accepted.

### B — Playback/causal
Status: CLOSED/IDLE. Round-4B actor-aware playback accepted after neutral wording repair.

### D — Graphics
Status: CLOSED/IDLE. Round-4B simple Explorer visual accepted.

### C — UI
Status: ACTIVE.

Implement:
- logical design DAG in Builder and default Explore;
- multiplicity ×N editing distinct from resource units/instance;
- actor-aware Scenario B and generic Scenario D;
- simple default Explore hierarchy;
- current Round-3 diagnostics behind Advanced / Diagnostics;
- one shared time cursor across default and advanced views.

### F — Coordinator
Next gates:
1. review C green checkpoint;
2. port to integration;
3. browser-test Builder + B + D + custom edit/compare;
4. repair only concrete defects;
5. dependency lock/deployment cleanup;
6. main promotion/closure.


## Round 4C final review — 2026-10-10

### C — UI
Status: CLOSED/IDLE — PROMOTE accepted.

Staged integration:
- app commit `17e868fafa1c120a6c54182a2844f45f84e5ffb5`;
- integration CI `38029254083`: SUCCESS.

Accepted:
- logical Builder;
- multiplicity editing;
- actor-aware Scenario B;
- compact A/C/D logical presets;
- simple default Explore;
- Advanced / Diagnostics preservation;
- shared actor-aware playback/time cursor;
- custom authoring/save/Compare compatibility.

### F — next gate

Browser-test staged `agent/integration`:
1. Scenario B default Builder/Explore;
2. Scenario B key actor-state transitions;
3. Scenario D queue vs policy-held state;
4. custom logical workflow multiplicity edit -> simulate;
5. Advanced / Diagnostics disclosure;
6. Compare saved runs.

Only after browser findings are clean:
- add/commit dependency lock and switch CI to reproducible install;
- deployment-root migration;
- final cleanup/docs;
- main promotion.


## Round 4D — systematic scenario fidelity / parameter-regime pass

### Browser finding

Scenario B logical Builder is now substantially clearer, but review exposed two remaining conceptual issues:

1. the UI does not yet make system topology obvious (parallel HPC pool vs capacity-1 serialized QPU);
2. Scenario A is still actor-less, so it cannot faithfully show the tutorial's defining state: submitting rank blocked on its local quantum result while other ranks continue useful work.

Also clarified:
- `service time / instance` is modeled wall time, not CPU speed;
- logical multiplicity bundles equivalent modeled work instances;
- parameter changes can shift bottlenecks, but topology/dependency changes are still required for mechanisms such as a global synchronization wall.

### A — Engine/model
Status: ACTIVE.

Task:
- minimal actor-selection extension if required for faithful Scenario A;
- scaled Scenario-A logical fixture with local submitter wait and continuing non-submitters;
- parameter-regime acceptance matrix separating topology from timing/load parameters;
- frozen DES unchanged.

### B/C/D
Status: HOLD for A review.

After A:
- C/D get one bounded presentation pass for machine-topology strip, timing terminology, redundant node labels and minor edge-routing polish;
- then resume browser acceptance across A-D and custom parameter edits.


## Three-day prototype deadline mode — 2026-10-10

Priority: browser-demonstrable A-D tutorial prototype + project-description readiness within ~3 days.

Parallel tracks:
- A ACTIVE: Scenario-A actor fidelity + topology-vs-parameter regime semantics.
- C ACTIVE: model-independent Builder clarity pass (system topology strip, modeled-wall-time wording, multiplicity explanation, redundant-label cleanup, bounded edge-routing polish).
- E ACTIVE: rapid official-Slurm crosswalk for future ExecutionPlan/export compatibility.
- B/D HOLD unless a concrete playback/graphics defect appears.
- F coordinates browser acceptance and prepares the project-description narrative from the frozen product thesis once the prototype stabilizes.

Prototype gate:
1. A-D logical DAGs recognizable;
2. system topology visible;
3. parameter edits visibly change qualitative behavior;
4. actor-aware A/B where authored;
5. C communication and D throughput distinctions remain clear;
6. custom workflow still editable/simulatable;
7. advanced diagnostics remain available but secondary.

Slurm research is advisory for future-proofing and must not block the 3-day prototype.


## Round 4D Agent-A review — 2026-10-10

### A — Engine/model
Status: SMALL REPAIR REQUIRED.

Accepted:
- ordinal-set actor selector;
- parameter-only A-like -> D-like queue transition on fixed local-request topology;
- explicit topology requirement for B-like global synchronization;
- modeled wall-time semantics;
- frozen DES unchanged.

Required before port:
- ground Scenario A against the current tutorial prose;
- remove unnecessary max-in-flight admission policy from the single-request A baseline;
- make post-result classical resumption explicit for the submitting rank while keeping QPU off the baseline critical path;
- distinguish tutorial Idle-during-transfer wording from Explorer Blocked-on-result projection.

Known non-blocking limitation:
- explicit ordinal subsets do not automatically scale when actor-group count changes. Defer complement/range actor authoring until after the 3-day prototype unless it becomes a concrete blocker.


## Round 4D C/E reviews — 2026-10-10

### C — UI
Status: CLOSED/IDLE — PORT accepted.
- bounded clarity files staged to integration;
- system topology strip, modeled-wall-time wording, multiplicity explanation, redundant-label cleanup, and simple-linear straight edges accepted;
- browser visual check remains.

### E — Research
Status: CLOSED/IDLE — conceptual PORT accepted.
- Slurm crosswalk validates current scheduler-neutral design;
- no 3-day prototype schema/code change required;
- future target is ExecutionPlan/scheduling intent, not exact schedule.

### A — Engine/model
Status: SMALL REPAIR still pending from Round-4D review.

Next:
1. accept/port A repair;
2. integrate faithful actor-aware Scenario A into app;
3. browser-test A-D tutorial demo;
4. freeze prototype for IBM project-description deadline.


## Round 4D A final acceptance / Round 4E integration

### A — Engine/model
Status: CLOSED/IDLE — PORT accepted.
- ordinal actor selection accepted;
- actor-aware Scenario A accepted;
- baseline has no admission control;
- restored equilibrium is preserved through baseline completion;
- A-like -> D-like timing/load transition remains parameter-driven;
- B-like global wall remains topology-dependent.

### C — UI
Status: ACTIVE.
Integrate the accepted Scenario-A actor producer into the app while preserving the already-ported Builder clarity work.

### B/D/E
Status: CLOSED/IDLE.

Next:
1. C green integration;
2. browser-test A, B, C, D and one custom parameter edit;
3. freeze prototype and IBM project-description wording.


## Round 4E final review — 2026-10-10

### C — UI
Status: CLOSED/IDLE — PROMOTE accepted.

Staged integration:
- commit `65277404c9cc0000e8170567874456a2ccdd6c20`;
- integration CI `38089988964`: SUCCESS.

Prototype now includes:
- actor-aware Scenario A;
- actor-aware Scenario B;
- communication-dominated Scenario C;
- throughput/queue/policy Scenario D;
- logical Builder with topology strip and modeled-wall-time terminology;
- simple Explore + Advanced diagnostics.

### F — immediate next gate
Browser acceptance:
1. Scenario A Builder;
2. Scenario A playback states;
3. Scenario B Builder/playback;
4. Scenario C communication wall;
5. Scenario D queue vs policy hold;
6. one custom parameter edit and rerun;
7. Compare saved runs.

If those are clean, freeze the demo for the IBM project-description deadline.


## Round 4E final review — 2026-10-10

### C — UI
Status: CLOSED/IDLE — PROMOTE accepted.

Staged integration:
- `65277404c9cc0000e8170567874456a2ccdd6c20`;
- CI `38089988964`: SUCCESS.

Prototype now has actor-aware A and B, communication-focused C, throughput/throttling D, logical Builder clarity, simple Explore, and Advanced diagnostics.

### F — immediate gate
Final browser acceptance:
1. A Builder + playback;
2. B Builder + playback;
3. C communication wall;
4. D queue vs policy hold;
5. custom parameter edit + rerun;
6. Compare saved runs.

If clean, freeze prototype for IBM description.


## Round 4F — tutorial-scale demo conversion (2026-10-11)

**Coordinator decision:** D012. Source of truth: `agent/integration` plus published QAMP scenario pages. Current small A–D presets are regression/acceptance scaffolding; the IBM-facing public presets must resemble tutorial-scale workflows while keeping the logical DAG compact. No DES rewrite.

### A — Engine/model: ACTIVE, first bounded gate

**Branch:** `agent/engine`. Read current `origin/agent/integration` coordination and `AGENTS.md` before changing code.

1. **Minimal scalable actor selection above the frozen DES.** Current `all`, `one-per-instance`, and explicit `ordinals` do not express changing large complementary subsets concisely. Propose and implement only bounded variants needed for demos (prefer inclusive `range(start,end)` and `all-except(actorOrdinals)`; `one-per-instance` already covers the first N ordinal actors when multiplicities match). Preserve symbolic compact selectors in design/manifest rather than authoring arrays of 999 identifiers. Validate positive, unique, in-range ordinals and range bounds; keep existing selector behavior unchanged. No general selector-query language.

2. **New 1,000-rank Scenario-A demo model, independent of the 4-rank fixture.** Compact logical DAG: rank 1 prepares/submits one local QPU request and resumes classical work after the result; ranks 2–1000 perform useful classical work throughout; QPU capacity 1. No global result gate, resource queue, or admission/throttling limit. Explain if a single 999-rank modeled classical phase is an aggregate approximation rather than 999 independent DES tasks; do not confuse task multiplicity, actor count, and resource demand.

3. **Fix the Scenario-A critical-path tie.** In the currently integrated A baseline, background = 8 s and submit + QPU + local-consume = 1 + 2 + 5 = 8 s. This is *not strictly off the critical path*. Use synthetic timings with strict inequality while retaining the accepted restored-equilibrium window. The previous coordinator deliberately extended local-consume to 5 s so all ranks are still Working at t=7. Prefer lengthening independent background to 9–10 s (local path remains 1 + 2 + 5 = 8 s) rather than shortening local continuation. Verify at t=4 and t=7 that all ranks work, and that the local path finishes strictly before makespan. Propose the same correction to the baseline fixture without weakening regime tests. Keep post-result useful work explicit. The tutorial labels transfer Idle; the authored Explorer quantum-result wait begins post-submission and is Blocked. Do not conflate these.

4. **Deterministic acceptance:** inspect at interior timestamps, e.g. t=0.5: Working/Blocked/Idle = 1000/0/0; t=1.5: 999/1/0; t=4: 1000/0/0 with QPU idle. Verify QPU queue and admission waits are zero; no global synchronization; local branch completes *strictly before* overall makespan; existing small-fixture tests remain valid. All numeric times must be explicitly synthetic.

5. **Scaling evidence:** record actual time/memory to compile, simulate, and derive actor-state snapshots at 1,000 actors. Inspect whether naïve actor-by-task scans are likely to make a later 200-QPU-job B or 1,000-request C/D playback impractical. Report any bottleneck with numbers; do not optimize the DES or expand scope without coordinator review.

**Deliverable:** dedicated scenario-A demo fixture, selector implementation/type/manifest updates, focused tests, exact files and commit SHA, benchmark results, migration notes, and proposal `PORT / REIMPLEMENT / DEFER`. Update `docs/coordination/agents/engine.md` on your branch and STOP for F review. Run relevant Node tests and branch CI. No UI edits or new dependencies.

### B / D / E — CLOSED / IDLE
No task until F requests a concrete playback, graphics, or research repair.

### C — HOLD
After A's accepted model/selector result, F will assign the *public preset* A–D conversions on `agent/ui` (A ≈1,000 ranks; B ≈200 submitters with ≈1,000 total; C latency-driven local unblock; D ≈50 bounded outstanding jobs). Do not start this conversion before A/F interface review. Keep regression fixtures unchanged and expanded DES under Advanced/Diagnostics.

### F — NEXT
Review A's focused checkpoint and scaling evidence. Decide selector/migration contract; selectively PORT to staging, validate integration CI; then activate C for tutorial-scale A–D and perform browser acceptance. Preserve deterministic frozen DES and existing GitHub Actions. Later gates: dependency lock, deployment-root migration, documentation, main promotion.


## Round 4F final coordinator review — 2026-10-11

### Agent A — ACCEPTED / CLOSED for Round 4F
- **Decision:** PORT the two symbolic actor selectors, manifest preservation, projection support, strict A critical-path correction, dedicated 1,000-rank Scenario-A producer, and tests.
- **Agent branch checkpoint:** `agent/engine@1254de649fb0c15d458df20879c40a745e5e9e6d`; 47/47 Node tests and benchmark CI `38118493908` succeeded.
- **Integration:** `3cb83d81a09c9e41246975ddd975a66ce1859f13` (selectors), `92f0332bcf38167a1ebdd9143db83965e697ae8b` (A demo and tests), `b52116ddaff7e435f16ab8c7e13336d0d9ffd7b6` (stale Round-4C makespan assertion). Integration CI `38119401020`: **SUCCESS**.
- The frozen DES and GitHub Actions definitions are unchanged. Agent-only benchmark and workflow files were not ported.
- **Known scaling concern:** Actor projection naïvely scans actors × compiled task/wait entries; 200-job B and 1,000-request D performance are not established by the Scenario-A benchmark. Open a bounded new performance track rather than treating extrapolations as measured results.

## Round 4G — public-scale A–D demos and actor-projection performance (2026-10-11)

### A — Engine/model: ACTIVE (bounded scalability follow-up)
**Branch:** `agent/engine`. Read the integration Round 4G decision and current coordination files at/after the Round-4F port.

Task: make the *derived actor-projection layer* performant for 1,000 persistent actors and hundreds of compiled task/actor-wait entries. The existing functions `deriveActorStateDetailAt`, `deriveActorStateCountsAt`, and actor playback signature/summaries are the semantic reference. Prefer pre-indexed participation/wait intervals, event-time indexing, and reusable bounded state transitions or cached query structures; keep the API backward compatible where practical. Do **not** rewrite frozen DES or change engine metrics, ordering, actors' Working/Blocked/Idle interpretation, multiple blocked-reason coalescing, half-open intervals, or Working+Blocked conflict detection.

Validation: exact match between baseline and optimized actor details/counts/reasons across 4-rank A/B fixtures, 1,000-rank A, and a newly authored 1,000-actor/200-quantum-instance B stress model. Benchmark **precompute cost, per-snapshot cost, and complete representative playback-signature sweep**, with real timings/memory and deterministic repeated runs; provide at least one high-multiplicity synthetic result, not only a linear extrapolation. Aim for interactive cursor steps (soft target p95 < 30 ms on CI for B-200), but report measured failures honestly. The test must catch regression at overlapping wait claims and exact transition timestamps.

Also assess whether the existing actor-wait event vocabulary can model Scenario D's **50 admitted/blocked vs ~950 policy-held/idle** rank interpretation while QPU Run=1, resource Queue=49. If not, report the precise missing admission-trigger semantics and minimum above-DES interface proposal; do not silently invent actor counters or extend DES. Do not change production playback/UI directly. Update Agent-A role file, run focused tests/CI, hand off exact SHA and performance evidence, then STOP for F review. No new dependencies unless justified.

### C — UI/product: ACTIVE (public demo conversion)
**Branch:** `agent/ui`. Pull current `agent/integration` coordination and app source. **Do not wholesale merge the integration branch into C**; selectively port the approved A producer/selector files needed to compile and test on C's laboratory branch. C may work in parallel with A's performance track using the *accepted* selector semantics, but cannot claim B/D scalability until performance is measured.

**Checkpoint 1, immediately:** Switch the public Scenario-A bundle to `qamp-a-1000-demo.mjs`; preserve the original four-rank A fixture for tests. Keep logical DAG compact (4 tasks), show 1,000 actor Working/Blocked/Idle composition and QPU state, preserve restored-equilibrium playback and strictly off-critical-path behavior. Ensure default UI does not flood the screen with per-task IDs; keep expanded DES under Advanced. Test Builder/Explore, parameter edit/re-simulate, Compare and A synthetic provenance. Retain scenario identifiers and model semantics.

**Checkpoint 2:** Implement source-faithful 1,000-actor Scenario B, about 200 submitters/quantum results, one QPU lane, complete-result global gate, and collective return to useful work. Distinguish policy-held service serialization from QPU resource queue; the wall must be dependency/synchronization-driven. Keep logical DAG grouped, preserve the existing small B fixture/tests, and measure simulation, actor state, and full playback/keyframe construction. If playback is too slow, pause high-scale browser acceptance until Agent A's projection optimization is accepted, without shrinking the public scale silently.

**Checkpoint 3 (conditional feasibility):** Design and implement C's latency/transfer-dominated independent local dependencies and D's bounded-throttling pipeline (about 1,000 ranks and 50 outstanding admitted quantum jobs where faithful). For C, avoid an artificial saturated queue when the tutorial specifies QPU idle/no sustained queue; for D, distinguish QPU running/resource queue/policy-held and truthful actor Blocked/Idle counts. Do not fake exact old tutorial frame counts if the accepted DES/actor projection cannot represent them; instead provide a minimal source-grounded adapter proposal and acceptance gap for F/A review. Never create one visible DAG node per rank. Synthetic timing assumptions must remain explicit.

All checkpoints: no raw-event blinking; one synchronized time cursor; reproducible `npm test`, typecheck/build, relevant small-fixture regressions, performance evidence, and exact production file/commit handoff. Preserve existing GitHub Actions workflow semantics and source-import guard for Scenario B. Stop at bounded checkpoints for F promotion decisions.

### B / D / E — CLOSED / IDLE
No changes without a concrete F-approved defect.

### F — NEXT
1. Review A optimization and C public-A/B checkpoints independently; selective PORT and integration CI at each gate.
2. Resolve/record C/D semantic gaps before public release; require actual full-size playback evidence.
3. Browser accept A–D, custom edit/simulate/Compare, and Advanced.
4. Final cleanup (lockfile, deployment root, docs) and then decide main promotion.

## Future FTQC extension (documentation only) — 2026-10-12

**Status:** DEFER implementation. User priority remains finishing a credible, browser-demonstrable prototype. Agent F should include a short, accurately qualified future-work paragraph in final README / IBM description, using `FTQC_EXTENSION_OUTLOOK.md` and D015. Concept: coupled *application orchestration + FTQC execution/resource tuning* across cloud-accessed and tightly integrated HPC–QPU deployment profiles. Do not conflate remote internet latency with QEC feedback loops, which must run on the quantum-system/local real-time control path. Preserve the present frozen DES and all active Round-4G A/C assignments; no additional developer track is opened.

## Round 4G coordinator final reviews — 2026-10-12

### A — indexed actor projection: PORT ACCEPTED
- Agent branch `054dce39c5becf214c4f2718f5d8ea2cd4bd53e1`; CI `38311060733` SUCCESS. Actual B200 microbenchmark: run `38310735762`.
- Accepted reusable `createActorStateProjector`, WeakMap cache over immutable manifest/result identities, indexed task-event/actor-interval/group-summary derivation, and preserved legacy detail/count APIs. A 1,000-rank, 200-result Scenario-B test fixture with reference oracle verifies exact interval boundaries, blocked reasons, conflict rejection and deterministic signatures.
- Selective app PORT at `e8d872c67e6e0530c4bcfb14ca7a7818ccb70ec9`; integration `38313659986` SUCCESS. Tests and typecheck/build pass. Frozen DES untouched.
- D admission-trigger representational gap accepted as bounded follow-up under D017, not silently added.

### C — public 1,000-rank Scenario A: PORT ACCEPTED
- Agent branch `efc3b11c513a911b1f0f5905ce8743a5215c508e`; CI `38310788980` SUCCESS. Checkpoint-1 code CI `38310612630` SUCCESS, 97/97 Node tests.
- Public Scenario A now loads accepted four-node, 1,000-actor fixture with correct local quantum wait, restored classical work, no queue/admission, and strict off-critical path (local t=8, makespan t=10). Four-rank regression remains.
- Selective app PORT at `d57abf519babb9a8a9770b6ff9c6dd11927f3b6f`; integration `38313789867` SUCCESS. A-only acceptance tests, source descriptions, and run-comparison provenance preserved.
- No B/C/D public-scale changes were made by C. UI browser acceptance is still pending.

## Round 4H — source-faithful B demo and minimal D admission-wait repair

### Agent A — Engine/model: ACTIVE (bounded D repair, D017)
Branch `agent/engine`. Read latest integration D016/D017, this Round 4H assignment, AGENTS and frozen v1 contract before changing code.

**Implement only an additive actor-wait event `queued` above DES:** extend `ActorWaitTaskEvent`, `CompiledActorWaitEventType`, high-level compiler validation and mapping `queued → task_queued`; update associated .d.ts/.d.mts types, actor-state index compatibility and regression tests. The frozen DES already emits `task_queued` both for QPU work immediately started and work waiting on QPU resources after admission. **Do not alter DES events or scheduling.**

Create a deterministic *test-only* D stress producer: ~1,000 persistent MPI-rank actors, corresponding classical preparation + QPU requests + local continuations, QPU capacity 1 and max-in-flight 50. Test interior/exact timestamps such that:
- while the initial 1,000 classical preparations execute, their actors are Working;
- after preparations hand off, exactly 50 admitted actors are Blocked (1 QPU running +49 resource-queued), with ~950 still policy-held/Idle;
- after one quantum completion, one actor resumes local classical work while another is admitted and Blocked; ensure resource queue and policy-held counts stay distinct and Working+Blocked never overlaps;
- the original 4-rank B and D tests and optimized projector oracle still pass.
Use only synthetically declared task durations. Test the zero-width immediate-queue/start case and resulting actor interval. Report whether the existing wait lifecycle can represent D all the way to eventual restored Working without inventing ranks or temporal semantics.

Provide exact benchmark/CI/paths, affected types and any limitation. No UI, no generalized admission ontology, no new dependencies. STOP for F review. If the proposed `queued` event cannot preserve correct actor behavior, report the precise counterexample instead of widening scope.

### Agent C — UI/product: ACTIVE (Checkpoint 2, public B200)
Branch `agent/ui`. Read latest integration D016/D017 and Round 4H; selectively port accepted A's indexed actor-projection files from `agent/integration` into the C lab instead of reverting them or merging entire branches. Preserve public 1,000-rank A and small A/B fixtures.

Implement **Scenario B** public preset with ~1,000 persistent actors, ~200 submitters/QPU evaluations, one serial QPU lane, explicit complete-result global synchronization, 1,000-actor collective recovery, and a **compact logical DAG** (not 401 visible default nodes). The accepted A B200 stress fixture under `app/tests/fixtures/qamp-b-200-stress.mjs` is reference/test data; place production B in a dedicated public preset with explicit synthetic provenance. Policy admission may serialize service, but the *explanatory* bottleneck is full-result dependency; resource queue must not be misrepresented as cause.

Validation must measure full `buildActorAwareVisualKeyframes`, time-cursor scrubbing, actor-state snapshots, and Browser Builder/Explore responsiveness, not just the indexed actor microbenchmark. Confirm Advanced's expanded DES graph is lazily mounted or bounded when collapsed so 401 concrete nodes do not silently render behind disclosure. Retain one synchronized cursor, no raw-event blinking, test custom edits/recompile/rerun and Compare, preserve Scenario B `process` browser-import guard. Do not replace frozen DES or import new UI frameworks.

Run npm tests, typecheck/build, CI; provide exact SHA/files, measured timings, known defects and PORT/DEFER assessment. STOP for F review before beginning public C/D. Scenario D's queued wait type is under A's separate repair; do not hand-code D counters.

### B / D / E — CLOSED/IDLE

### Agent F — NEXT
Review both A and C bounded checkpoints; selectively PORT and require integration CI. Then decide C/D public implementation and full browser acceptance. Finish dependency lock, deployment-root migration, docs, and main only once coherent. FTQC D015 remains documentation-only and is not on the development critical path.

## Round 4H Agent-A acceptance — 2026-10-12

### Agent A — CLOSED/IDLE (PORT ACCEPTED)
- Producer HEAD `agent/engine@099cdf46f2b3dfd00a1a1dd7d2a7fcff4e32bf3d`; CI `38321701185` SUCCESS; focused implementation CI `38321518049` SUCCESS, reported 63/63 tests. Synthetic D1000 stress accepted.
- Staging PORT `db73f506eeee0649ffe0ee972900695a528e92e9`; CI `38322036602` SUCCESS (Node tests, typecheck and Vite build). Production files: `app/src/design/compiler.mjs`, `app/src/design/types.ts`. Test-only: `app/tests/fixtures/qamp-d-1000-stress.mjs`, `app/tests/scenario-d-admission.test.mjs`, package test script.
- Semantic contract: authored `queued` wait activates from existing `task_queued` event, even if QPU task starts immediately, and releases on result completion. Policy-held, not admitted requests remain actor Idle unless other explicit claims apply. No frozen-DES changes, no new dependencies/GitHub Actions modifications.
- Round-4H D1000 fixture models only the *single* request-and-local-continuation cycle: actors return to Idle at final makespan, not to a new 1,000-Working loop. Public Scenario D can restart only through new authored work/repeat; no visual fabrication.
- Performance reported from A's Node 22 benchmark for 3,000 expanded tasks: compile ≈76.8 ms mean; DES ≈268.3 ms mean; projector build ≈89.8 ms mean; indexed count p95 ≈0.00284 ms. **Not** a measured complete browser playback result.
- A remains idle. No further A task until public C/D work identifies a concrete defect.

### Agent C — CONTINUES Round 4H public B200 checkpoint
Do not interrupt or change C's B200 deliverable. At next natural coordinator heartbeat, consume D018 and the higher-layer `queued` actor wait contract. Scenario D authoring remains a separate future checkpoint *after* B review. Do not import D1000 as public D automatically.

### F — NEXT
Review C's public B200 delivery independently and check full keyframe construction, hidden Advanced expanded-graph mounting, Builder/Explore/Compare, real browser responsiveness. Selectively port + CI. Then assess public C/D, browser acceptance, lock/deployment/docs/main. FTQC extension remains documented as future work only.

## Round 4H final coordinator review — 2026-10-12

**Agent C Checkpoint 2 — PORT ACCEPTED/CLOSED.** Agent-C HEAD `c80de454f1814dd42e7878a80113affea9760d67` CI `38321963530` success. Staged integration `39a8a628ce122342b88794d6c8914b657c81521c`, CI `38322560759` success (122 Node tests, typecheck/build). Accepted: B200 public grouped 3-node DAG/401 compiled tasks; 1,000 authored actors, 200 submitter results, one serial QPU, full-result collective gate, exact indexed actor summaries, bounded QPU-ID labels, lazy Advanced graph mounting. Small B remains regression. Frozen DES, D018 actor wait, dependencies, and CI workflows unchanged.

**Unverified release gate:** actual React browser paint/click/playback and Advanced opened with 401 compiled nodes. Node CI full-keyframe median 35.451 ms and cursor p95 0.988 ms establish computation only, not browser responsiveness.

## Round 4I — public Scenario C transfer/latency wall

### C — ACTIVE; single bounded checkpoint
**Branch:** `agent/ui`. Fetch/read latest `agent/integration` `AGENTS.md`, policy, `PROJECT_STATE.md`, `REVIEW_QUEUE.md`, `INTERFACE_CONTRACTS.md`, D018/D019 and source `https://github.com/HPC-Quantum/Documentation-website/blob/main/scenario-c.md`. Do not wholesale merge. Reconcile lab files with accepted B200 staging and D018 `queued` wait while preserving current A/B fixtures.

**Goal:** author source-faithful public C at ~1,000 persistent MPI-rank actors using a compact logical DAG. Positive modeled dependency transfers (outbound and result return) dominate short QPU/classical tasks; QPU is frequently idle during transfer and no meaningful QPU queue/admission backlog is generated; independent results release local continuation without global synchronization. Support latency and/or data/bandwidth transfer assumptions as already modeled; no provider-queue invention.

**Critical anti-invariant:** 1,000 simultaneous QPU-ready tasks at QPU capacity 1 create service saturation, which is **Scenario D, not C**. Use source-grounded staggered arrivals, bounded cohorts, or explicitly declared actor aggregation rather than falsifying queue/load. Avoid one rendered node per rank. Distinguish an aggregate modeled task from individual requests and label all synthetic assumptions. QPU capacity 1 remains the tutorial setting; do not silently inflate capacity to erase the queue.

**Blocked semantics:** require a time interval with positive authored communication in flight, some ranks Blocked waiting for their *returned result*, QPU Running=0 and resource Queue=0. Explicit actor wait may activate on preparation completion and should release no earlier than the consumer's `task_ready` after positive return-transfer dependency completes; check half-open event boundaries and Working+Blocked conflicts. No UI-derived fictitious actor counters/transfer-state resource.

**Acceptance:** communication duration dominates service; QPU utilization low and queue/admission wait near zero; independent consumers start before the final QPU result completes; no global gate; time/profile edit that lowers transfer latency reduces makespan/Blocked interval with same topology; Builder→recompile→simulate→Compare retains source provenance. Check raw-event playback compression, source-event keyframe mapping, full cursor/keyframe CI timing, and collapsed Advanced laziness. Preserve A/B/B200 tests, D1000 stress (once selectively ported into C lab) and D018. No DES changes, new framework or FTQC implementation.

**Handoff:** report exact paths/commit, 1,000-rank actor grouping choice, measured timing/perf, CI/test evidence, known limits and PORT/DEFER recommendation. Update role file and STOP for F review. Do not implement public D yet.

### A / B / D / E — CLOSED/IDLE
A's higher-layer `queued -> task_queued` is accepted. Do not start another track without F's explicit request.

### F — NEXT
Review C transfer wall, selective PORT + integration CI; then scope public D as a separate gate, including authored next-cycle behavior. Full A–D browser/Builder/Compare smoke, dependency lock/npm ci, deployment-root migration to `app/`, README with deferred FTQC outlook, main promotion follow.

## Round 4I Agent-C final acceptance — 2026-10-12

**Status: PORT ACCEPTED / CLOSED for public Scenario C.** C HEAD `e25d21b8c85b263efc4e8947dbf261632d4b28e7`, CI `38326263206` SUCCESS; checkpoint source `f539b22a4a4bdbd260b1259b987b99b9ac6cb6be` CI `38326092092` SUCCESS. Selective staging `53248bf1a2c7488d52982a77191919f5ff4b0b0e`, integration CI `38326633662` SUCCESS (135/135 tests, TS, Vite).

Accepted public C: 1,000 ranks modeled in five explicitly synthetic 200-actor cohorts; five aggregate QPU evaluations, 15 compact logical/compiled tasks; QPU capacity one with zero resource/admission wait; positive outbound 5 s + return 3 s transfer cost; no global synchronization. At t=4.5 QPU Idle/Queue0/PolicyHeld0, five transfers active, 1,000 actors Blocked; independent consumer first resumes ~t=8.3 before last QPU result ~t=9.3. Makespan ~12.8 s (not a measured wall-clock prediction); reduced-transfer profile yields ~8.8 s on same topology. Model does *not* assert 1,000 individual quantum jobs.

Preserved: A1000, B200, source small-scenario test suite, D1000 D018 admission tests, indexed actor projection, frozen DES, synthetic provenance, Builder/Compare, lazy Advanced. No new dependencies or CI-workflow edits. Node benchmark: 23 keyframes median build 1.291 ms, cursor p95 0.160 ms. Actual browser playback/painting remains pending F acceptance.

## Round 4J — public Scenario D capacity wall / asynchronous drain (2026-10-12)

### Agent C — ACTIVE, one final scenario checkpoint
**Branch:** `agent/ui`. Fetch/read latest `origin/agent/integration` coordination, D018–D020, `AGENTS.md`, `repo_policy.toml`, `INTERFACE_CONTRACTS.md`, `PROJECT_STATE.md`, and source `HPC-Quantum/Documentation-website:scenario-d.md`. Selectively reconcile code against integration; never wholesale merge. STOP for F after this checkpoint.

**Goal:** Replace the public small Scenario D with a **source-faithful, 1,000-persistent-rank asynchronous throughput-limited model** and compact logical DAG. Use `app/tests/fixtures/qamp-d-1000-stress.mjs` as *test/reference*, not as an undeclared measured performance model. Authored task multiplicity and group actors are distinct; QPU capacity = 1 and `maxInFlightQuantumByPool.qpu = 50` means **1 Running + up to 49 QPU-resource Queued**. Other dependency-ready quantum requests are **policy-held**, not QPU queued. No global result/collective gate. All service times and costs synthetic.

**Actor semantics:** Explicit matching wait `activation: quantum queued` (compiled to existing `task_queued`) until matching quantum completion; a rank is Blocked *only after admission*, while policy-held, non-working ranks remain Idle. Classical prep/offload/continuation represented as actual modeled work, with no fabricated transfer/queue state. The D1000 accepted reference shows t=0.5: 1,000 Working; t=1: 50 Blocked /950 Idle, QPU Run1/Queue49/PolicyHeld950; t=2: 1 Working /50 Blocked /949 Idle with slot replenishment. Preserve half-open transitions and show local resumed work before full quantum drain.

**Important tutorial-fidelity distinction:** Published Scenario D also depicts early staggered submissions, intermittent off-load work, late 950/1,000 Working, and a recurring loop. These are **not automatically implied** by a one-shot 1,000-task FIFO workload. If additional states are included, they must result from explicit credible task/actor participation, dependencies and repeat phases. Do not use hand-coded frame counters, a fictitious collective/global barrier, unmodeled provider/transfer phases, or unreasonable task durations merely to match a screenshot. If D6's transient 2-Working/49-Blocked state or D9's full 1,000-Working restoration cannot be represented without new orchestration semantics, document the exact limitation and present the supported mechanism truthfully. At one-shot makespan, all 1,000 actors Idle is correct in the present D1000 reference.

**Behavioral acceptance:** bounded resource queue depth ≤49 (or the actual bound if justified), positive policy-admission wait, high QPU utilization during demand, independent first result consumption before last result, no global actor wait, initial blocked/idle composition and slot replenishment consistent with DES events. Test contrasting policy limits or quantum service assumptions with same topology and explicit provenance; compare exact metrics for queue vs policy hold and two saved RunRecords. Preserve A/B/C public preset tests, D1000 oracle, custom edit/Compare. The public logical DAG must stay compact even if compiled task count is thousands; Advanced must stay unmounted while closed and be safe if opened (bounded/virtualized or disclose scale, avoid unbounded automatic ELK work).

**Playback/performance:** Meaningful slow introductory/admission frames → compressed sustained drain → clear terminal states, with semantic source-event ranges, no relentless blinking or hand-authored activity counters. Benchmark *full* keyframe construction, cursor sweep/generic snapshot, rendering-size risk and Node memory at 1,000 requests; record any high-scale degradation. No invisible 1,000-node default DAG or 1,000-ID QPU label floods. Browser visual acceptance by F remains separate; CI computation alone does not prove responsive React interaction.

**Scope/handoff:** No DES rewrite, added framework, stochastic/provider queue, arbitrary scheduler/optimizer or FTQC features. Include exact commit/paths, CI + TS/build, reproducible timings, source/limitations, recommended PORT/DEFER and updated role file. **STOP for F review.**

### A / B / D / E — CLOSED/IDLE
No additional task.

### F — NEXT
Review/port C public D if technically faithful; run app CI; then full browser A–D, Builder→edit→simulate→Compare, diagnostic disclosures/performance, dependency lock/npm-ci and deployment-root migration, README with FTQC future outlook, main release decision. Preserve GitHub Actions and source-era history.
