# Implementation plan

Status: Owner selected VitePress v2 on 2026-11-18; implementation consolidation is next.
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
| 6. Evidence and proposal | Timings, sizes, warnings, screenshots/manual review, reproducible comparison, proposed recommendation                 | Review complete; see ADR 0001             |
| 7. Human selection gate  | Owner reviews both previews and approves an SSG; only then remove a candidate                                         | VitePress v2 selected                     |

Milestones are reviewable working increments, not separate disposable repositories.
Do not create empty candidate directories or claim previews before the rendering code exists.

## Next implementation tasks

VitePress v2 has been selected and the code is consolidated; see ADR 0001 and
[consolidation evidence](consolidation.md). Earlier comparison milestones are historical.

1. Review the consolidated site and record PoC exit acceptance separately.
2. Agree production publication scope and explicit assets; resolve internal references to
   documents outside the current six-document corpus without automatic publication expansion.
3. Decide stable translation snapshots and review the Japanese example's language quality.
4. Review remaining dependency audit findings and deployment preparation before launch.

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

## Owner-directed scope expansion

VitePress v2 alpha.21 is now an equal candidate, not just future reference. Absolute stability is
not required for this personal project. Preserve v1, v2 and Starlight; complete six builds,
96 search queries, browser checks and hosted CI, then obtain the owner's v2 preview evaluation
before revising the selection recommendation. See three-candidates.md.

## Owner review received: 2026-11-18

The owner completed v2 browser review: basic capabilities are comparable to v1, Japanese search
improved, and no unfinished behavior was observed within the reviewed scope. For this new adoption,
the owner prefers v2 over v1 based on expected development direction. This is an evaluation,
not an upstream support guarantee. Next: revise the recommendation around v2 versus Starlight.
Retain v1 as a comparison baseline; final SSG selection and candidate removal remain pending.

## Accepted SSG decision

ADR 0001 records the owner's choice of VitePress v2 over the narrow Starlight recommendation.
The owner prefers Vue and accepts the small custom fallback implementation. This supersedes
earlier pending-selection notes. Next: consolidate on v2, retain validation, and reassess the
dependency graph; publication and PoC exit remain separate decisions.

## Consolidation completed

The owner authorized removal of non-selected code after choosing v2. The implementation now
separates publication processing, VitePress-specific assembly/verification, and site templates.
This supersedes earlier instructions to retain parallel candidates. Historical evidence remains.
See [consolidation](consolidation.md); production launch and PoC exit are still separate gates.
