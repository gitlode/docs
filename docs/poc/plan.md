# Implementation plan

Status: Comparative evidence and recommendation prepared; human SSG selection pending.
Owner: human project owner. Implementation: Codex working in `gitlode/docs` on `work/poc-evaluation` after PR #1.
The kickoff increment was committed as `0ef1673`. Commit subsequent work at practical increments;
the owner plans to squash merge into `main`. The owner approved and squash merged PR #1 as b9c53d5; hosted CI passed. The previous work/initial-poc branch is retained. No deployment has been performed.

## Confirmed inputs

The owner approved stable `gitlode@0.12.0` and next `integration/v0.13.0` during kickoff.
The existing checkout already points to the public `gitlode/docs` repository, so no new repository
or rename is needed for this increment. GitHub Pages remains the required production host.
Durable and LLM-oriented documents are English; owner-facing PoC result summaries are Japanese.
The original [kickoff contract](kickoff.md) is retained verbatim;
later owner instructions refine it, including the [documentation lifecycle](../README.md).

Cross-project tooling feedback is tracked under `../proposals/` for separate review. Continue the
PoC using documented local choices without waiting for commonization approval. See
[environment feedback](../proposals/development-environment.md).

## Sequential milestones

| Milestone                | Deliverable and verification                                                                                          | Status                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 1. Inspect and bootstrap | Verify repository and real source tree; runtime, lockfile, project docs, validation CI                                | Implemented; hosted CI passed             |
| 2. Acquire and stage     | Pin both refs; select six real documents; preserve bytes and provenance; reject unsafe paths/symlinks                 | Implemented and locally tested            |
| 3. Comparable previews   | Add VitePress and Starlight under `candidates/`; same staged input; titles, README routing, sidebar, TOC, code fences | Implemented; see English preview evidence |
| 4. Localization          | Owned Japanese example, missing-page behavior, native/custom fallback comparison, file-level freshness tests          | Owner accepted; comparison complete       |
| 5. Pages simulation      | Both editions/locales under nested `/docs/` paths; complete artifact; links/assets validation; PR build               | Implemented; owner accepted version UX    |
| 6. Evidence and proposal | Timings, sizes, warnings, screenshots/manual review, reproducible comparison, proposed recommendation                 | Proposal ready for owner review           |
| 7. Human selection gate  | Owner reviews both previews and approves an SSG; only then remove a candidate                                         | Human decision pending                    |

Milestones are reviewable working increments, not separate disposable repositories.
Do not create empty candidate directories or claim previews before the rendering code exists.

## Next implementation tasks

1. Native search comparison is owner-reviewed: both sufficient, VitePress more feature-rich, but
   not decisive for selection. Retain query limitations; do not add search customization.
2. Clean-clone reproducibility and hosted CI passed; see reproducibility.md. Pages deployment remains separate.
3. Maintenance costs, dependency findings, warnings, and limitations are consolidated in maintenance.md.
4. Owner reviews the Japanese recommendation in ssg-proposal.md: a modest preference for Starlight, not a completed selection.
5. Keep explicit asset selection, production publication scope, and translation snapshot policy
   visible as follow-up; do not expand publication merely to hide link errors.

## Owner review points

- The six-document corpus is the kickoff minimum; any broader editorial scope can be reviewed
  after previewing it. The owner confirmed the standard https://gitlode.github.io/docs/ URL and `/docs/` base; no custom domain.
- Stable translation snapshots versus shared translations remains open; never silently reuse
  next translations in stable. The initial example should explicitly identify its source edition.
- SSG choice and removal, PoC exit acceptance, and production launch require owner approval.
- Confirm the repository name before production URLs are finalized; `gitlode/docs` is used now
  because it is the repository already provided, not because availability was assumed.

No deployment, cross-repository notifications, external SaaS, automatic translation generation,
or production hardening is part of this kickoff increment.
