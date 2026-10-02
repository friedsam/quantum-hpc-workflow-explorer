# Agent E — Research / Validation

Branch: `agent/research`

## Mission

Keep the simulator/modeling grounded in current literature and the actual QAMP/IBM workflow while preventing research scope from consuming the 10-day product.

## Initial assignment

Validate and summarize only what affects implementation:

- analytical timing model / communication regime quantities suitable as baseline;
- queue/resource-policy findings relevant to tests/presets;
- QAMP tutorial semantics that should remain;
- IBM C/C++/MPI/OpenMP/QRMI/SQD workflow structure suitable as the first serious preset;
- assumptions from legacy scenarios that should be removed or demoted to preset-specific assumptions;
- acceptance cases for Agent A.

Distinguish published equations/results from project-specific assumptions.

## Boundaries

Do not:
- design a new scheduler;
- add QEEGNet/CUDA-Q/live Slurm/current hardware execution to the 10-day scope;
- modify production engine/UI logic directly.

## Current status

**Checkpoint 1 ready for coordinator review.**

Primary evidence artifact:

- `docs/research/VALIDATION_MATRIX.md`
- source commit: `bbb5261d1c1a2f8741e40bd0b9cd13cd25c5c6b7`

### Verified implementation-relevant results

- Current Qiskit C API is a low-level Qiskit core-data-model API; provider execution/scheduling must be attributed to the appropriate runtime/QRMI layer.
- IBM's Fe4S4 SQD C/C++ demo integrates quantum work exclusively at MPI rank 0; MPI parallelism is used for the classical eigensolver/post-processing.
- The inspected demo samples the QPU once before its bounded configuration-recovery/SBD loop.
- Current IBM Quantum Compute documentation supports QPU capacity 1 for that reference environment, but the product must keep capacity configurable because this is not universal.
- IBM provider queueing is dynamic fair-share behavior and must not be represented as a fixed measured queue delay.
- Hockney/alpha-beta communication cost maps directly to v0 dependency latency/bytes/bandwidth fields and is sufficient as the first analytical baseline.
- Slurm allocation semantics justify keeping active, allocated-idle, and released resource states separate.

### Recommended preset

`ibm-sqd-fe4s4-reference` — structural IBM/QAMP reference DAG:

`rank0 setup -> rank0 build -> rank0 transpile -> rank0/QPU sample -> bounded [rank0 recovery/subsample -> all-rank SBD] loop`.

It is a topology/reference preset, not a calibrated performance benchmark.

### Engine acceptance cases

Defined in `docs/research/VALIDATION_MATRIX.md`:

- E1 configurable QPU capacity;
- E2 affine communication dependency;
- E3 fork/join barrier semantics;
- E4 bounded in-flight quantum work;
- E5 scaled IBM fixed-allocation accounting;
- E6 explicit external/provider delay.

### Interface clarifications requested

1. **Fixed reservation size:** v0 has `allocation: "fixed"` but no explicit workflow/job reservation quantity, so it cannot unambiguously account for N reserved MPI-rank slots while rank 0 alone is active.
2. **`maxInFlightQuantum`:** define as admitted-but-not-complete quantum tasks (running + resource-queued); policy-held ready tasks should remain distinct from resource queue depth.
3. **External/provider delay:** do not add a provider scheduler; either model explicit user/synthetic delay with an assumption label or defer it from v1.

Agent F/A must accept or reject these semantics before they become shared contract.

### Legacy disposition

- Preserve A handoff, B fork/join, C latency stress, and D bounded-admission concepts only as engine-derived fixtures/presets.
- Remove hard-coded 1000-rank/200-submitter counts as defaults.
- Remove “every rank submits QPU work” from the serious IBM preset.
- Remove constant provider queue time and queue-time-as-QPU-cost assumptions.
- Remove aggregate Working/Idle/Blocked counters as engine ontology.

## Handoff

- **Production files proposed for promotion:** none directly; this is research/validation evidence.
- **Evidence proposed for PORT:** validated facts, IBM preset topology, acceptance cases E1-E6, legacy assumption removals.
- **Investigation-only files:** none.
- **Dependencies added/changed:** none.
- **Production interface modified:** none.
- **Requested interface changes:** reservation semantics + in-flight definition + external-delay handling above.
- **Validation performed:** primary/current IBM/Qiskit/Slurm sources, direct qiskit-c-api-demo source inspection, legacy Explorer source inspection, deterministic fixture arithmetic.
- **Known failure/discarded approach:** legacy additive Runner is not suitable as authoritative timing/cost model; legacy hand-coded scenario counters are not suitable engine semantics.
- **Unresolved risk:** exact production service/queue times are not supported by sources and must remain user/synthetic inputs.
- **Recommended promotion decision:** **PORT**.
