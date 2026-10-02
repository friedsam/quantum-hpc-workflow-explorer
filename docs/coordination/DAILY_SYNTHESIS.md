# Coordinator Daily Synthesis

## 2026-10-02 — multi-agent rebuild initialized

### Repository baseline

- `main`: legacy static Explorer with bespoke scenario state machines and disconnected placeholder Builder/Runner.
- `prototype-vqe-runner`: historical shared-model experiment; useful evidence, not accepted architecture.
- Product horizon: approximately 10 days.
- New target: explainable pre-execution hybrid workflow simulator/planning app, not a production scheduler.

### Governance

Established:
- Agent A–F roles;
- Agent F promotion authority;
- shippable-main rule;
- provisional interface contract;
- validation contract;
- scratch/clutter policy;
- continuation protocol.

### Agent B playback checkpoint

[verified] Reviewed `agent/playback`. Coordinator decision: **conditional PORT** after Agent A freezes v1 `SimulationResult`.

Accepted:
- pure trace-to-presentation layer;
- exact source order preserved;
- deterministic semantic compression/playback;
- 3005-event stress trace compressed to 10 keyframes;
- 9/9 reported tests passing;
- no dependencies.

Open B/A integration questions:
- interval-boundary semantics;
- repeated multi-signature cycle compression if real v1 traces require it.

### Agent E research/validation checkpoint

[verified] Reviewed `agent/research` and independently checked the highest-impact IBM/Qiskit corrections against current official documentation and the current qiskit-c-api-demo source.

Accepted:
- Qiskit C API is a low-level core-data-model interface; provider execution/queue semantics belong to runtime/QRMI layers.
- IBM Fe4S4 SQD demo has quantum integration exclusively at MPI rank 0.
- Current demo performs one sampling stage before the configuration-recovery/SBD loop.
- IBM Quantum Compute cloud execution processes only one job at a time on the QPU while classical preprocessing can overlap.
- provider fair-share ordering is dynamic and should not be represented as a fixed measured queue delay.
- QRMI deployments can expose multiple execution lanes, so engine QPU capacity remains configurable.
- serious IBM/QAMP structural preset and E1-E6 synthetic engine acceptance cases are useful.
- fixed reservation vs active usage and policy-wait vs resource-queue distinctions should be reconciled into v1.

Coordinator decision: **PORT** research findings/fixtures, not branch prose wholesale.

One gap remains: E validated the Hockney communication term but did not yet validate the full Rao et al. 2026 analytical cycle model and `R_cc`. A bounded Rao addendum was requested on E's branch. After that, E may stop.

### Next synthesis checkpoint

Review Agent A's v1 engine/model proposal and reconcile it against accepted B/E findings before freezing shared interfaces.
