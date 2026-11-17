# Current PoC handoff

Status: active continuation note, updated 2026-11-17.
Maintainer: the next human or LLM working on the PoC. Decision authority: human project owner.
Replace or retire this note when the next increment is handed off; migrate lasting facts to durable docs.

## Starting point

- Repository: `gitlode/docs`; work branch: `work/poc-evaluation` (created from merged main).
- `0ef1673`: initial pinned acquisition/staging foundation.
- `f983e3c`: development tooling alignment with gitlode itself.
- Documentation is organized by purpose: `design/`, `contributing/`, `poc/`, `handoff/`, and
  `proposals/`. Durable and temporary describe document lifecycles, not parent directories.
- Working increments should be committed; the owner plans a squash merge to `main`.

Use [development](../contributing/development.md) for commands and
[architecture](../design/architecture.md) for current contracts. The
[PoC plan](../poc/plan.md) owns milestones; [evaluation](../poc/evaluation.md) owns test evidence.
Both next-English previews now build from the same six-document corpus and pass HTML links,
fragments, sidebar/TOC presence, code-block, and table checks. See
[English preview evidence](../poc/english-previews.md) for reproduction, measurements, and screenshots.
Node 22.23.4 is now required by the current Astro dependency line; npm 11 remains the baseline.
Run `npm run previews:build`, then the two `preview:*` commands in separate terminals.
For agent-owned HTTP checks, prefer bounded `npm run previews:verify`: it uses ephemeral ports and
closes both servers in `finally`. Follow the [process lifecycle procedure](../contributing/development.md#verification-process-lifecycle)
for all verification processes. A previous shell/tool exit left a Node child holding both fixed
preview ports; do not treat wrapper completion as evidence of child termination.

Localization is implemented: see [evidence](../poc/localization.md).
Combined stable/next artifact assembly and version navigation are implemented locally.
Owner accepted version navigation in both candidates after browser review and confirmed the TypeScript migration.\nNext action: remaining PoC evaluation (including search). Keep both candidates and the existing human decision gate.
The SSG recommendation is not yet ready. Native local search is now enabled for comparison; see docs/poc/search.md.

## Pending review

On 2026-11-17 the owner reviewed localized previews: no major end-user difference except the
missing-translation notice. Starlight's styled notice is distinct from body text; VitePress's
current plain paragraph can be overlooked. Treat notice discoverability as a functional acceptance
criterion, with default support and additional implementation/maintenance cost evaluated separately.
See the Japanese [localization results](../poc/localization.md). Owner-facing PoC result summaries
must now be Japanese; durable and LLM-oriented documents remain English.

[Environment alignment feedback](../proposals/development-environment.md) is recorded for later
cross-project review. Keep the current local configuration and continue the PoC without waiting
for that review. SSG selection and production launch still require their separate human gates.

VitePress's declared Vite/esbuild dependency line still produces three npm audit package findings.
The documented preview uses a separate loopback-only static server; do not substitute a publicly
exposed Vite development server. Revisit the dependency findings before production acceptance.
Starlight's i18n/custom-404 warnings are recorded for the localization increment. Hosted CI and
full interactive/mobile browser validation remain unverified.

No upstream modifications or remote publication are implied by this handoff.

The VitePress notice now uses the default theme custom-block warning classes before the H1, with a Japanese title, explanation and role=note. No custom CSS or dependency was added. Checks/builds pass; headless Edge produced no screenshot, the owner subsequently reviewed the preview and accepted notice parity.

Owner accepted notice parity after re-review. A separate investigation confirmed Profiling Guide's
three body references (telemetry once, CLI twice) resolve to pinned GitHub URLs in both candidates
and locales because the two target files are outside publication.json. rewriteLink deliberately
externalizes unselected existing files. The owner expects documentation references to stay inside
the site. This expectation is not yet enforced by validation. See the Japanese localization evidence
for findings and proposed explicit-publication/link-policy follow-up; no publication expansion or
link implementation change was made during the investigation.

Owner decision (2026-11-17): links to documents outside the PoC publication scope may remain external GitHub links. Do not fix or expand publication for this issue during the PoC; it is an accepted limitation, not a blocker. Production must address internal documentation references before launch. Track publication scope and internal-link validation in the production-readiness review, owned by the documentation project; distinguish intentionally external source-code/excluded-material links.

Default previews:build now builds both editions and both candidates into combined-*/dist mounted
at /docs/. The same preview commands/URLs work; version links are in the header, target the locale home, and force full
reload. Upstream staging is shared; stable Japanese pages intentionally all fall back to English.
Owner declared untranslated-document comparison complete. Do not reopen it or the accepted
out-of-scope external-link limitation. See docs/poc/versions.md for Japanese review evidence.

Owner changed version-switch requirements: always open the other edition's locale home; do not
preserve document identity. Controls belong with language navigation in the header (Starlight also
inherits its mobile preferences placement). This is sufficient by design; no cross-version page
mapping is wanted. Language switching still retains the current document.

Owner search review: both candidates are sufficient; VitePress is judged more feature-rich in browser use. Search is not a key selection factor and this compares defaults only, so the difference is not decisive. Customization could change the comparison but this is unverified. Keep narrow Japanese query observations separate from this overall usability judgment. Next: clean-clone/hosted-CI verification and maintenance evaluation, not additional search customization.

Clean-clone verification completed for 7790e7b in .generated/repro-916ea805/checkout with an empty npm cache: install/check/acquire/stage/all builds/HTTP/search pass; checkout clean, ports58169/58170/58175 released and no owned Node process remains. Same machine only, not hosted CI; output is functionally reproducible but not byte-identical. The owner subsequently authorized push and Draft PR #1 (https://github.com/gitlode/docs/pull/1). Ubuntu CI run 44033616926 passed all steps for head 4420aec. No merge/deploy. See docs/poc/reproducibility.md and docs/poc/github-setup.md. Next: consolidate maintenance costs and the Japanese SSG recommendation. Record the checkout/setup-node v4 runtime deprecation warning as maintenance follow-up.

Owner update: PR #1 was approved and squash merged as b9c53d5; local main is updated. Keep work/initial-poc intact. The owner checked GitHub settings and reported no issues. Use the standard https://gitlode.github.io/docs/ URL, without a custom domain. Deployment remains unimplemented; this does not select an SSG or authorize production launch.

Selection report prepared on work/poc-evaluation: docs/poc/maintenance.md and ssg-proposal.md recommend Starlight by a small margin for native missing-translation behavior. Independent read-only review confirmed counterarguments: VitePress has better current typecheck coverage; native nav may simplify its custom UI; most pipeline costs are shared. Audit rechecked: 3 affected package entries (2 moderate, 1 high), no automatic fix. Owner selection is pending; retain both candidates and do not deploy. No servers started for this documentation increment.

Future outlook requested by owner: docs/poc/future-outlook.md separates verified facts, isolated experiment and inference. Clone .generated/v2-trial at 9a82193 uses VitePress 2.0.0-alpha.21, attrs:false, updated Vite/esbuild resolution and v2-aware search probe (tokenizeSearchText and base prefix). All 51 tests, type checks, four builds, HTTP and 64 search probes passed; final npm audit zero. Final artifact combined-0kOIn1. Ports 54168/54169/54174/57016 free; no owned Node remains. Main candidate dependencies unchanged. V2 browser/Ubuntu CI untested; Starlight minor releases have actual breaking changes. Treat v2 as viable, not excluded for alpha label; owner selection remains pending.
Owner admitted v2 as an equal candidate. Three-candidate pipeline: npm alias vitepress-v2, independent typed theme/config, six builds, 96 search queries and 66 tests. Explicit client import and SSR noExternal support alias coexistence. Output combined-0Odz1l passed Edge smoke including language/version/search/mobile. All QA processes closed. See docs/poc/three-candidates.md; selection deferred pending owner v2 review.
Three-candidate Ubuntu CI passed on PR #2 head f5acf58: run 44048733239. Owner v2 preview review is next; no merge/deployment performed.
