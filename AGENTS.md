# Repository Operating Contract — Quantum–HPC Workflow Explorer

This file is the mandatory entry point for coding/research agents working in this repository.

## Project objective

Rebuild the Workflow Explorer into a technically sound, presentable hybrid Quantum–HPC workflow planning/simulation application on a roughly 10-day completion horizon.

The Explorer is a byproduct/continuation of the QAMP Hello HPC tutorial, but the application is not required to preserve stale didactic representations when they impair technical correctness or usability.

The current product target is an explainable, pre-execution design-space simulator for hybrid workflows. It is **not** a production scheduler, orchestration runtime, benchmarking framework, or vendor-selection tool.

## Required preflight

Before substantive work:

1. Read `AGENTS.md` and `repo_policy.toml`.
2. Read:
   - `docs/coordination/PROJECT_STATE.md`
   - `docs/coordination/INTERFACE_CONTRACTS.md`
   - `docs/coordination/VALIDATION_CONTRACT.md`
   - `docs/coordination/REVIEW_QUEUE.md`
   - your role file under `docs/coordination/agents/`
3. Inspect the current branch, Git status, and relevant producer/consumer paths.
4. Work only on the assigned branch and scope.
5. Repository evidence and current coordination documents override assumptions from prior chat history.

Direct user instructions override coordinator recommendations.

## Roles and canonical branches

| Role | Branch | Responsibility |
|---|---|---|
| Agent A — Engine | `agent/engine` | Workflow model, discrete-event engine, metrics, tests |
| Agent B — Playback | `agent/playback` | Trace-to-keyframe transformation, human-watchable playback |
| Agent C — UI | `agent/ui` | Product UI/UX, workflow editor, inspector, comparison surfaces |
| Agent D — Graphics | `agent/graphics` | Graphics/toolchain benchmark, visual grammar, diagram system |
| Agent E — Research | `agent/research` | Literature/QAMP validation, presets, assumptions, acceptance cases |
| Agent F — Coordinator/Integrator | `agent/integration` | Cross-track architecture, reviews, promotion, integration, final coherence |

The human repository owner is the only permanent participant. Agents/chats are replaceable and must leave sufficient state in Git for a successor.

## Promotion model

Agent branches are laboratories, not candidate release branches.

Completing an agent task means producing a validated handoff. It does **not** imply that the branch should be merged.

Only Agent F may approve work for integration/main. Agent F chooses one of:

- **PROMOTE** — accept substantially intact.
- **PORT** — selectively copy/cherry-pick only approved files/commits.
- **REIMPLEMENT** — preserve the validated result but rewrite for coherent integration.
- **DEFER** — useful work, outside the current 10-day product.
- **REJECT** — do not enter the product.

Implementation agents must not merge or cherry-pick their own work into `agent/integration` or `main`.

`main` means **shippable product state**. Experimental history stays on agent branches.

See `docs/coordination/PROMOTION_POLICY.md`.

## Architecture invariants

These boundaries are mandatory unless Agent F explicitly revises the interface contract:

- The simulation engine is the authoritative source of execution semantics and metrics.
- UI code must not independently calculate simulation results.
- Playback/animation code may compress or interpolate presentation time, but must not alter simulation semantics.
- Graphics/layout code must not become a second simulation state machine.
- Research/validation work may define assumptions, fixtures, and acceptance cases, but must not silently insert production logic.
- Task state, resource-allocation state, queue state, and communication events must remain conceptually distinct.
- Transfer/communication is modeled as dependency/event cost, not as an ad hoc replacement for task/resource state.
- QPU capacity is configurable; `Run = 1` is a preset assumption, not a universal invariant.
- Bounded loops may be represented as repeated/unrolled subgraphs; arbitrary dynamic control flow is out of initial scope.

## Interface ownership

`docs/coordination/INTERFACE_CONTRACTS.md` is Agent-F-owned shared architecture.

Agents may propose changes, but must not silently fork the shared types/semantics. A requested interface change must include:
- the current limitation;
- proposed change;
- affected producers/consumers;
- migration impact;
- test/acceptance case.

Until Agent F accepts the change, other tracks continue against the current contract.

## Coordination heartbeat

At the start of a new substantive unit of work, after a meaningful commit/result, and before reporting completion:

1. fetch/inspect the current remote branch head;
2. read `PROJECT_STATE.md`, `REVIEW_QUEUE.md`, and `INTERFACE_CONTRACTS.md`;
3. read your role file;
4. consume any changed coordinator decision before continuing.

A coordinator update cannot interrupt a currently executing command, but it must be consumed at the next natural checkpoint.

## Clutter and experiment policy

Git is the backup mechanism.

Do not create:
- `*_old`, `*_new`, `*_final`, `*_final2`, `*_fixed`;
- `*.bak`, `*.backup`, `*.orig`;
- duplicate prototype directories merely to preserve earlier work.

Temporary or comparative work belongs under `scratch/<agent>/<task>/` and is gitignored.

A new production dependency or graphics framework must be justified in the agent handoff. Experiments do not become dependencies merely because they worked once.

Do not broadly rewrite the legacy app unless the role assignment requires it.

## Graphics rule

Matplotlib-style plotting is appropriate for quantitative plots, not architecture/state/UI diagrams.

Technical graphics should be built from structured, editable primitives (for example SVG/grid/anchors, graph-layout tooling, or approved Figma workflow). Agent D owns the benchmark and recommendation.

## Branch rules

- Use only the canonical branch assigned to your role.
- Do not create additional branches without direct user approval.
- Do not delete historical branches without direct user approval.
- `prototype-vqe-runner` is historical evidence and should not be treated as the new foundation unless Agent F explicitly ports a specific result.
- Do not assume an agent branch is mergeable wholesale.

## Validation

Before reporting an implementation checkpoint:
- run the relevant local tests/checks available for the current scaffold;
- verify deterministic behavior where required;
- inspect the diff for unrelated changes;
- update your role/status section with what is verified vs unresolved;
- provide exact paths/commits for proposed promotion.

Once the new TypeScript scaffold exists, the coordinator will define canonical lint/type/test commands here.

## Completion/handoff report

Every agent checkpoint must state:
- files intentionally proposed for promotion;
- files created only for investigation;
- dependencies added/changed;
- interface changes requested;
- tests/results supporting the work;
- known failures/discarded approaches;
- unresolved risks;
- recommended PROMOTE / PORT / REIMPLEMENT / DEFER / REJECT status (Agent F decides).
