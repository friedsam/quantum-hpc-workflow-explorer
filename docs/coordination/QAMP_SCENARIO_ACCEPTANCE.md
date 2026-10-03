# QAMP A-D Scenario Acceptance — reconciled Round 2 contract

Date: 2026-10-02
Owner: Agent F
Status: accepted for staging

## Purpose

Scenarios A-D are the first behavioral acceptance suite for the generic Workflow Explorer.
They preserve the orchestration mechanisms from the QAMP tutorial, not literal historical frame counts. All fixture timings are synthetic.

## Accepted mechanisms

### A — loosely coupled overlap
- Local quantum dependency only.
- Independent classical work overlaps the QPU.
- Quantum path is off the overall critical path.
- No global barrier, communication wall, or meaningful QPU queue/admission wait.

### B — synchronization wall
- Subset classical preparation.
- Serialized QPU for this preset.
- Later collective classical continuation requires the complete quantum result set.
- Fixed classical reservation may remain allocated but unused while the global dependency is unresolved.
- Admission throttling is not the cause.

### C — latency/data-movement wall
- Independent result consumers.
- Positive communication dependencies dominate task service time.
- No global barrier.
- QPU is underutilized and has no meaningful queue/admission wait.
- No provider queue delay is invented.

### D — throughput-limited asynchronous workflow
- Independent CPU -> QPU -> CPU paths.
- QPU capacity 1 for the preset.
- Per-pool in-flight quantum work is bounded.
- Policy wait is distinct from QPU resource queue.
- Local consumers resume before all QPU work drains.
- No global barrier.

## Important distinction: simulation sufficiency vs explanatory-state sufficiency

The frozen-v1 engine is accepted as sufficient to reproduce the execution mechanisms above.

This does NOT yet establish that the current output contract is sufficient for the final human-facing HPC-state explanation.

Current v1 directly exposes:
- classical/QPU task running intervals;
- resource active / allocated-idle / released intervals;
- QPU/resource queues;
- policy throttling and admission wait;
- dependency communication events.

It does not directly expose a mutually-exclusive causal decomposition such as:
- working;
- waiting on own QPU result;
- waiting on communication;
- waiting at a global synchronization dependency;
- policy-held/throttled;
- idle because no runnable work exists.

Therefore allocated-idle must not simply be relabeled Blocked, and task_throttled must not automatically be converted into an HPC-rank count.

Round 2B must determine whether a defensible causal/explanatory state can be derived from WorkflowSpec + SimulationResult for A-D. Only if it cannot should the engine contract be extended with wait-reason provenance.

## Promotion evidence

- executable fixtures: Agent A Round 2;
- behavioral tests: Agent A Round 2, 5/5 reported passing;
- source-grounded semantic/anti-invariant matrix: Agent E Round 2;
- frozen engine v1 unchanged.