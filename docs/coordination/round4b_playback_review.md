# Round 4B coordinator review

Status: SMALL REPAIR REQUIRED before PORT.

Accepted:
- actor-aware Working / Blocked / Idle aggregation from Agent A's actor-state authority;
- blocked-reason counts may overlap and are not treated as exclusive buckets;
- actor state remains separate from exact resource allocation state;
- generic actor-less fallback remains intact;
- Scenario B produces the intended 5 aggregate semantic frames;
- Scenario D generic fallback preserves resource queue vs policy-held work;
- actor-state/reason signatures prevent compression across material actor-state transitions.

One required repair:
- `trace-playback.mjs` currently labels multi-signature compressed segments as `Repeated N-step cycle ×M`.
- Earlier coordinator decision explicitly forbids calling heuristic periodicity a loop/cycle unless authored workflow metadata proves that semantic.
- Change the generic label to neutral wording, e.g. `Repeated N-step activity ×M`.
- Update the relevant playback assertion(s) only.
- Do not change compression logic, dwell timing, actor view-model, engine semantics, or UI.

Integration constraint:
- Scenario B's internal admission hold is serialization scaffolding. The simple default UI must not present Scenario B as a throttling/service-capacity bottleneck. Advanced diagnostics may expose exact engine evidence.

After the wording/test repair, stop for Agent F review.
