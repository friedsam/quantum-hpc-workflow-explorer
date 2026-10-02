# Multi-Agent Coordination

Durable control plane for the 10-day Workflow Explorer rebuild.

## Core rule

Agent branches are laboratories. Agent F curates the product.

`main` contains a coherent, shippable application rather than the union of everything agents tried.

## Roles

- **A — Engine:** workflow/data model, resource semantics, event simulation, metrics, tests.
- **B — Playback:** transforms exact simulation traces into human-watchable visual playback.
- **C — UI:** product interaction, workflow editing, parameter inspection, comparison mode, responsive presentation.
- **D — Graphics:** selects and standardizes robust graphics/layout tooling and visual grammar.
- **E — Research/validation:** validates modeling choices, QAMP connection, literature-backed equations, presets and acceptance cases.
- **F — Coordinator/integrator:** owns shared architecture, cross-agent review, promotion decisions, staging integration and final product coherence.

## Durable state

Read in this order:

1. `AGENTS.md`
2. `repo_policy.toml`
3. `PROJECT_STATE.md`
4. `INTERFACE_CONTRACTS.md`
5. `VALIDATION_CONTRACT.md`
6. `REVIEW_QUEUE.md`
7. role file under `agents/`

Replacement chats should reconstruct from Git, not from predecessor transcripts.

## Promotion flow

```text
agent branch (experiment + evidence)
          ↓
Agent F review
          ↓
PROMOTE | PORT | REIMPLEMENT | DEFER | REJECT
          ↓
agent/integration
          ↓
end-to-end validation
          ↓
main
```

See `PROMOTION_POLICY.md`.

## Historical implementation

`prototype-vqe-runner` remains a historical branch. It contains useful evidence about shared Builder/Runner state, but its linear-layer simulator is not the accepted new architecture.
