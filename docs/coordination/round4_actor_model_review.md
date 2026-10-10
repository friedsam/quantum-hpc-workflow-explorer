# Round 4A coordinator review

Status: REPAIR REQUIRED before PORT.

Accepted:
- task multiplicity is distinct from actor count and per-instance resourceCount;
- persistent actor-group identity/count is the right layer above frozen DES;
- pairwise and all-to-all instance mapping is sufficient for the current bounded scope;
- manifest actor assignments and compact logical DAG compilation are useful;
- frozen DES remains unchanged.

Blocking defect: the Scenario-B actor projection does not reproduce the documented global synchronization wall.

Current fixture derives at t=5:
- working 0
- blocked 1
- idle 3

But Scenario B requires a phase in which all actors/ranks, including those that never submitted quantum work, are blocked on the complete quantum result set before collective work resumes.

The current stateDuringTask model cannot express this cleanly because:
- a submitter is blocked waiting on a result produced by a QPU task; it is not itself executing/participating in that QPU task;
- the full actor group must be able to enter a dependency wait before the downstream collective task is runnable;
- overlapping blocked reasons should coalesce as blocked, not be treated as contradictory actor claims.

Required repair:
1. Preserve current multiplicity/actor identity work.
2. Add a minimal actor-wait/gate semantic outside DES, separate from task participation.
3. Support a wait claim with actor selection, activation event/condition, release event/condition, and reason such as quantum-result or global-synchronization.
4. Actor-state derivation must allow multiple simultaneous blocked claims for one actor and expose one top-level blocked state plus reason(s). Working+blocked overlap should remain an error unless explicitly modeled.
5. Rework Scenario B so it has an interval with all four test actors blocked before the collective begins.
6. Do not make QPU resource queueing the defining Scenario-B mechanism; the tutorial deliberately abstracts quantum execution as a serialized phase and suppresses queue buildup to isolate synchronization.
7. Add tests for the scaled frame sequence: subset working/others idle -> submitters blocked -> full group blocked -> full group working.
8. Frozen DES remains unchanged.

Stop for Agent F review after this repair.
