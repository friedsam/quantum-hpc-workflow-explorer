# Cross-Track Matrix

Updated: 2026-10-02

| Track | Owns | Current dependency | Primary integration risk | Current status |
|---|---|---|---|---|
| A Engine | workflow semantics + DES + metrics | coordinator R1-R5 | semantic debt before freeze | repair pass requested |
| B Playback | trace compression + pacing | frozen A v1 | reintroducing semantics into animation | checkpoint accepted; conditional PORT |
| C UI | product interaction | A v1 + D visual grammar | UI inventing business logic | checkpoint complete; review pending |
| D Graphics | visual toolchain | C production scaffold | multiple graphics stacks | checkpoint accepted; PORT |
| E Research | literature/QAMP validation | Rao bounded follow-up | scope expansion | checkpoint accepted; PORT + follow-up |
| F Integration | contracts + promotion + product | all tracks | coordination bottleneck | active |

## Accepted D tool split

- Dynamic workflow topology: React Flow + ELK if C uses React.
- Runtime state/resource visualization: structured inline SVG/grid/anchors.
- Static polished material: Figma after app visuals stabilize.
- D2 and raster-frame redraw workflows: excluded from production stack.

## Current cross-track issues

1. A must complete R1-R5 before v1 freeze.
2. B waits for repaired v1 trace.
3. C must be reviewed against accepted A/B/D boundaries.
4. E completes Rao analytical baseline validation.
