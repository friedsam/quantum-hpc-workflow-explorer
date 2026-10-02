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
**Status:** coordinator PORT accepted; requested Rao addendum complete.

Completed:
- `docs/research/VALIDATION_MATRIX.md` sections 1–10: IBM/QAMP validation, preset, legacy disposition, E1–E6;
- section 11: Rao et al. 2026 equations (1)–(5), `F` vs shot-count distinction, diagnostic scope, exact synthetic fixture R1, published SQD reproduction R2;
- Rao SQD `R_cc` reproduced for remote/co-located/tight tiers to the paper's stated rounding/order-of-magnitude precision.

Latest Agent E commits:
- `957a9dd3243faf9e40b56d6ff63d198f6433fed4` — Rao analytical baseline;
- `81b6defc28414bf751393dbfcb645e395fe2b277` — role/handoff completion state.

No production logic, dependencies, or shared interfaces changed.

Requested R1–R3 interface reconciliation remains owned by Agent F/A.

**Recommended state:** stop Agent E unless Agent F requests a later source check.

## F — Coordinator
**Status:** active.

Do not integrate substantive feature code until the first checkpoint from A–E has been reviewed.

Immediate F tasks:
- maintain shared contracts;
- resolve semantic conflicts;
- enforce 10-day boundary;
- decide promotion status;
- keep `main` coherent.
