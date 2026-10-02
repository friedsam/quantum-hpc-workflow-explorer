# Coordinator Review Queue

Updated: 2026-10-02

## A — Engine
**Status:** checkpoint reviewed — PORT after bounded repair R1-R5.

Required repair:
1. explicit fixed classical reservation by pool;
2. per-QPU-pool in-flight admission limit;
3. same-timestamp causal closure before admission/start;
4. suppress communication events for zero-cost dependencies;
5. freeze half-open interval semantics and rename aggregate communication metric.

## B — Playback
**Status:** checkpoint accepted — conditional PORT; waiting for Agent A v1 compatibility check.

## C — UI
**Status:** completed checkpoint reported by user; review next.

## D — Graphics
**Status:** **checkpoint accepted — PORT visual grammar/tool split.**

Accepted production split:
- workflow DAG: React Flow + ELK layered if Agent C's scaffold remains React-based;
- runtime resource/state view: structured inline SVG with fixed logical grid/named anchors;
- static polish: Figma after runtime grammar stabilizes;
- D2: no production dependency;
- raster frame sequences: rejected.

Coordinator review written to `agent/graphics` at `38e1a15088f35bbaebde16a79b4180542384af7d`.

No more D work required until Agent F/C request a concrete production component/polish pass.

## E — Research/validation
**Status:** checkpoint accepted — PORT; one bounded Rao addendum requested.

## F — Coordinator
**Status:** active.

Immediate F tasks:
- review Agent C next;
- freeze v1 after Agent A R1-R5;
- reconcile UI scaffold with accepted D toolchain;
- run B compatibility after v1 freeze.
