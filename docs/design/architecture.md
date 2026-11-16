# Architecture

## Ownership and flow

`gitlode/gitlode` owns canonical English documents. This repository owns selection, acquisition,
staging, candidate adapters, future Japanese translation sources, validation, and publishing.
Its own `docs/` directory is never automatically published as product documentation.

Current flow: `config/sources.json` -> Git object acquisition -> explicit allowlist -> byte-preserving
staging -> provenance manifest. Next: staged copies -> independent candidate adapters -> two static
previews -> human SSG decision -> complete stable/next Pages artifact.

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
sidebar groups in `config/navigation.json`. The navigation config is validated but is not yet
consumed by a renderer. Missing selected files are errors. Agent/handoff content, arbitrary roots,
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
Do not execute or serve it yet. The next milestone must constrain active HTML, Vue expressions,
SSG includes, and other executable extensions before introducing rendering. Markdown code fences
and plain TypeScript syntax must remain faithful. Do not build a universal Markdown AST framework.

Candidate adapters own frontmatter/H1 handling, README routing, locale configuration, and SSG
navigation. Shared preprocessing owns selection and link/asset inventory. Internal links must
remain inside the Pages base; unselected targets may link to their fixed upstream SHA. Assets are
not yet copied; asset validation and link rewriting are pending and must precede site acceptance.

## Translation boundary

Japanese translation sources belong to this repository. Missing translations and source changes
are distinct conditions; freshness must use file-level identity rather than a repository-wide commit.
Stable content must not silently use next translations. The unimplemented metadata design is tracked
in the [PoC proposal](../poc/translation-metadata.md).

## CI and future publishing

PR CI has only `contents: read`, installs locked dependencies, checks types/tests, acquires public
source, and stages both editions. It does not deploy. Once adapters exist, add both builds and
static output validation. Production must assemble one complete artifact (never append a version
to an existing Pages deployment), then deploy through a trusted job with scoped Pages/OIDC rights.
