# Agent C UI scaffold

This directory is an isolated React + TypeScript + Vite product-UI prototype for the Workflow Explorer.

## Boundary

The UI consumes WorkflowSpec and SimulationResult objects. It does not calculate authoritative simulation metrics. The two included results are deterministic synthetic fixture pairs for integration testing and are explicitly labeled as such.

Editing a workflow invalidates its fixture result. The prototype intentionally refuses to synthesize a replacement result until the engine adapter is connected.

## Run

Requires Node.js 20.19+ or 22.12+ for the current Vite 8 line.

    npm install
    npm run typecheck
    npm run dev

Production check:

    npm run build

## Current dependencies

Production:
- React
- React DOM

Development:
- TypeScript
- Vite
- official Vite React plugin

No graph/layout framework is selected here. Agent D owns that benchmark.

## Integration seam

Replace the fixture-loading boundary with an engine adapter that accepts a WorkflowSpec and returns a SimulationResult. Builder, Explorer, timeline and comparison surfaces should not need simulation logic.
