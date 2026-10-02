# Cross-Track Matrix

Updated: 2026-10-02

| Track | Owns | Current dependency | Primary integration risk | Current status |
|---|---|---|---|---|
| A Engine | workflow semantics + DES + metrics | coordinator R1-R5 | semantic debt before freeze | repair pass requested |
| B Playback | trace compression + pacing | frozen A v1 | reintroducing semantics into animation | checkpoint accepted; conditional PORT |
| C UI | product interaction | frozen A v1 + B/D promoted interfaces | UI inventing business logic | active |
| D Graphics | visual toolchain | representative fixtures | multiple competing graphics stacks | active |
| E Research | literature/QAMP validation | Rao bounded follow-up | scope expansion | checkpoint accepted; PORT + follow-up |
| F Integration | contracts + promotion + product | all tracks | coordination bottleneck | active |

## Current cross-track issues

1. A must add explicit fixed reservations and per-pool QPU admission.
2. A must fix equal-time causal closure and zero-cost dependency events.
3. A/F will freeze half-open intervals and aggregate communication naming.
4. B waits for the repaired v1 trace, then gets one compatibility pass.
5. E completes Rao analytical baseline validation.
6. C should not bind permanently to v0 mocks until v1 freeze.
