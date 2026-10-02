# Decision Log

## D001 — Multi-agent split
**Date:** 2026-10-02  
**Decision:** Separate engine, playback, UI, graphics, research/validation, and coordination/integration into Agents A–F.  
**Reason:** Previous Explorer work stalled because semantics, animation, graphics and UI were debugged together.

## D002 — Agent F promotion authority
**Date:** 2026-10-02  
**Decision:** Only Agent F approves what is promoted/ported/reimplemented into staging/main.  
**Reason:** Agent branches will contain experiments and clutter that should not automatically enter the product.

## D003 — Main is shippable
**Date:** 2026-10-02  
**Decision:** `main` represents coherent product state, not collective work-in-progress.

## D004 — QAMP is a reference, not a constraint
**Date:** 2026-10-02  
**Decision:** Preserve conceptual continuity with QAMP, but do not preserve stale didactic representations if they impair functionality/correctness.

## D005 — Simulation source of truth
**Date:** 2026-10-02  
**Decision:** Engine trace/metrics are authoritative. UI/playback/graphics do not independently simulate execution.

## D006 — Presentation time separated from simulation time
**Date:** 2026-10-02  
**Decision:** Playback may aggregate/re-time visual presentation while preserving exact trace semantics.

## D007 — Graphics benchmark before graphics standard
**Date:** 2026-10-02  
**Decision:** Agent D compares structured SVG/grid, graph layout, Figma-assisted design, and other justified candidates before the project adopts a graphics stack.

## D008 — Historical prototype retained
**Date:** 2026-10-02  
**Decision:** Keep `prototype-vqe-runner` untouched as historical evidence; port selectively only after review.
