# Agent E — Research / Validation

Branch: `agent/research`

## Mission

Keep the simulator/modeling grounded in current literature and the actual QAMP/IBM workflow while preventing research scope from consuming the 10-day product.

## Initial assignment

Validate and summarize only what affects implementation:

- analytical timing model / communication regime quantities suitable as baseline;
- queue/resource-policy findings relevant to tests/presets;
- QAMP tutorial semantics that should remain;
- IBM C/C++/MPI/OpenMP/QRMI/SQD workflow structure suitable as the first serious preset;
- assumptions from legacy scenarios that should be removed or demoted to preset-specific assumptions;
- acceptance cases for Agent A.

Distinguish published equations/results from project-specific assumptions.

## Boundaries

Do not:
- design a new scheduler;
- add QEEGNet/CUDA-Q/live Slurm/current hardware execution to the 10-day scope;
- modify production engine/UI logic directly.

## Current status

Ready to start.

## Handoff fields

Record:
- sources;
- verified implementation-relevant facts;
- uncertain points;
- recommended preset(s);
- engine acceptance cases;
- exact commit/path;
- promotion recommendation.
