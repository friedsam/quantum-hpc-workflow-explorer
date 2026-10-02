# Continuation Protocol

Agents/chats are replaceable. Git is the durable memory.

## Successor startup

A replacement agent should not reload the predecessor's full chat transcript.

Read:

1. `AGENTS.md`
2. `repo_policy.toml`
3. `docs/coordination/PROJECT_STATE.md`
4. `docs/coordination/INTERFACE_CONTRACTS.md`
5. `docs/coordination/VALIDATION_CONTRACT.md`
6. `docs/coordination/REVIEW_QUEUE.md`
7. its role file under `docs/coordination/agents/`
8. recent commits on its canonical branch

Then inspect the actual producer/consumer code.

## Checkpoint discipline

After a meaningful result or architectural discovery, update the role file with:
- current status;
- verified result;
- unresolved issue;
- next decisive step;
- commit/path references.

Do not leave essential state only in chat.

## Coordinator replacement

A replacement Agent F must additionally read:
- `CROSS_TRACK_MATRIX.md`
- `DAILY_SYNTHESIS.md`
- `DECISION_LOG.md`
- promotion history in Git.

The replacement coordinator should reconstruct, not restart, the project.
