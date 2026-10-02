# Agent A — Engine

Branch: `agent/engine`

## Mission

Own the technically authoritative workflow model, discrete-event execution semantics, metrics, and engine tests.

## Initial assignment

Produce:
1. an implementation-ready proposal for shared interface v1;
2. minimal event-queue/state-transition architecture;
3. one deterministic workflow run;
4. tests/invariants from `VALIDATION_CONTRACT.md`.

Start from the smallest primitives required by the 10-day product. Do not build a generalized workflow runtime.

## Boundaries

Do not:
- implement product UI;
- implement animation/presentation timing;
- encode legacy A–D visual states as engine semantics;
- assume QPU capacity is always 1;
- add arbitrary branching/dynamic loops unless a current acceptance case requires them.

## Current status

Ready to start from coordination baseline.

## Handoff fields

Before checkpoint, update this file with:
- verified implementation/result;
- unresolved semantics;
- proposed interface changes;
- exact commit/path;
- tests;
- files proposed for promotion vs investigation-only;
- recommended promotion status.
