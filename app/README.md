# Agent C UI scaffold

This directory is the accepted React + TypeScript + Vite product-UI direction for the Workflow Explorer.

## Boundary

The UI consumes WorkflowSpec and SimulationResult objects. It does not calculate authoritative simulation metrics.

Editing a workflow invalidates the attached result. Simulation requests cross `src/services/engineAdapter.ts`; the Agent-C branch currently uses an unavailable adapter and will not generate fallback metrics.

The existing `src/model.ts` remains a temporary v0 fixture source only. Production integration must replace the `src/contracts.ts` compatibility boundary with Agent-F-frozen shared v1 types and validation.

## Product surfaces

- Builder — DAG + task/policy inspector + explicit validation.
- Explore — authoritative metrics, task intervals, resource intervals, queue evidence and assumptions.
- Compare — two explicit config/result pairs with direct values and presentation-only deltas.

## Workflow DAG

Agent D's accepted split is implemented here for the workflow topology:
- React Flow for interaction/rendering;
- ELK layered for positions;
- explicit non-zero ELK seed;
- stable task/dependency IDs become node/edge IDs;
- layout runs on topology/label/size inputs, not selection or playback state.

Runtime resource/state graphics remain separate from the workflow DAG.

## Run

Node.js requirement for Vite 8: 20.19+ or 22.12+.

    npm install
    npm run typecheck
    npm run dev

Production check:

    npm run build

## Dependencies

Production:
- React / React DOM
- @xyflow/react
- elkjs

Development:
- TypeScript
- Vite
- official Vite React plugin

No routing or application-state framework is required for this pass.

## Integration seam

`src/contracts.ts` is the single temporary compatibility boundary for v0 fixture types. Components should not import `model.ts` directly.

After v1 freeze:
1. replace the compatibility exports with the shared v1 contract/validator;
2. bind `EngineAdapter.simulate` to the shared engine;
3. replace provisional policy controls with v1 fixed-reservation and per-QPU-pool admission controls;
4. add Agent B semantic-keyframe playback without changing DAG geometry.
