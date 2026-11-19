# Production readiness handoff

Historical launch record, 2026-11-19. P1–P6 are complete. The sections below preserve the original
plan, owner decisions and verification results. For ongoing work use the [documentation guide](../README.md).

The owner accepted VitePress v2 consolidation and approved the PoC closeout sequence. PoC exit,
merge, and production launch are separate decisions. This document carries the work between a
successful PoC and a usable production service; it does not authorize a deployment.

## Resume from the existing foundation

Read [current handoff](current.md), [architecture](../design/architecture.md),
[development](../contributing/development.md), and [ADR 0001](../decisions/0001-use-vitepress-v2.md).
Use this repository for production; do not rebuild the prototype in another repository.
Check the actual branch, merge status, CI revision and working tree before editing. Historical
comparison documents intentionally retain obsolete commands and are not restart instructions.

Implemented and retained:

- Exact-pinned VitePress 2.0.0-alpha.21; shared publication services in `src/publishing/`,
  VitePress assembly/checks in `src/ssg/vitepress/`, trusted config/theme in `site/vitepress/`.
- Immutable upstream Git blob reads, an explicit six-document allowlist, independent navigation,
  provenance hashes, restricted Markdown, and ignored generated sources/artifacts.
- Stable/next, English/Japanese, missing-translation notice and English body language, file-level
  translation freshness, same-document language switching, locale-home version switching.
- Complete static artifact under `/docs/`, local search, local validation, and read-only PR CI.
  Manual Pages preparation and publishing are covered in P5.
- Canonical English remains in `gitlode/gitlode`; Japanese sources remain in this repository.
  No automatic link-following publication or executable upstream Markdown is permitted.

Fixed inputs tested by the PoC (not a claim that these are the latest release/development refs):

| Edition | Configured ref                   | Pinned commit                              |
| ------- | -------------------------------- | ------------------------------------------ |
| stable  | `refs/tags/gitlode@0.12.0`       | `76b124e23fcc069be1278629cf01b62ae1456c7a` |
| next    | `refs/heads/integration/v0.13.0` | `90512564d76490088ecc99da7596128df1c45a2c` |

`config/<edition>/source.json` is authoritative. Acquisition retains the configured commit if the named ref
moves; rerunning acquisition is not a source update. Source updates need explicit configuration changes.

## Recommended order and dependencies

### Owner decisions and operations to design (2026-11-19)

Use the two pins above for current work. The initial audience is CLI users, official plugin
users and gitlode developers. Include the CLI package README, usage and profiling guides,
design and contributing guides present in each edition, and the five official plugin READMEs.
Keep the repository README, package documentation index and internal package material on GitHub.
The two telemetry guides currently exist only in next. Enumerate selected paths explicitly.

Treat routine ref/pin updates, display-label changes, and edits to an edition's publication
scope as operator tasks. Rehearse a subsequent change as well as the initial build. Edition path, display label and pinned input can now be set independently.
See [edition operations](../operations/editions.md) for the implemented contract.
Individual document moves follow source paths; defer URL overrides and redirects until there
is a concrete need.

Edition names carry operational meaning only. Configuration drives acquisition, combined
assembly and all edition switches. Translation transfer accepts explicit source and destination
editions. Existing destination translations are preserved. Copied translations retain the hash
of the checked English original and show a review notice when the destination differs.

Discuss the remaining reader-visible behavior with the owner as appropriate:

| Operator action                                | Proposed behavior to review                                                                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add a next-only guide or change its navigation | Select it for next independently. Validate its links, translations, search and navigation against that edition's inventory.                       |
| Promote a release or correct stable            | Review the pin, selected documents and translations together. Allow next to advance independently and record the exact deployed inputs.           |
| Reject or recover a release                    | A failed candidate leaves the last successful site available. Rehearse recovery of both editions together, including the first-launch case in P5. |

Use these scenarios to refine P1–P5 with the owner. Record proven operator procedures in
operations documentation as each increment lands.

Start with P1: inspect the desired production corpus and present a concrete publication proposal.
P2 and P3 can be investigated alongside that proposal. P4 depends on the chosen source and translation
policies. Prepare P5 only after these decisions have a reviewable implementation. Close each increment
with its own checks and commit; do not accumulate an unreviewed production-sized change.
P6 applies throughout P1-P5: update the system's own documentation in each increment, then
review its completeness before launch. It is not a documentation-only phase postponed until the end.

### P1. Production publication, links, and assets

Initial corpus implemented: 21 stable and 23 next documents, including two next-only telemetry guides.
See [publication operations](../operations/publication.md) for selection, routes and navigation.
Imported images are currently rejected. Existing generated theme assets do not establish support for
arbitrary upstream assets, CSS URL references, or `srcset`.

Entry points: `config/<edition>/publication.json`, `config/<edition>/navigation.json`, `src/publishing/pipeline.ts`,
`src/publishing/markdown.ts`, `src/publishing/content.ts`, `src/publishing/validate-output.ts`,
`src/ssg/vitepress/build.ts`, and `test/markdown.test.ts` / `test/output.test.ts`.

1. Inventory durable end-user/developer documents and their links at both chosen source revisions.
   Classify intended internal documentation links, deliberately external references, and assets.
   Treat the inventory as a proposal, never as permission to publish every linked target.
2. Ask the owner to confirm production scope, including whether root/package READMEs belong on the
   site. Specify publication separately from sidebar placement and handle edition differences explicitly.
3. Extend the allowlist and route handling for approved content. Define allowed asset paths/types,
   provenance, copying, URL rewriting, and rejection rules before enabling images. If no selected
   production document needs imported assets, document that scope and retain rejection instead.
4. Verify selected documents link internally where intended, including nested README routes and
   fragments in both locales/editions. Preserve declared external references and canonical attribution.

Completion evidence: scope approved; representative new content renders; missing/unsafe assets,
symlinks, traversal, excluded documents and route collisions fail; asset and fragment references
resolve under `/docs/`; no agent/handoff documents or source snapshots enter the artifact. If asset
support is added, extend validation to the supported reference forms rather than assuming `href/src`
checks cover every form. Do not change canonical English just to satisfy VitePress.

### P2. Translation policy and quality

On 2026-11-19 the owner reviewed the Japanese Profiling Guide and approved its wording for
production use. Its checked English source matches next. The transferred stable 0.12.0 copy
retains the source-difference notice until reviewed against that release's original.
The [translation maintenance procedure](../operations/translations.md)
covers missing translations, source changes and Japanese-only corrections.

Entry points: the edition translation manifests, `translations/ja/<edition>/`,
`src/publishing/translations.ts`, `src/ssg/vitepress/validate-localization.ts`,
`site/vitepress/config.ts`, and `test/translations.test.ts` / `test/localization.test.ts`.

1. The [transfer procedure](../operations/translations.md#transfer-between-editions) applies in both directions.
   For stable 0.12.0 it produced one copy with a review notice and 20 English fallbacks.
2. The Profiling Guide is approved for initial publication. Untranslated pages use English fallback.
3. Maintainers review the English diff before updating the checked hash. A review may require no text edit.

Completion evidence: recorded policy and review responsibility; example reviewed or explicitly
excluded/deferred for launch; tests cover source change, unchanged source across commits, missing
translations, release isolation and correction/promotion behavior actually introduced. Keep visible
fallback notices and correct body language. Notifications and automated translation remain optional.

### P3. Dependencies and upgrade maintenance

Completed on 2026-11-19 for docs revision `2f763d6`. An isolated Windows install with Node
22.23.4 and npm 11.11.0 installed the committed lockfile using `npm ci --ignore-scripts --no-audit`.
The lockfile SHA-256 was `51c9dc52528b2fd6cc2c1056b950c9ee94e49ace1c7d8f4cbe41f6c0e175fcfb`.
`npm ls --all` passed and a separate full `npm audit --json` against registry.npmjs.org
returned zero findings at every severity. Formatting, lint, type checks and all 45 tests passed
using that clean install. The audit required no dependency change or outstanding risk decision.

The installed graph still resolves picomatch 4.0.7 through VitePress 2.0.0-alpha.21 and Vite
8.3.8 (also via tinyglobby), and through vue-tsc 3.3.14 and @vue/language-core 3.3.14.
These paths are used by build and type-check tooling. GitHub marked the previous advisory
withdrawn on November 18. The earlier audit remains dated PoC evidence.
[GitHub advisory GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf)

Known observation, dated 2026-11-18: npm audit reported seven high package findings derived from one
picomatch advisory, GHSA-fc5q-39xc-vjpf. Compatible updates did not resolve them. This is not a fresh
audit or seven independent vulnerabilities; see [consolidation evidence](../poc/consolidation.md).
The old Vite/esbuild dependency inconsistency was resolved during consolidation.

Entry points: `package.json`, `package-lock.json`, `site/vitepress/`, `src/ssg/vitepress/search.ts`,
and the VitePress upgrade procedure in development documentation.

1. Re-run a clean install and dependency audit when production preparation begins. Record the date,
   graph, advisory reachability in the build/type-check environment, and available compatible fixes.
2. Apply justified fixes without silently downgrading the selected SSG or introducing broad overrides.
   If a finding remains, present its exposure and mitigation/defer options for an explicit launch decision.
3. Verify any dependency change with type checks, tests, both builds, HTML/localization/version checks,
   search probes and browser interactions. Search verification uses pinned internal VitePress APIs.

Completion evidence: reproducible lockfile, no invalid dependency graph, current findings and decisions
recorded, and successful regression evidence. An earlier audit or successful site build is not evidence
that a later dependency graph is safe. Maintain the selected alpha version until a reviewed upgrade.

### P4. Source release/update workflow

Technical rehearsal passed on 2026-11-19 in an isolated checkout based on `fa72bc8`.
The tracked project pins were unchanged. For the manual PR procedure see
[edition operations](../operations/editions.md#review-a-source-update-pr).
P4 is complete. The owner approved manual PRs initiated by the release maintainer at package
publication for stable, and by the integrating developer when changes are ready for next readers.

To reproduce the rehearsal with the two real upstream pins in the table above:

1. Acquire both pins. In the isolated checkout only, start next with the stable 0.12.0 ref,
   commit, publication list and sidebar. Give next two fixture Japanese translations for
   `packages/gitlode/docs/usage.md` and `packages/plugin-file-type/README.md`, with their
   checked hashes computed from the 0.12.0 Git blobs. Use simple translated headings and
   body text. Commit and build. Both pages were current, with 21 selected documents per edition.
2. Restore the configured next ref and commit (`90512564`) and its 23-document selection and
   sidebar, retaining the two fixture records. Commit, build and run the HTTP and search checks.
   The Usage original changed and its Japanese page displayed the review notice. The plugin
   README original was identical and its Japanese page stayed current. Stable remained on
   `76b124e2` with 21 documents. For both successful builds, the recorded docs revision matched
   the clean fixture commit, and all staged file hashes and attribution URLs matched the pinned blobs.
3. Save the successful preview pointer and a digest of the combined dist paths and bytes.
   Append an unpublished path to a next sidebar group and rebuild. The stable sub-build
   succeeded, then next failed sidebar validation. The failed candidate produced no combined
   build report. The pointer and the previous dist digest were unchanged. Bounded HTTP and
   all 32 search probes passed again against that previous artifact, and the listeners closed.

Current limitation: explicit source pins are reproducible, but there is no automatic release promotion
or upstream synchronization service. The PoC's `next` is a snapshot, not a live mirror.

Entry points: `config/<edition>/source.json`, `src/publishing/pipeline.ts`, translation metadata, and
[updating inputs](../contributing/development.md#updating-inputs).

1. Confirm the production stable tag and development ref with the owner; do not choose a development
   branch by name sorting or silently replace the tested revisions.
2. Document a manual pin-update PR procedure first: resolve the intended ref, inspect changed source,
   publication paths and translation freshness, rebuild both editions, and review generated behavior.
3. Follow the agreed ownership and timing in the edition operations guide. Further automation is deferred.

Completion evidence: one reproducible update rehearsal with correct provenance, unchanged-file
translations remaining current, changed-file translations flagged, and no partial/stale deployment
artifact selected after a failed build. Stable promotion follows P2's approved policy.

### P5. Deployment, verification, and recovery

Implementation and local recovery rehearsal completed on 2026-11-19 at
`682b4db055dce6051df281ee97fba196ba04175f`. Follow [deployment operations](../operations/deployment.md).
The workflow passed actionlint 1.7.12 and the project passed 45 tests. Two clean builds
of the same docs revision passed HTTP and 32 search probes each. The recovery checkout
reinstalled the lockfile and fetched both upstream pins. In each build the artifact selector
rejected a different SHA and accepted the tested SHA. A local tar of the selected directory
contained exactly the 339 static files in that build. Both builds had the same 98 HTML paths
and page text (excluding scripts and styles). Only 45 of 339 path/hash pairs matched across
builds, so the tested recovery is a functional rebuild rather than a byte-identical restore.

Read-only GitHub observations on the same date: default branch `main`, Pages enabled, and
the existing `github-pages` environment allows only the `main` branch. No required reviewer
was listed. The public API could not confirm the Pages publishing source or Actions allowlist.
The owner confirmed in Settings that Pages uses GitHub Actions and has no custom domain.

**First known-good release, 2026-11-19.** [PR #4](https://github.com/gitlode/docs/pull/4)
landed on main at `af30cf58e18028b4a63e4068242cf5ea71bab361`.
The [prepare run](https://github.com/gitlode/docs/actions/runs/44485270204) validated
and uploaded the candidate. The owner triggered the [first publish run](https://github.com/gitlode/docs/actions/runs/44485557590)
for that SHA. Validation and deployment succeeded with artifact `github-pages-44485557590-1`.
Stable used `gitlode@0.12.0` at `76b124e23fcc069be1278629cf01b62ae1456c7a`;
next used `integration/v0.13.0` at `90512564d76490088ecc99da7596128df1c45a2c`.

Headless Edge opened the [production site](https://gitlode.github.io/docs/) over HTTPS.
For both editions and languages, the home and nested plugins page loaded, heading fragments
survived reload, upstream links contained the expected pin, both switches reached the
expected destination, and selecting a CLI search result reached the CLI reference heading.
The Japanese plugins pages displayed the English fallback. The Japanese Profiling Guide
displayed the source-change notice on stable only. The browser observed no failed same-site
asset loads or uncaught page errors on these paths. A missing page, the editions config,
the generated preview pointer and the internal handoff path all returned HTTP 404.
The owner also reviewed the published content and reported no issues. Use this publish run as the initial recovery reference.

Hosting decision already made: GitHub Pages at `https://gitlode.github.io/docs/`, no custom domain.
The owner previously reported GitHub settings correct. Recheck only relevant settings when preparing
launch; that report is not evidence of a successful deployment. See [GitHub setup](../poc/github-setup.md).

Entry points: `.github/workflows/docs.yml`, `src/ssg/vitepress/build.ts`, and development documentation.
The successful build pointer `.generated/preview.json` identifies a run with its `build.json` and
complete `dist/`. Upload only static `dist/`, never the whole generated run or repository.

1. Prepare a trusted-branch/manual production workflow that builds and validates one complete
   stable+next artifact. Define trigger, concurrency and provenance retention. PR validation remains
   read-only and cannot deploy. Grant Pages/OIDC write permissions only to the deployment job.
2. Review the concrete workflow, publication/translation policies and dependency findings with the
   owner. Confirm applicable `github-pages` environment protection and Pages Actions configuration.
   Obtain production-launch approval before the first deployment.
3. After approved deployment, verify real HTTPS URLs for both editions/locales, direct deep links,
   asset loading, fragments, language/version controls, fallback notice, search and 404 behavior.
   Record the deployed docs commit, source pins and CI/deployment run; local `/docs/` simulation alone
   cannot establish hosted behavior. Check that excluded content is absent.
4. Before launch, document recovery: identify a last-known-good complete artifact or reproducible
   docs/source revision, rebuild/revalidate if required, and redeploy the entire artifact. Test recovery
   in an approved manner and verify both editions after recovery. A first launch needs an explicit
   failure response because no earlier successful deployment may exist. Do not assume Pages appends
   files or that a retained upstream branch guarantees reproducibility of a discarded artifact.

Completion evidence: approved go-live, successful deployment and hosted checks, maintained operating
instructions for updates and failures, and an agreed recovery procedure. This is the production
acceptance point, separate from PoC completion.

### P6. Documentation for the documentation system

Final review followed the first deployment. The repository README now directs maintainers to the
four operating guides and developers to the tested local workflow. The review corrected the former
staging count and pending-launch status, and identified the PoC material as historical.

Entry points: `README.md`, `AGENTS.md`, `docs/README.md`, `docs/design/architecture.md`,
`docs/contributing/development.md`, and the active `docs/poc/` and `docs/handoff/` material.

1. Organize durable documentation by audience and purpose. Keep architecture, implementation,
   extension points and contributor setup in development-oriented material. Provide separate
   operations material for content/translation updates, releases, deployment, verification,
   troubleshooting and recovery. An operations home such as `docs/operations/` can be introduced
   when those procedures are implemented; do not create empty runbooks or describe proposals as live behavior.
2. Update the project entry points, agent instructions, status and navigation to describe the
   maintained production documentation system. Retain useful historical PoC evidence with explicit
   historical status, and promote lasting contracts out of temporary reports. Preserve the original
   kickoff and decision rationale; production users should not need to reconstruct them from session logs.
3. Treat documentation as part of every P1-P5 completion condition: P1 records selection/assets
   rules and how to change them; P2 records translation policy and review procedures; P3 records
   upgrade/verification procedures and risk decisions; P4 records source promotion/update operations;
   P5 records deployment, hosted verification and incident recovery. Link shared contracts rather
   than duplicating potentially conflicting instructions between development and operations guides.
4. Before launch, review the documentation from a new developer's and an operator's perspective.
   Verify commands and links against the implemented system, distinguish unresolved decisions,
   and make the correct guide discoverable from the repository entry points.

Completion evidence: separate, discoverable development and operations guides reflecting actual
behavior; maintained project-facing material no longer assumes an active comparison PoC; P1-P5
include their documentation changes; a new maintainer can develop and operate the system without
the original chat or ignored artifacts. Durable documentation remains English. This work may be
delivered across multiple implementation increments rather than as a standalone task.

## Work that does not block this sequence

Cross-project development-setting feedback remains in `docs/proposals/` and is reviewed separately;
do not wait for upstream adoption. Historical versions beyond stable/next, cross-version search,
automated translation, analytics, custom domains, elaborate theme changes and build optimization
remain optional unless the owner changes scope. Preserve evidence rather than reopening SSG selection.
