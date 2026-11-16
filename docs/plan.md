# Implementation plan

Status: initial kickoff increment completed; comparative PoC remains in progress.
Owner: human project owner. Implementation: Codex working in `gitlode/docs`, currently on `main`.
This working tree has not been committed or pushed by the kickoff session.

## Confirmed inputs

The owner approved stable `gitlode@0.12.0` and next `integration/v0.13.0` during kickoff.
The existing checkout already points to the public `gitlode/docs` repository, so no new repository
or rename is needed for this increment. GitHub Pages remains the required production host.
Project documents are English. The original [kickoff contract](kickoff.md) remains authoritative.

## Sequential milestones

| Milestone | Deliverable and verification | Status |
| --- | --- | --- |
| 1. Inspect and bootstrap | Verify repository and real source tree; runtime, lockfile, project docs, validation CI | Implemented locally; hosted CI not run |
| 2. Acquire and stage | Pin both refs; select six real documents; preserve bytes and provenance; reject unsafe paths/symlinks | Implemented and locally tested |
| 3. Comparable previews | Add VitePress and Starlight under `candidates/`; same staged input; titles, README routing, sidebar, TOC, code fences | Next |
| 4. Localization | Owned Japanese example, explicit missing page, native/custom fallback comparison, file-level freshness metadata tests | Pending |
| 5. Pages simulation | Both editions/locales under nested `/docs/` paths; complete artifact; links/assets validation; PR build | Pending |
| 6. Evidence and proposal | Timings, sizes, warnings, screenshots/manual review, reproducible comparison, proposed recommendation | Pending |
| 7. Human selection gate | Owner reviews both previews and approves an SSG; only then remove a candidate | Human decision pending |

Milestones are reviewable working increments, not separate disposable repositories.
Do not create empty candidate directories or claim previews before the rendering code exists.

## Next implementation tasks

1. Add the two SSGs with compatible pinned dependencies and a lockfile update.
2. Implement a small link inventory/normalization step. Selected links become internal routes;
   links to unselected existing files become SHA-specific upstream links. Missing targets fail.
   Do not expand the allowlist to hide link errors. Referenced assets require explicit selection.
3. Derive titles from H1 and map nested README paths; remove duplicate H1 only where required.
4. Enforce inert Markdown rendering before passing imported text to either SSG: reject/escape
   executable directives, Vue interpolation, raw active HTML, and local file includes. Add malicious
   input fixtures. Never pass staged raw Markdown directly into a VitePress build.
5. Build both candidates from one staging manifest and check published paths, sidebar and TOC.

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
