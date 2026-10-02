# Promotion Policy

Owner: Agent F

## Principle

The repository is promotion-based, not branch-merging-based.

Agent branches preserve useful experimentation and failed approaches. `main` preserves the coherent product.

## Promotion decisions

### PROMOTE
Contribution is architecturally compatible, validated, scoped correctly, and can enter staging substantially intact.

### PORT
Only selected files/commits/ideas should enter staging. The source branch remains experimental history.

### REIMPLEMENT
The agent established a useful result, but its implementation is unsuitable for product integration. Recreate the result behind the accepted interfaces.

### DEFER
Useful but outside the current 10-day product boundary.

### REJECT
Incorrect, redundant, destabilizing, unvalidated, or not useful enough to retain in the product.

## Agent handoff requirements

Every proposed contribution must state:
- proposed promotion decision;
- exact commit(s);
- production files proposed;
- investigation-only files;
- dependency additions;
- interface changes;
- validation evidence;
- discarded alternatives;
- unresolved issues.

## Staging

Only Agent F moves approved work into `agent/integration`.

Agent F may cherry-pick, copy, rewrite, or reimplement rather than merge.

Before `main`:
- cross-subsystem tests pass;
- terminology/state semantics agree;
- UI/playback values originate from engine output;
- unused dependencies and experiments are removed;
- user-facing product path remains coherent.

## Main

`main` is expected to be demoable/deployable.

Historical experiments do not need to be removed from their source agent branches.
