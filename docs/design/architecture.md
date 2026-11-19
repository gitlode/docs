# Architecture

## Ownership and flow

`gitlode/gitlode` owns canonical English documents. This repository owns selection, acquisition,
staging, the VitePress adapter, Japanese translation sources, validation, and publishing.
Its own `docs/` directory is never automatically published as product documentation.

Current flow: `config/<edition>/source.json` -> Git object acquisition -> explicit allowlist -> byte-preserving
staging/provenance -> shared content preparation -> VitePress adapter -> English/Japanese static builds
and output validation. VitePress v2 is selected and consolidated; production deployment remains pending.

## Design for gitlode maintainers

A gitlode developer should be able to publish documentation using familiar release conventions,
the configuration and the operations guide. When choosing where a rule belongs, consider both
the work it saves and what a maintainer would have to know to predict the result. Prefer a
simple, explicit operation when special cases would require knowledge of the publishing internals.

For example, keeping a released edition's navigation fixed is a familiar release practice.
The [edition procedure](../operations/editions.md#stable-release-policy) records that convention.
The build processes each configured edition the same way, and the operator chooses the source
and destination of a translation transfer explicitly.

## Code domains

- `src/publishing/` owns acquisition, selection/staging, Markdown safety and link rewriting,
  translation metadata, and renderer-independent content preparation. It also provides generic
  static HTTP serving/lifecycle and local HTML reference validation. It imports no SSG package.
- `src/ssg/vitepress/` consumes prepared content, generates VitePress inputs, invokes the pinned
  CLI, assembles editions, and verifies VitePress rendering, localization, version navigation,
  and search indexes. Checks coupled to theme markup and search internals belong here.
- `site/vitepress/` contains trusted configuration, metadata types, and the Vue theme. These
  templates are copied into generated build roots; generated content is never stored here.
- `src/cli/site.ts` is the command entry point for the selected adapter. Source acquisition and
  staging remain independently callable through `src/publishing/cli.ts`.

Dependencies point from the adapter to publication services. Content preparation returns pages,
provenance, translation status, and navigation; it does not write SSG frontmatter or theme markup.
A strict shared Markdown policy can reject syntax meaningful to a renderer without coupling the
publication layer to that renderer's runtime or theme API.

## Acquisition and pins

`src/publishing/pipeline.ts` fetches each explicitly configured ref from the public upstream into
`.generated/source`. It resolves the fetched ref to a commit before reading content. Checked-in
commit pins determine build input; upstream movement produces a warning and fetches the original
pin instead. Updating a pin is an explicit reviewed config change, not an automatic branch switch.

This refines the proposed Git checkout approach: the pipeline reads regular blobs with `ls-tree`
and `cat-file` without checking out files. This preserves exact committed bytes, avoids local dirty
changes and checkout filters, and does not run upstream package scripts. It also rejects symlink
and submodule entries. No individual-file API calls or privileged source credentials are needed.

## Selection and staging contract

`config/<edition>/publication.json` enumerates the complete selection for one edition, independently of the proposed
sidebar groups in `config/<edition>/navigation.json`. The renderer consumes the validated navigation subset.
Missing selected files are errors. Agent/handoff content, arbitrary roots,
MDX, duplicate/case-colliding paths, traversal, backslashes, and Windows reserved names are rejected.
Broader publication requires explicit configuration and, if outside the durable document policy,
a justified policy change.

Each staging command creates a new run below `.generated/staging/`. It validates inputs before
writing, never overwrites a previous run, preserves source paths, and writes `manifest.json` last.
Only runs with a manifest are complete. An interrupted run may remain for inspection. Generated
directories reject symlink/junction components; writes use exclusive creation. Concurrent hostile
local filesystem mutation is outside this PoC's threat model.

The manifest records requested ref, resolved commit, upstream URL, source/staged paths, Git blob ID,
SHA-256, docs repository revision and dirty state, and a hash of acquisition/publication config.
A dirty flag makes uncommitted implementation explicit; it does not make uncommitted builds fully
reproducible. Release artifacts must eventually come from a clean committed docs revision.

## Renderer boundary and security

Staging is raw source acquisition, **not sanitization**. It deliberately retains original Markdown.
`markdown.ts` parses staged copies with remark/GFM, rejects raw HTML/components, upstream frontmatter,
Vue interpolation outside code, SSG directives, code-fence metadata, unsafe URLs, and image syntax
without an explicit asset policy. Include comments are rejected even inside code because VitePress
expands them before Markdown parsing. VitePress also disables HTML, attributes, and snippet handling.
Titles reused in generated navigation are checked and Markdown link labels escaped.

The shared preparation step uses the parser's native tree only for narrow validation/link rewriting;
it does not define a universal adapter AST. Serialization normalizes Markdown formatting in generated
copies. Fenced code values and Markdown structure are preserved and checked; source bytes remain
unchanged in staging. Unsupported syntax fails with an actionable error instead of being executed.

Prepared content uses directory routes (`usage.md` -> `usage/`, `design/README.md` -> `design/`).
VitePress keeps the original H1. Git tree entries resolve links before rewriting. Selected pages
become internal links; unselected regular files/directories link to their fixed upstream SHA.
Missing targets and symlinks fail. The adapter requests site-root Markdown paths because VitePress
adds its configured deployment base. External HTTP(S) links are not fetched.

`src/ssg/vitepress/build.ts` copies trusted configuration from `site/vitepress/` into unique
`.generated/previews/run-*` roots and emits source hashes in `inputs.json`. Sites use
`/docs/{stable,next}/{en,ja}/`; comparison candidate names are no longer part of URLs.
The default build runs two edition builds using one upstream staging manifest and assembles a
fresh `combined-*/dist` artifact. Only static dist files enter it; source snapshots and provenance
reports remain outside deployment. Combined href/src and fragment validation runs after assembly,
so version links resolve across builds. No existing deployment or previous artifact is appended to.
Local translations/configs should not be edited during a build; generated snapshots record the
actual render input. This is a local Pages-path simulation, not an executed deployment.
`build.json` records validation and timings. Only successful runs update the local preview pointer.
The loopback preview server exposes static output without development middleware.
See the [development workflow](../contributing/development.md).

HTML validation checks expected pages, a single H1, local href/src targets, fragment IDs, nested
base containment, and absence of excluded output. Imported images remain unsupported: selected
assets, CSS URLs, and srcset validation require a later increment. Dependency changes and their verification should be recorded with the associated PoC increment.

## Translation boundary

Japanese translation sources belong to this repository. Missing translations and source changes
are distinct conditions; freshness must use file-level identity rather than a repository-wide commit.
The next manifest and each stable release's own manifest record edition, locale, canonical source path, checked source SHA-256,
and repository-owned translation path. A matching file hash means `current`, not human approval;
a changed hash means `source-changed` and renders a review warning while retaining the translation.
No record means `missing`; a declared but absent file is an error. Invalid paths, duplicate records,
and symlink/junction paths fail closed. Stable builds read the release's independent snapshot.
The [release preparation command](../operations/translations.md#transfer-between-editions)
copies missing destination translations while preserving their checked English hashes. Every edition uses the same freshness check.

Translations use the same restricted Markdown preparation as English, with relative links resolved
against the canonical source path. Each generated edition stores render-input snapshots and hashes,
translation paths, and checked source hashes in its inputs report. Do not automatically update the
checked hash when upstream changes; review the actual file difference first.

VitePress receives generated English fallback pages and a small trusted renderer wrapper for the
Japanese notice and `lang="en"` body. Imported HTML remains disabled. VitePress uses native same-page
language controls. Fallback body links retain the English locale; Japanese sidebar links remain
Japanese. Translated heading IDs may differ: language switching does not map section fragments.
See [localization evidence](../poc/localization.md) for current limitations.

## CI and publishing

PR CI has only `contents: read`, installs locked dependencies, checks types/tests, acquires public
source, stages both editions, then builds and validates both editions in English and Japanese. It does not
deploy. Manual main runs upload a complete verified artifact. Supplying the approved main SHA
enables a separate deployment job with scoped Pages/OIDC rights. See [deployment operations](../operations/deployment.md).

## Search and version navigation

Native local search is enabled per edition: VitePress's local provider builds locale indexes.
Combined assembly preserves these separate search assets rather than merging editions. Japanese fallback pages are indexed
at their Japanese routes, including their English bodies. Query probes and limitations are recorded
in [search evidence](../poc/search.md). This does not establish comprehensive Japanese search quality.

VitePress extends the default theme's nav-bar-content-before slot with a small Vue control.
The control remains in the upper navigation area on desktop and narrow screens. It shows the
current edition and links to each other edition's home in the current locale, regardless of the current document.
Full-page navigation avoids carrying separately built client state across editions. No document
mapping or fragment preservation is needed. This simple switch is the owner's required behavior,
not a compromise for missing features. Combined validation checks locale-home targets and header
placement across all published document and locale-home pages.

Publication changes and package README routes are documented in [publication operations](../operations/publication.md).

## Accepted SSG

The owner selected VitePress v2 on 2026-11-18; see [ADR 0001](../decisions/0001-use-vitepress-v2.md).
The implementation uses the exact `vitepress` package version `2.0.0-alpha.21`; the v1 coexistence
alias and Starlight implementation are removed. Historical comparison evidence remains under
`docs/poc/`. Upgrades require renewed checks of custom fallback rendering, Vue navigation, and
search-internal APIs. Selection does not grant production-launch approval.
