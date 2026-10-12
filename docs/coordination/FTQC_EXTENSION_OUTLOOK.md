# FTQC extension outlook — post-prototype, not implemented

**Owner:** Agent F (conceptual roadmap)  
**Status:** DEFER implementation. Retain a concise forward-looking paragraph in the final README / IBM project description.  
**Date:** 2026-10-12

## Motivation

**[verified, sources below]** Fault-tolerant quantum computing (FTQC) adds quantum error-correction (QEC) decoding, fault-tolerant logical operations, resource overhead and real-time feedback to the hybrid architecture. IBM's 2026 QCSC reference architecture separates the quantum system's real-time control, co-located CPU/GPU scale-up, and cloud/on-prem scale-out HPC. NVIDIA's NVQLink illustrates tight coupling between QPU control and accelerated decoding. Microsoft's QRE models FTQC error budgets, qubit overhead, runtimes and magic-state factories.

**[opinion]** A serious future Explorer should analyze *coupled application-level HPC orchestration and internal FTQC execution*, not merely treat an FTQC QPU as a slow cloud job server.

## Deployment/topology matters

| | Remote/cloud-accessed logical QPU | Co-located or tightly integrated HPC–QPU |
|---|---|---|
| Execution boundary | Exposed provider job/service/API; internal QEC normally opaque to application users | Potentially more direct coupling with nearby classical accelerators, if platform interfaces expose it |
| Time-critical QEC | Must still execute through quantum-system/local real-time control, not internet round trips | Local QPU control and low-latency decoder/feedback still required |
| Parameters available to Explorer | Provider-exposed logical job options, latency, service time, reliability and price estimates; no assumption of code/factory configurability | Potentially code, decoder resources, feedback deadlines, factory allocation and scheduling, subject to provider/hardware access |
| End-to-end optimization | Submission, data movement, dependency placement, batching, external-resource limits | Additionally, contention/placement of CPU/GPU decoders versus scientific HPC work and real-time communication limits |

**[likely]** Integration can change both bottlenecks and optimization freedom, but physical proximity alone does not grant unrestricted QEC or control access. A cloud QPU can itself contain tightly integrated local HPC accelerators; **cloud versus integrated is not synonymous with QEC versus no QEC**.

## Hierarchical model direction

Use three explicit timescales/boundaries:

1. **Application workflow:** logical classical tasks, dependencies, transfers, scheduling/admission, HPC/QPU allocation, inspectable causal state (current Explorer scope).
2. **Quantum/logical execution:** logical circuit/depth, logical qubit demand, T/magic-state consumption, factory throughput, routing and allocated physical/logical resources (future estimator interface).
3. **Real-time quantum-system layer:** syndrome extraction, decoder throughput/latency, feed-forward/control deadlines, calibration overhead and interconnect performance (future specialist model; not ordinary high-level DES steps).

**[opinion]** Model a logical QPU task as a *hierarchical operation* with a separate, provenance-bearing FTQC estimator/profile. Conceptual future inputs might include logical gate/depth demand, error budget, physical gate/error assumptions, chosen QEC code/distance, magic-state factory capacity, decoder CPU/GPU throughput, feedback deadlines, and deployment topology. Outputs may include estimated duration, physical resource demand, deadline feasibility and logical failure bound. Do **not** claim these are already available or infer them from today's single `serviceTime` value.

The next-stage optimizer could search *application placement + FTQC configuration jointly* under explicit reliability and real-time constraints, e.g. application makespan/cost versus code distance, factory budget, decoder accelerators and shared HPC capacity. These estimates require calibrated hardware or declared hypothetical assumptions. Whenever a real-time deadline is infeasible, optimization must report infeasibility rather than silently stretching execution time.

Avoid replicating an established FTQC resource estimator: consider **import/adaptation of external resource estimates** (such as Microsoft's QRE) into a future `SystemProfile`/quantum-execution profile, and focus Explorer on cross-layer *visual causal debugging and tradeoff comparison*.

## Strict release boundary

**Current prototype:** source-faithful A–D grouped workflows, immutable deterministic DES, Builder → Simulate → Explore → Compare, real browser acceptance, synthetic assumption labeling, dependency/deployment cleanup. No FTQC scheduling, internal QEC model, decoder, magic-state factories, hardware calibration, or automatic optimizer is implemented.

**Future work only:** design the optional FTQC model contracts after the prototype; source/validate an estimator, define remote versus co-located machine profiles, and develop test workloads demonstrating a cross-layer tradeoff. Any expansion requires its own interface review and independent validation.

## Suggested final project-description paragraph

> The prototype focuses on explainable, pre-execution orchestration of hybrid HPC–quantum workflows. A future extension could model fault-tolerant quantum computing through hierarchical logical-QPU execution profiles, including error-correction and decoding constraints, magic-state resources, and architecture-dependent communication. This would enable exploration of tradeoffs between remote cloud access and tightly coupled HPC–QPU systems, potentially extending from application scheduling to cross-layer resource tuning. These FTQC capabilities are proposed directions, not features of the current prototype.

## Sources (primary, consulted 2026-10-12)

- IBM Research (2026), *Unveiling the first reference architecture for quantum-centric supercomputing*: https://research.ibm.com/blog/quantum-centric-supercomputing-system-reference-architecture
- NVIDIA Technical Blog (2025), *NVIDIA NVQLink Architecture Integrates Accelerated Computing with Quantum Processors*: https://developer.nvidia.com/blog/nvidia-nvqlink-architecture-integrates-accelerated-computing-with-quantum-processors
- Microsoft Learn, *Introduction to the resource estimator*: https://learn.microsoft.com/en-us/azure/quantum/overview-resources-estimator

