# Documentation guide

Start with the [system overview and local preview](overview.md) for developers and maintainers.
It traces a document from its upstream source to the published site and shows where to make changes.

This directory documents the documentation system, not the gitlode product. It is not included
in the product site's publication allowlist. Durable documentation, LLM-oriented working material,
and code comments are written in English.

## Durable documentation

Documents are organized by subject and purpose, not by a `durable` or `temporary` parent directory.
The following homes contain maintained knowledge for development and operation:

- [Architecture](design/architecture.md): component responsibilities, build execution, trust boundaries and failure behavior.
- [Publication operations](operations/publication.md): select documents and maintain edition-specific sidebars.
- [Translation operations](operations/translations.md): maintain Japanese translations and replace a destination edition's translations when preparing a release.
- [Edition operations](operations/editions.md): update edition labels, public paths and pinned inputs.
- [Deployment and recovery](operations/deployment.md): prepare a Pages candidate, publish an approved revision, verify HTTPS and recover a release.
- [Development](contributing/development.md): supported workflows, tooling, and maintenance procedures.

Durable documents describe the current system and explicitly distinguish unimplemented proposals.
They are the canonical home for lasting contracts, not session logs or task checklists.

Update the corresponding operating or development guide when changing a maintained procedure.

## Temporary documentation

The following homes contain tracked working material with a limited purpose:

- `handoff/`: [current continuation notes](handoff/current.md) for human/LLM and
  session-to-session transfer. Link to canonical docs instead of restating their contracts.
- `proposals/`: [development environment feedback](proposals/development-environment.md)
  and future suggestions from this project to gitlode itself.

The [production launch record](handoff/production-readiness.md#p5-deployment-verification-and-recovery) identifies the first verified deployment.

Temporary does not mean disposable before review. Keep active evidence and proposals in Git.
Each working document should identify status, owner or decision authority, next action, and its
closure/review condition.

## Proposal and document lifecycle

Common development experience and maintenance knowledge are the goal of tooling alignment.
Improvements can flow in either direction between gitlode itself and this documentation project.

1. Record a feedback proposal with the problem, evidence, alternatives, current local choice,
   upstream suggestion, trade-offs, and a deferred review point.
2. Continue authorized work using a documented local choice. **Do not wait
   for cross-project adoption or commonization approval.** Recording a proposal neither changes
   gitlode itself nor implies acceptance by either project.
3. Review proposals separately, at the owner's chosen time. Record the outcome for each project
   independently: accepted, rejected, deferred, or superseded. Do not reopen the approval question
   on every task.
4. When a proposal becomes an implemented contract, update the relevant durable documentation
   and link the outcome from the proposal.
5. When a plan or handoff is complete, migrate lasting knowledge and then remove or archive the
   obsolete working material with a clear status. Git history retains prior versions. Keep evidence
   needed by an unresolved decision; create an archive directory only when it is needed.

Changes to ownership or hosting require owner approval.
