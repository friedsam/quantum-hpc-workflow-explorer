# Round 4D coordinator review

Status: SMALL REPAIR REQUIRED before PORT.

Accepted:
- explicit ordinal-set actor selection is a reasonable minimal additive selector for the scaled Scenario-A fixture;
- frozen DES remains unchanged;
- the one-request timing result is correct: longer QPU service extends only the local submitter wait and cannot create a global wall without authored global dependency semantics;
- the fixed multi-request regime test correctly demonstrates parameter-only transition from queue-free local requests to QPU resource backlog;
- modeled task service time is correctly defined as task-instance wall time, not CPU speed;
- the A-vs-B topology distinction is correct.

Required repairs against the current QAMP Scenario-A tutorial:

1. Source basis
   - The current Scenario-A page contains explicit prose defining the scenario. Do not state that the page lacks enough prose and therefore coordinator instructions are the authoritative source.
   - Ground the fixture against the current tutorial contract:
     * individual ranks trigger quantum jobs;
     * results are consumed locally;
     * no global quantum-state dependency;
     * many ranks execute classical work concurrently;
     * submitting rank does not stall others;
     * QPU single-lane;
     * at most one quantum job active or queued in the baseline;
     * no admission control/throttling required;
     * after result return, the submitting rank resumes classical work.

2. Remove unnecessary baseline admission policy
   - The single-request Scenario-A baseline currently sets `maxInFlightQuantumByPool.qpu = 1`.
   - The tutorial explicitly says no admission control/throttling is required.
   - Remove this limit from the baseline Scenario-A RunConfiguration. QPU capacity=1 is sufficient.
   - The multi-request regime fixture may retain a non-binding high-enough in-flight bound if needed to ensure overload manifests as resource queue rather than policy hold, but document that as a test-control choice, not Scenario-A baseline semantics.

3. Make post-result resumption explicit
   - Current baseline has `local-consume` only from t=3 to 3.5; rank 1 then becomes Idle while ranks 2-4 continue until t=8.
   - The tutorial's restored-equilibrium frame says the submitting rank resumes classical work immediately and all HPC ranks are Working again.
   - Adjust the scaled fixture so after the result returns, rank 1 visibly resumes useful classical continuation for a meaningful interval while the independent classical phase remains active.
   - Keep the quantum branch off the overall critical path in the baseline.
   - Add an assertion for a post-result time where all four actors are Working and the QPU is idle.
   - Do not add a global join/barrier.

4. Documentation wording
   - Distinguish tutorial terminology from the actor projection. The tutorial explicitly calls the submitting rank Idle during transfer; the Explorer may classify the subsequent result wait as Blocked because that is authored wait semantics, but do not claim the tutorial itself labels every post-submit interval Blocked.

Non-blocking limitation:
- ordinal subsets are fixed against the actor-group count. If the user later changes a 4-rank preset to 1000 ranks, `[2,3,4]` is not automatically "all non-submitters." Do not add complement/range semantics in this repair; record this as a post-prototype/generalized actor-authoring limitation.

After these repairs, rerun the Round-4D + Round-4A + compiler suites and stop for Agent F review.
