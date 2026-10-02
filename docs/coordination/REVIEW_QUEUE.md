# Coordinator Review Queue

Updated: 2026-10-02

## A — Engine
**Status:** start.

Deliver:
- proposed implementation-ready v1 WorkflowSpec/SimulationResult contract;
- discrete-event architecture;
- minimal deterministic example;
- invariant-test plan.

Do not build UI.

## B — Playback
**Status:** start independently against mock v0 trace.

Deliver:
- trace → semantic keyframe → presentation scheduler design;
- explicit strategy for repetitive-event compression;
- deterministic proof using a Scenario-D-like stress trace;
- recommendation for playback controls/pacing.

Do not create a second simulator.

## C — UI
**Status:** start independently against mock v0 data.

Deliver:
- serious product information architecture;
- Builder/Explorer/Compare user flow;
- component boundaries;
- React/TypeScript migration/scaffold recommendation.

Do not calculate simulation metrics.

## D — Graphics
**Status:** start.

Deliver:
- benchmark the same representative diagram with robust candidates;
- strict grid/anchor approach;
- recommendation for runtime workflow graph and runtime state graphics;
- reject approaches that are fragile under revision.

Matplotlib is not a candidate for architecture/state diagrams.

## E — Research/validation
**Status:** **Round 2 checkpoint ready for Agent F review.**

Delivered:
- `docs/research/QAMP_SCENARIO_CONTRACT.md`;
- source-grounded A-D mechanism matrix;
- frozen-v1 mapping for Working/Idle/Blocked/Transfer/Run/Queue;
- minimum structures, measurable consequences, and anti-invariants for each scenario;
- explicit conclusion: no frozen-v1 compatibility defect found.

Round 2 commits:
- `c8b3e99421367ae85472d21dd653abd47a0420f9` — concept acceptance contract;
- `af0a92485b12a4cbc9e26881bea8767c80a5a9a1` — role/handoff checkpoint.

Key reconciliation constraints:
- A must prove overlap and QPU off critical path.
- B must prove global dependency gating without admission-control/queue saturation as the cause.
- C must prove communication-dominated delay with low QPU utilization/small resource queue.
- D must prove capacity mismatch + bounded admission, positive policy wait, bounded resource queue, and independent consumer progress.

No engine/UI/interface/dependency changes.

**Recommendation:** PORT the matrix into A/E reconciliation, then stop Agent E pending review.

## F — Coordinator
**Status:** active.

Do not integrate substantive feature code until the first checkpoint from A–E has been reviewed.

Immediate F tasks:
- maintain shared contracts;
- resolve semantic conflicts;
- enforce 10-day boundary;
- decide promotion status;
- keep `main` coherent.
