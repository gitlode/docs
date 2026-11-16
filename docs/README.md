# Documentation guide

This directory documents the documentation system, not the gitlode product. It is not included
in the product site's publication allowlist. Project documentation is written in English.

## Durable documentation

Documents are organized by subject and purpose, not by a `durable` or `temporary` parent directory.
The following homes contain maintained knowledge that survives the PoC and production operation:

- [Architecture](design/architecture.md): ownership, current contracts, boundaries, and constraints.
- [Development](contributing/development.md): supported workflows, tooling, and maintenance procedures.
- Accepted architecture decisions belong in `decisions/` when they exist. Preserve their
  rationale and consequences; mark superseded decisions rather than silently replacing history.

Durable documents describe the current system and explicitly distinguish unimplemented proposals.
They are the canonical home for lasting contracts, not session logs or task checklists.

## Temporary documentation

The following homes contain tracked working material with a limited purpose:

- `poc/`: [plan](poc/plan.md), [original kickoff](poc/kickoff.md),
  [evaluation evidence](poc/evaluation.md), [SSG proposal](poc/ssg-proposal.md),
  [English previews](poc/english-previews.md), and [translation metadata draft](poc/translation-metadata.md).
- `handoff/`: [current continuation notes](handoff/current.md) for human/LLM and
  session-to-session transfer. Link to canonical docs instead of restating their contracts.
- `proposals/`: [development environment feedback](proposals/development-environment.md)
  and future suggestions from this project to gitlode itself.

Temporary does not mean disposable before review. Keep active evidence and proposals in Git.
Each working document should identify status, owner or decision authority, next action, and its
closure/review condition. Historical kickoff material is retained verbatim; later owner instructions
and the maintained plan govern subsequent changes.

## Proposal and document lifecycle

Common development experience and maintenance knowledge are the goal of tooling alignment.
Improvements can flow in either direction between gitlode itself and this documentation project.

1. Record a feedback proposal with the problem, evidence, alternatives, current local choice,
   upstream suggestion, trade-offs, and a deferred review point.
2. Continue PoC work using a documented local choice within existing authorization. **Do not wait
   for cross-project adoption or commonization approval.** Recording a proposal neither changes
   gitlode itself nor implies acceptance by either project.
3. Review proposals separately, at the owner's chosen time. Record the outcome for each project
   independently: accepted, rejected, deferred, or superseded. Do not reopen the approval question
   on every PoC task.
4. When a proposal becomes an implemented contract, update the relevant durable documentation
   and link the outcome from the proposal. Promote approved SSG rationale to a durable ADR.
5. When a plan or handoff is complete, migrate lasting knowledge and then remove or archive the
   obsolete working material with a clear status. Git history retains prior versions. Keep evidence
   needed by an unresolved decision; create an archive directory only when it is needed.

This nonblocking feedback process does not waive the existing human gates for SSG selection,
candidate removal, source ownership changes, hosting changes, PoC exit, or production launch.
