# Cross-Track Matrix

Updated: 2026-10-02

| Track | Owns | Current dependency | Primary integration risk | Current status |
|---|---|---|---|---|
| A Engine | workflow semantics + DES + metrics | coordinator R1-R5 | semantic debt before freeze | repair pass requested |
| B Playback | trace compression + pacing | frozen A v1 | trace compatibility | checkpoint accepted; conditional PORT |
| C UI | product interaction | frozen A v1 + D visual grammar | stale duplicated contract / monolith | checkpoint accepted; PORT |
| D Graphics | visual toolchain | C production scaffold | multiple graphics stacks | checkpoint accepted; PORT |
| E Research | literature/QAMP validation | none | none | CLOSED/IDLE; PORT accepted |
| F Integration | contracts + promotion + product | all tracks | coordination bottleneck | active |

## Accepted product direction

- Core semantics: Agent A repaired/frozen v1.
- Analytical diagnostic: Rao model from Agent E, separate from DES.
- Playback: Agent B semantic keyframes, compatible with v1 trace.
- Product shell: Agent C React/TypeScript/Vite.
- Workflow DAG: React Flow + ELK.
- Runtime resource/state view: structured inline SVG/grid/anchors.
- Static polished figures: Figma after runtime visuals stabilize.

## Current cross-track issues

1. A must complete R1-R5 before v1 freeze.
2. B then performs one real-trace compatibility pass.
3. C then replaces v0 local types/map with frozen shared contract + React Flow/ELK and splits integration components.
4. E has no remaining scheduled work.
