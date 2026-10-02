# Cross-Track Matrix

Updated: 2026-10-02

| Track | Owns | Initial dependency | Primary integration risk | Current status |
|---|---|---|---|---|
| A Engine | workflow semantics + DES + metrics | E validation input | over-generalization / wrong abstractions | ready |
| B Playback | trace compression + pacing | v0 mock trace, later A result | reintroducing semantics into animation | ready |
| C UI | product interaction | v0 mock types, later A/B | UI inventing business logic | ready |
| D Graphics | visual toolchain | representative fixtures | multiple competing graphics stacks | ready |
| E Research | literature/QAMP validation | public sources/tutorial | scope expansion / research overengineering | ready |
| F Integration | contracts + promotion + product | all tracks | coordination bottleneck | active |

## Cross-track rules

- A and E resolve semantics; F arbitrates.
- B consumes A; B never corrects A by visual invention.
- C consumes A/B; C can request but not silently change contracts.
- D supplies standards/components; C/B decide product usage only after F promotion.
- E may invalidate an assumption but does not directly rewrite engine/UI implementation.
