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

The core product is a **generic user-authored workflow explorer**, not a scenario viewer.

Primary workflow:

`create/edit workflow → validate → simulate → animate/inspect trace → compare design alternatives`

The application must let a user construct or substantially modify a hybrid workflow using the supported primitives (tasks, dependencies, CPU/GPU/QPU resource pools, communication costs, bounded repeat/template expansion, and supported policies), then execute that design through the authoritative simulator.

Scenarios A–D are the first acceptance/preset suite and teaching examples. They are not the product boundary.

The IBM/QAMP Fe4S4 SQD workflow is a serious real-workflow preset/reference case after A–D; it is not the generic architecture.

Build:

`user WorkflowSpec → discrete-event execution → trace/metrics → animation/inspection/comparison`

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
- use QAMP Scenarios A–D as the **first engine acceptance/preset cases** because they are the original Explorer's intended conceptual test suite;
- regenerate those scenarios from the authoritative engine rather than preserve their old hand-coded counters/state machines;
- use the IBM/QAMP Fe4S4 SQD workflow afterward as the first serious real-workflow reference preset;
- preserve useful educational continuity without forcing stale visual/state assumptions into the new core.

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


## Visual debugger product thesis

The Explorer should differentiate through **human-readable visual execution**, not by attempting to out-schedule or out-optimize mature orchestration systems.

North-star interaction:
- user authors or loads a workflow DAG;
- user runs a transparent deterministic simulation;
- the Explorer can slow/step through semantic execution states;
- DAG, whole-system HPC/QPU state, and analytical time-series views remain synchronized;
- users can inspect *why* resources are working, blocked/waiting, policy-held, idle, queued, or released;
- aggregate plots explain the full run while slow playback explains a selected moment.

A useful retrospective analogy is LabVIEW's graphical block diagram + front-panel indicators + execution highlighting/probes. This was not a source design copied for the Explorer; the similarity was recognized only after the Explorer concept already existed. The Explorer DAG remains a declarative simulation model, not executable HPC/QPU program code.

Optimization may be added later as parameter-sweep/Pareto assistance, but explainability and direct manipulation remain the primary product differentiation.
