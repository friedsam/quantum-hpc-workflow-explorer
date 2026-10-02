# Project State

Updated: 2026-10-02

## Objective

Complete a technically sound, presentable Hybrid Quantum–HPC Workflow Explorer on an approximately 10-day horizon.

The product should be useful as an explainable pre-execution planning/simulation tool while remaining connected to the QAMP Hello HPC tutorial. It does not need to preserve didactic representations that reduce correctness or usefulness.

## Current repository reality

### Main

The current `main` branch contains:
- a static HTML/CSS/JS app;
- four bespoke scenario animations;
- a placeholder Builder;
- a Runner with an independent additive timing/accounting model.

The scenarios, Builder and Runner do not currently share one execution model.

### Historical prototype

`prototype-vqe-runner` demonstrated a useful direction: Builder and Runner shared `workflow-prototype.js`.

It is **not** the new foundation because:
- the workflow is a linear layer list rather than a dependency graph;
- the simulator iterates by layer, producing incorrect VQE-style ordering;
- task/resource/queue semantics are still too coarse.

Preserve the branch as evidence; port selectively if useful.

## Product thesis

Build:

`workflow model → discrete-event execution → trace/metrics → interactive visualization/comparison`

Do not build:
- a production scheduler;
- a workflow runtime;
- a Slurm emulator;
- a vendor recommender;
- a learned scheduler;
- arbitrary dynamic workflow control.

## QAMP relationship

QAMP remains the conceptual and historical origin.

The rebuilt Explorer should:
- use QAMP/IBM workflow material as a real preset/reference case;
- preserve useful educational continuity;
- not force old A–D visual/state assumptions into the new core;
- allow legacy scenarios to survive only as presets/regression cases if they map cleanly onto the new model.

## Current architecture status

**PROVISIONAL.** Shared interface v0 is documented in `INTERFACE_CONTRACTS.md`.

Agent A proposes the first implementation-ready model.
Agent E validates semantics/assumptions.
Agents B/C may mock the v0 contract.
Agent F freezes/revises the integration contract.

## Current workstreams

| Agent | Branch | Initial assignment | Status |
|---|---|---|---|
| A Engine | `agent/engine` | workflow IR + DES + invariants | ready |
| B Playback | `agent/playback` | trace compression + deterministic human playback | ready |
| C UI | `agent/ui` | product architecture + UI shell against mock contract | ready |
| D Graphics | `agent/graphics` | graphics benchmark + grid/anchor standard | ready |
| E Research | `agent/research` | literature/QAMP validation + acceptance presets | ready |
| F Coordinator | `agent/integration` | architecture/promotion/integration | active |

## First integration checkpoint

Before substantial cross-branch integration, Agent F needs:
- A: proposed interface/model v1 + minimal deterministic engine result;
- B: playback/keyframe design demonstrated on a mock repetitive trace;
- C: UI information architecture/component plan using mock data;
- D: graphics benchmark recommendation;
- E: validation matrix + QAMP/IBM preset definition.

No track needs to wait idly for another track, but no track may invent conflicting semantics.
