# Coordinator Daily Synthesis

## 2026-10-02 — multi-agent rebuild initialized

### Repository baseline

- `main`: legacy static Explorer with bespoke scenario state machines and disconnected placeholder Builder/Runner.
- `prototype-vqe-runner`: historical shared-model experiment; useful evidence, not accepted architecture.
- Product horizon: approximately 10 days.

### Agent B playback checkpoint

[verified] Accepted as conditional PORT. Pure trace-to-presentation layer; 3005-event stress trace compressed to 10 keyframes; 9/9 reported tests.

### Agent E research/validation checkpoint

[verified] Accepted as PORT. IBM/QAMP semantics corrected and serious Fe4S4 structural preset/acceptance cases defined. One bounded Rao analytical addendum remains.

### Agent A engine checkpoint

[verified] Reviewed Agent A's deterministic DAG/DES core and proposed interface v1.

Strong points:
- compact zero-dependency engine;
- explicit resource pools/capacity;
- deterministic FIFO scheduling;
- configurable QPU capacity;
- admission wait separate from resource queue wait;
- fixed vs release-aware accounting;
- clear trace/interval/metric outputs;
- 12/12 local tests reported passing.

Coordinator accepted the main architecture but did **not** freeze v1 yet.

Required bounded repair:
1. explicit fixed classical reservation size by pool;
2. per-QPU-pool in-flight limits;
3. process same-time completion/dependency-release events to causal closure before scheduling starts;
4. zero-cost control dependencies must not emit fake communication events;
5. half-open interval semantics; completion authoritative via event; rename communication metric to reflect aggregate duration rather than critical-path time.

Decision: **PORT after R1-R5**, not wholesale merge.

### Next synthesis checkpoint

Freeze engine v1 after R1-R5, then request one B compatibility pass and bind UI/types to the accepted contract.
