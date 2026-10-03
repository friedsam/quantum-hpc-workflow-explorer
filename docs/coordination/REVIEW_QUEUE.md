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


## Round 2C review result — 2026-10-03

### A — Engine/model architecture
Status: ONE SMALL REPAIR PASS.

Accepted:
- WorkflowDesign / RunConfiguration / SystemProfile / RunRecord layering;
- pure compile -> frozen WorkflowSpec;
- repeat expansion above DES;
- actor groups as optional future hook;
- provenance separation;
- no optimizer/DES expansion now.

Required before freeze:
1. schemaVersion on persisted WorkflowDesign / RunConfiguration / SystemProfile;
2. explicit CompilationManifest mapping authored IDs/profile keys to expanded compiled task/dependency/resource IDs.

No DES changes requested.

### C — UI
Status: HOLD until the above two persistence/provenance fixes are reviewed.

Then C resumes integration.


## Round 3 — integrated product pass

### A — Engine/model
Status: CLOSED/IDLE.
Round 2C accepted. Frozen DES unchanged. Versioned design/config/profile layer + compilation manifest accepted.

### B — Playback/causal explanation
Status: CLOSED/IDLE.
Accepted derivation contract available in integration.

### D — Graphics
Status: CLOSED/IDLE.
Accepted full-system visual language available in integration.

### C — UI/product integration
Status: ACTIVE.

Integrate:
- design/config/profile/compiler + manifest;
- corrected A-D presets/acceptance tests;
- causal explanation adapter;
- full-system debugger board;
- shared simulation-time cursor with DAG/playback/analytical strips.

Do not broaden into optimizer or UI redesign.

### F — Coordinator
Next gate after C:
- review/port C;
- integration CI;
- browser E2E/visual smoke;
- deployment root cleanup;
- main promotion/closure.


## Round 3 final review — 2026-10-03

### C — UI/product integration
Status: **CLOSED/IDLE — PROMOTE accepted.**

Staging:
- app tree promoted at `e4a617be212055c0364d57124db300961810b2e0`;
- integration CI run `37093643908`: SUCCESS.

Accepted:
- design/config/profile compiler + manifest;
- accepted A-D presets;
- causal system-state explanation;
- full-system debugger;
- shared time cursor / DAG highlighting / analytical strips / playback;
- custom workflow authoring and Compare preserved.

### F — next gates

1. browser E2E/visual smoke on `agent/integration`;
2. inspect A-D visually/behaviorally in browser;
3. test custom workflow author -> simulate -> inspect/playback -> modify -> compare;
4. add reproducible dependency lock / `npm ci`;
5. decide deployment-root migration from legacy `web/` to new `app/`;
6. final documentation/cleanup;
7. promote to `main` only after these gates.
