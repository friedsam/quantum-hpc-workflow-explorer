# Cross-Track Matrix

Updated: 2026-10-02

| Track | Owns | Initial dependency | Primary integration risk | Current status |
|---|---|---|---|---|
| A Engine | workflow semantics + DES + metrics | E validation input | over-generalization / wrong abstractions | active |
| B Playback | trace compression + pacing | A v1 result | reintroducing semantics into animation | checkpoint accepted; conditional PORT |
| C UI | product interaction | v0 mock types, later A/B | UI inventing business logic | ready |
| D Graphics | visual toolchain | representative fixtures | multiple competing graphics stacks | ready |
| E Research | literature/QAMP validation | public sources/tutorial | scope expansion / research overengineering | active |
| F Integration | contracts + promotion + product | all tracks | coordination bottleneck | active |

## Cross-track rules

- A and E resolve semantics; F arbitrates.
- B consumes A; B never corrects A by visual invention.
- C consumes A/B; C can request but not silently change contracts.
- D supplies standards/components; C/B decide product usage only after F promotion.
- E may invalidate an assumption but does not directly rewrite engine/UI implementation.

## Current cross-track issues

1. **A -> B:** v1 must define interval boundary semantics and actual repetitive event shape.
2. **B -> C:** playback defaults to semantic keyframes, no autoplay; UI should expose pause/step/speed and reduced-motion behavior.
3. **B integration decision:** keep branch as evidence; port playback module/tests after v1 contract check rather than merging branch wholesale.
