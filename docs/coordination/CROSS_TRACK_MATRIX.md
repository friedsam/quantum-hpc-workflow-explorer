# Cross-Track Matrix

Updated: 2026-10-02

| Track | Owns | Current dependency | Primary integration risk | Current status |
|---|---|---|---|---|
| A Engine | workflow semantics + DES + metrics | E accepted semantics + B trace needs | over-generalization / wrong abstractions | active |
| B Playback | trace compression + pacing | A v1 result | reintroducing semantics into animation | checkpoint accepted; conditional PORT |
| C UI | product interaction | v0 mock types, later A/B/D | UI inventing business logic | ready |
| D Graphics | visual toolchain | representative fixtures | multiple competing graphics stacks | ready |
| E Research | literature/QAMP validation | Rao bounded follow-up | scope expansion / research overengineering | checkpoint accepted; PORT + follow-up |
| F Integration | contracts + promotion + product | all tracks | coordination bottleneck | active |

## Cross-track rules

- A and E resolve semantics; F arbitrates.
- B consumes A; B never corrects A by visual invention.
- C consumes A/B; C can request but not silently change contracts.
- D supplies standards/components; C/B decide product usage only after F promotion.
- E may invalidate an assumption but does not directly rewrite engine/UI implementation.

## Current cross-track issues

1. **E -> A/F:** add explicit fixed-reservation semantics or equivalent; active task usage must be separable from allocated capacity.
2. **E -> A/F:** define `maxInFlightQuantum` as admitted running + resource-queued work; policy-held ready work is distinct.
3. **E -> A/F:** external/provider delay must be explicit assumption or omitted; no provider-scheduler model in v1.
4. **A -> B:** define interval boundaries and actual repetitive trace shape.
5. **B -> C:** semantic-keyframe playback, no autoplay, reduced-motion support.
6. **E follow-up:** Rao cycle-average analytical model and `R_cc` must be validated before research track closes.
