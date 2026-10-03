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
**Status:** **Round 2 complete — PORT accepted; CLOSED/IDLE.**

Accepted source-grounded contract:
- A = local overlap / QPU off critical path;
- B = global complete-result dependency / synchronization wall;
- C = communication-dominated local paths with low QPU saturation;
- D = service-capacity mismatch + bounded admission / independent local progress.

No frozen-v1 compatibility defect found.

### B — Playback
**Status:** **Round 2B complete — DERIVE accepted; CLOSED/IDLE.**

Accepted:
- exact resource state remains active / allocated-idle / released;
- causal wait state is a separate deterministic explanation layer;
- generic blocked-rank counts are not derivable without persistent rank/task affinity;
- communication, QPU gating, structural joins and policy-held QPU work can be derived at task/dependency level;
- optional metadata may support stronger labels such as local-result or collective synchronization.

No engine change required.

### C — UI
**Status:** hold.

Starts after A/E reconciliation. Then port the accepted A-D presets/labels into staging; no broad UI redesign in this round.

### D — Graphics
**Status:** **active.**

Agent B's accepted two-layer state model has been written onto the graphics branch. D should finish the full-system visual language using:
- exact resource layer;
- separate causal wait/explanation overlays;
- Scenario B and D static prototypes;
- linked debugger/time-series concept.

### F — Coordinator
**Status:** active.

Next:
1. review A and E independently;
2. reconcile them into one scenario acceptance contract;
3. decide whether any v1 engine gap is real;
4. then activate B and C for the second half of the round.

The integrated staging app remains at the current accepted state while A/E work proceeds.


## Round 2C — model extension guardrail

### A — Engine/model architecture
Status: ACTIVE.

Define the minimal WorkflowDesign + RunConfiguration + SystemProfile layer that compiles to frozen WorkflowSpec. Preserve optional actor/rank affinity, repeat structure, parameter provenance, and future performance-model hooks. Do not implement optimization or change DES semantics.

### C — UI
Status: HOLD until A Round 2C is reviewed.

Then integrate:
- accepted A-D presets;
- B causal explanation layer;
- D full-system debugger visual language;
- the minimal design/config separation accepted from A.

### B/D/E
Status: CLOSED/IDLE unless integration reveals a concrete defect.
