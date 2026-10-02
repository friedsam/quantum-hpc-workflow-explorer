# Coordinator Review Queue

Updated: 2026-10-02

## Round 2 — scenario semantics and behavioral acceptance

### A — Engine
**Status:** active.

Task:
- implement scaled A-D WorkflowSpec acceptance fixtures;
- assert conceptual invariants, not legacy screenshot counts;
- keep frozen v1 unchanged unless a concrete representational defect is proven.

### E — Research/validation
**Status:** active.

Task:
- extract a source-grounded A-D concept/acceptance matrix from the QAMP tutorial;
- distinguish defining bottleneck, non-bottlenecks, minimum structure, observable consequences and anti-invariants;
- map old Working/Idle/Blocked language only where technically valid.

### B — Playback
**Status:** hold.

Starts after A/E reconciliation. Then test the accepted A-D real traces for human-watchable playback only.

### C — UI
**Status:** hold.

Starts after A/E reconciliation. Then port the accepted A-D presets/labels into staging; no broad UI redesign in this round.

### D — Graphics
**Status:** hold.

Only reactivate if A-D playback/runtime-state visualization exposes a concrete graphics defect.

### F — Coordinator
**Status:** active.

Next:
1. review A and E independently;
2. reconcile them into one scenario acceptance contract;
3. decide whether any v1 engine gap is real;
4. then activate B and C for the second half of the round.

The integrated staging app remains at the current accepted state while A/E work proceeds.
