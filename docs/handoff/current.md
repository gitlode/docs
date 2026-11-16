# Current PoC handoff

Status: active continuation note, updated 2026-11-16.
Maintainer: the next human or LLM working on the PoC. Decision authority: human project owner.
Replace or retire this note when the next increment is handed off; migrate lasting facts to durable docs.

## Starting point

- Repository: `gitlode/docs`; work branch: `work/initial-poc`.
- `0ef1673`: initial pinned acquisition/staging foundation.
- `f983e3c`: development tooling alignment with gitlode itself.
- Documentation is organized by purpose: `design/`, `contributing/`, `poc/`, `handoff/`, and
  `proposals/`. Durable and temporary describe document lifecycles, not parent directories.
- Working increments should be committed; the owner plans a squash merge to `main`.

Use [development](../contributing/development.md) for commands and
[architecture](../design/architecture.md) for current contracts. The
[PoC plan](../poc/plan.md) owns milestones; [evaluation](../poc/evaluation.md) owns test evidence.
Both SSG previews remain unimplemented. Next action: begin comparable previews from the existing
staging pipeline, including safe Markdown handling and link normalization.

## Pending review

[Environment alignment feedback](../proposals/development-environment.md) is recorded for later
cross-project review. Keep the current local configuration and continue the PoC without waiting
for that review. SSG selection and production launch still require their separate human gates.

No upstream modifications or remote publication are implied by this handoff.
