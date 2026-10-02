# Coordinator Daily Synthesis

## 2026-10-02 — first integrated staging build

### Accepted architecture

- generic user-authored WorkflowSpec;
- deterministic frozen-v1 DES;
- QAMP A-D as first acceptance/preset suite;
- IBM/QAMP Fe4S4 SQD as real structural reference preset;
- semantic playback from exact engine traces;
- React Flow + ELK editable workflow DAG;
- structured SVG runtime resource view;
- Builder → Explore/Playback → Compare product flow.

### Agent status

- A: closed/idle; v1 engine accepted.
- B: closed/idle; frozen-v1 playback accepted.
- C: closed/idle; final product checkpoint accepted.
- D: closed/idle; graphics/tool split implemented.
- E: closed/idle; research evidence accepted.
- F: active integration/testing.

### First coherent staging build

Agent C's self-contained app was promoted substantially intact to `agent/integration` at:

`6fdb7954d1aeed4ddf82ea94ae81e9fe1830cd35`

Canonical production subsystem locations are now:
- engine: `app/src/engine/runtime.mjs`
- playback: `app/src/playback/trace-playback.mjs`
- shared domain contract: `app/src/domain/types.ts`
- Builder/UI: `app/src/components/`
- presets: `app/src/presets/presets.ts`

Agent A/B branches remain provenance/history rather than duplicate production modules.

### Verified C evidence

Final Agent-C head `3843b7c60c9a828dae60b8a4483e712616163af9` passed GitHub Actions run `37070602061`.

Branch checks included:
- engine tests;
- playback tests;
- architecture tests;
- TypeScript;
- Vite production build.

Current external package verification:
- `@xyflow/react 12.12.0` is current npm release;
- `elkjs 0.12.0` is current npm release;
- Vite 8 requires Node 20.19+ / 22.12+ and staging CI uses Node 22.

### Remaining gates before main

1. integration-branch CI;
2. browser E2E/visual smoke test;
3. A-D behavioral acceptance review;
4. custom workflow end-to-end authoring test;
5. deployment-root migration from legacy `web/`;
6. dependency lock/reproducibility decision;
7. bounded-repeat authoring decision for final 10-day scope.
