# Implementation plan

Status: Localization increment implemented; comparative PoC remains in progress.
Owner: human project owner. Implementation: Codex working in `gitlode/docs` on `work/initial-poc`.
The kickoff increment was committed as `0ef1673`. Commit subsequent work at practical increments;
the owner plans to squash merge into `main`. No push or merge has been performed by this session.

## Confirmed inputs

The owner approved stable `gitlode@0.12.0` and next `integration/v0.13.0` during kickoff.
The existing checkout already points to the public `gitlode/docs` repository, so no new repository
or rename is needed for this increment. GitHub Pages remains the required production host.
Project documents are English. The original [kickoff contract](kickoff.md) is retained verbatim;
later owner instructions refine it, including the [documentation lifecycle](../README.md).

Cross-project tooling feedback is tracked under `../proposals/` for separate review. Continue the
PoC using documented local choices without waiting for commonization approval. See
[environment feedback](../proposals/development-environment.md).

## Sequential milestones

| Milestone                | Deliverable and verification                                                                                          | Status                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 1. Inspect and bootstrap | Verify repository and real source tree; runtime, lockfile, project docs, validation CI                                | Implemented locally; hosted CI not run    |
| 2. Acquire and stage     | Pin both refs; select six real documents; preserve bytes and provenance; reject unsafe paths/symlinks                 | Implemented and locally tested            |
| 3. Comparable previews   | Add VitePress and Starlight under `candidates/`; same staged input; titles, README routing, sidebar, TOC, code fences | Implemented; see English preview evidence |
| 4. Localization          | Owned Japanese example, missing-page behavior, native/custom fallback comparison, file-level freshness tests          | Implemented; see localization evidence    |
| 5. Pages simulation      | Both editions/locales under nested `/docs/` paths; complete artifact; links/assets validation; PR build               | Pending                                   |
| 6. Evidence and proposal | Timings, sizes, warnings, screenshots/manual review, reproducible comparison, proposed recommendation                 | Pending                                   |
| 7. Human selection gate  | Owner reviews both previews and approves an SSG; only then remove a candidate                                         | Human decision pending                    |

Milestones are reviewable working increments, not separate disposable repositories.
Do not create empty candidate directories or claim previews before the rendering code exists.

## Next implementation tasks

1. Review the [English previews and limitations](english-previews.md) before extending the corpus.
2. Review [localization evidence](localization.md) and the owned Japanese example in both candidates.
3. Keep stable/next translation ownership explicit; file-level metadata tests now pass.
4. Exercise both source editions in one complete Pages-style artifact, including version links.
5. Address remaining dependency findings and add imported asset support only with explicit selection
   and validation. Do not expand publication merely to hide link errors.

## Owner review points

- The six-document corpus is the kickoff minimum; any broader editorial scope can be reviewed
  after previewing it. The intended Pages base `/docs/` is provisional until deployment review.
- Stable translation snapshots versus shared translations remains open; never silently reuse
  next translations in stable. The initial example should explicitly identify its source edition.
- SSG choice and removal, PoC exit acceptance, and production launch require owner approval.
- Confirm the repository name before production URLs are finalized; `gitlode/docs` is used now
  because it is the repository already provided, not because availability was assumed.

No deployment, cross-repository notifications, external SaaS, automatic translation generation,
or production hardening is part of this kickoff increment.
