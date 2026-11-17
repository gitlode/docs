# Architecture

## Ownership and flow

`gitlode/gitlode` owns canonical English documents. This repository owns selection, acquisition,
staging, candidate adapters, Japanese translation sources, validation, and publishing.
Its own `docs/` directory is never automatically published as product documentation.

Current flow: `config/sources.json` -> Git object acquisition -> explicit allowlist -> byte-preserving
staging/provenance -> shared Markdown preparation -> candidate adapters -> English/Japanese static builds
and output validation. Stable/next artifact assembly is implemented locally; the human SSG decision and deployment remain pending.

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

`config/publication.json` enumerates six exact Markdown paths, independently of the proposed
sidebar groups in `config/navigation.json`. Both renderers consume the validated navigation subset.
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

Both adapters use directory routes (`usage.md` -> `usage/`, `design/README.md` -> `design/`).
Starlight receives generated title frontmatter and the body without its original H1; VitePress
keeps that H1. Git tree entries resolve links before any rewriting. Selected pages become internal
links; unselected regular files/directories link to their fixed upstream SHA. Missing targets and
symlinks fail. VitePress receives site-root Markdown paths because it adds the configured base;
Starlight receives paths including its base. External HTTP(S) links are not fetched.

`previews.ts` owns candidate staging and build orchestration. Each run copies trusted configurations
from `candidates/` into unique generated roots and emits matching source hashes in `inputs.json`.
Sites use `/docs/<candidate>/{stable,next}/{en,ja}/`. The default build assembles all four
edition/candidate builds into a fresh `combined-*/dist` artifact using one upstream staging manifest.
Only static dist files enter it; source snapshots and provenance reports remain outside deployment.
Combined href/src and fragment validation runs after assembly, so version links can resolve across
builds. No existing deployment or previous artifact is appended to. Local translations/configs
should not be edited during a build; their generated snapshots record the actual render input.
This is a local Pages-path simulation, not an executed deployment. `build.json` records validation and timings. Only successful runs
update the local preview pointer. The loopback preview server exposes static output, without SSG
development middleware. See the [development workflow](../contributing/development.md).

HTML validation checks expected pages, a single H1, local href/src targets, fragment IDs, nested
base containment, and absence of excluded output. Imported images remain unsupported: selected
assets, CSS URLs, and srcset validation require a later increment. The small favicon is a trusted
site-owned asset. Known dependency findings are tracked in [PoC evidence](../poc/english-previews.md).

## Translation boundary

Japanese translation sources belong to this repository. Missing translations and source changes
are distinct conditions; freshness must use file-level identity rather than a repository-wide commit.
`translations/manifest.json` records edition, locale, canonical source path, checked source SHA-256,
and repository-owned translation path. A matching file hash means `current`, not human approval;
a changed hash means `source-changed` and renders a review warning while retaining the translation.
No record means `missing`; a declared but absent file is an error. Invalid paths, duplicate records,
and symlink/junction paths fail closed. Stable never silently uses next translations.

Translations use the same restricted Markdown preparation as English, with relative links resolved
against the canonical source path. Each generated candidate stores render-input snapshots and hashes,
translation paths, and checked source hashes in its inputs report. Do not automatically update the
checked hash when upstream changes; review the actual file difference first.

Starlight generates missing Japanese routes, notice, and English content-language markup natively.
VitePress receives generated English fallback pages and a small trusted renderer wrapper for the
Japanese notice and `lang="en"` body. Imported HTML remains disabled. Both use native same-page
language controls. Fallback body links retain the English locale; Japanese sidebar links remain
Japanese. Translated heading IDs may differ: language switching does not map section fragments.
See [localization evidence](../poc/localization.md) for current limitations.

## CI and future publishing

PR CI has only `contents: read`, installs locked dependencies, checks types/tests, acquires public
source, stages both editions, then builds and validates both candidates and editions in English and Japanese. It does not
deploy. Production must assemble one complete artifact (never append a version
to an existing Pages deployment), then deploy through a trusted job with scoped Pages/OIDC rights.

## Version navigation

Native local search is enabled per edition: VitePress's local provider builds locale indexes;
Starlight builds Pagefind indexes from each edition's static HTML. Combined assembly preserves
these separate search assets rather than merging editions. Japanese fallback pages are indexed
at their Japanese routes, including their English bodies. Query probes and limitations are recorded
in [search evidence](../poc/search.md). This does not establish comprehensive Japanese search quality.

VitePress extends the default theme's nav-bar-content-before slot with a small Vue control.
Starlight wraps LanguageSelect with an Astro control, placing it beside the language selector in
both the desktop header and the theme's mobile preferences menu. Both show the current edition
and link to the other edition's home in the current locale, regardless of the current document.
Full-page navigation avoids carrying separately built client state across editions. No document
mapping or fragment preservation is needed. This simple switch is the owner's required behavior,
not a compromise for missing features. Combined validation checks locale-home targets and header
placement across all 56 document/locale-home pages.

The owner accepted external GitHub links for documents outside the six-document PoC scope.
Production must address internal documentation references before launch, without automatically
publishing arbitrary linked files. See the PoC evaluation for the deferred acceptance item.
