# Architecture

## Ownership and flow

`gitlode/gitlode` owns canonical English documents. This repository owns selection, acquisition,
staging, candidate adapters, future Japanese translation sources, validation, and publishing.
Its own `docs/` directory is never automatically published as product documentation.

Current flow: `config/sources.json` -> Git object acquisition -> explicit allowlist -> byte-preserving
staging/provenance -> shared Markdown preparation -> candidate adapters -> two English static builds
and output validation. Localization, complete stable/next artifact assembly, and the human SSG
decision remain subsequent milestones.

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
The two next-English sites use `/docs/<candidate>/next/en/`; this is a nested-path simulation, not
a combined Pages deployment. `build.json` records validation and timings. Only successful runs
update the local preview pointer. The loopback preview server exposes static output, without SSG
development middleware. See the [development workflow](../contributing/development.md).

HTML validation checks expected pages, a single H1, local href/src targets, fragment IDs, nested
base containment, and absence of excluded output. Imported images remain unsupported: selected
assets, CSS URLs, and srcset validation require a later increment. The small favicon is a trusted
site-owned asset. Known dependency findings are tracked in [PoC evidence](../poc/english-previews.md).

## Translation boundary

Japanese translation sources belong to this repository. Missing translations and source changes
are distinct conditions; freshness must use file-level identity rather than a repository-wide commit.
Stable content must not silently use next translations. The unimplemented metadata design is tracked
in the [PoC proposal](../poc/translation-metadata.md).

## CI and future publishing

PR CI has only `contents: read`, installs locked dependencies, checks types/tests, acquires public
source, stages both editions, then builds and validates both next-English candidates. It does not
deploy. Production must assemble one complete artifact (never append a version
to an existing Pages deployment), then deploy through a trusted job with scoped Pages/OIDC rights.
