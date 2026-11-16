# English comparison previews

Status: implemented comparison increment; not a production-readiness or SSG-selection decision.
Observed: 2026-11-16, Asia/Tokyo. Maintainer: documentation project. Review authority: human owner.
Keep this evidence through SSG review; migrate accepted contracts into architecture docs afterwards.

## Reproduce

Use Node 22.23.4 and npm 11.11.0. Run `npm ci --ignore-scripts`, `npm run check`,
`npm run source:acquire`, and `npm run previews:build`. The build prints its generated run directory.
Inspect `inputs.json` for source hashes and `build.json` for measurements and validation results.
Preview commands and URLs are in [development](../contributing/development.md).

Both candidates use the six files in `config/publication.json` from next commit
`90512564d76490088ecc99da7596128df1c45a2c`. Preparation verifies every staged file's SHA-256 and
records the same hashes for both candidates. Upstream files are never modified. Stable acquisition
still works, but stable rendering and combined version assembly are not acceptance claims here.

## Version choices and operational limits

- VitePress 1.6.4, Astro 7.4.12, Starlight 0.43.1, and Astro markdown-remark 7.3.9 are pinned.
- Node was raised from 22.23.1 to 22.23.4 to meet current Astro/transitive engine requirements.
  Trying to retain the older runtime required older dependency lines with substantially more audit
  findings. No engine checks or peer-dependency checks were bypassed. This is a local choice;
  [cross-project environment feedback](../proposals/development-environment.md) remains nonblocking.
- Astro 7's Markdown default changed, so the adapter explicitly selects the unified processor
  supported by Starlight's Markdown pipeline. Only generated `.md` files enter the content loader.
- Search is disabled in Starlight and not enabled in VitePress for this increment. Search and
  Japanese behavior are not compared yet.
- Starlight reports an empty/missing i18n collection and no custom 404 entry. Built-in English UI
  and the generated 404 page work; these warnings will be revisited during localization. Do not
  mistake them for tested translation fallback. Owner: documentation maintainer.

## Observations and validation

Both outputs contain six product-document pages, one generated landing page, and the SSG's 404 page.
Output validation checks all local href/src references, fragments, nested-base containment, expected
pages, exactly one H1 per product page, and excluded agent/handoff output. Candidate-specific checks
compare sidebar links, TOC presence for H2/H3 documents, original fenced-code text, and GFM table counts.
These static checks do not prove all interactive/mobile behavior or accessibility.

One verified Windows build (Node 22.23.4, npm 11.11.0; run `run-m6IuyT`) recorded:

| Candidate | CLI build wall time | Static output bytes | HTML files | Validated local references |
| --------- | ------------------- | ------------------- | ---------- | -------------------------- |
| VitePress | 4,153 ms            | 1,656,042           | 8          | 261                        |
| Starlight | 5,030 ms            | 671,405             | 8          | 485                        |

These are single-run supporting measurements with search disabled, not a performance ranking.
Both candidates passed code comparisons for 38 blocks and table-count checks for 19 tables across
the six documents. Code comparisons normalize line endings and surrounding whitespace; they are
not byte comparisons of rendered HTML. Every document's sidebar contains all six configured links.
TOC navigation exists for the documents with a total of 107 source H2/H3 headings; individual local
anchors are covered separately by link validation.

HTTP probes returned 200 for usage and plugin pages on both servers and 404 for unknown routes and
out-of-base `/.git/config` requests. Edge headless screenshots at 1440×1000 were inspected: both
usage pages show the title, readable content, sidebar, and page TOC. Screenshots are local generated
artifacts (`.generated/previews/run-m6IuyT/vitepress.png` and `starlight.png`), not committed assets.
Mobile layouts, keyboard interaction, clipboard behavior, and client-side navigation after clicks
still require broader manual review. Hosted CI has not been run in this session.

The first VitePress build exposed incorrect handling of already-prefixed base URLs. Supplying
site-root paths to VitePress and full base paths to Starlight fixed the discrepancy; the output
checker catches both missing targets and accidental double prefixes. The first Starlight output
also exposed a missing default favicon, now supplied as a trusted site-owned SVG.

Shared preparation resolves README directories against the Git tree. Unselected Markdown, YAML,
and handoff links point to fixed upstream blob/tree URLs instead of expanding publication. Both
SSGs render the original TypeScript snippets and CLI placeholders from the selected corpus.
Starlight needs generated title frontmatter and H1 removal; VitePress keeps the original H1.

Code comparison caught Starlight's Expressive Code extracting `// my-plugin.js` into a filename
tab and removing that line from the code body. The adapter disables filename extraction and
terminal-comment removal on copy, preserving source examples. The checker reconstructs Expressive
Code's line-div structure before comparing code text, including blank lines and indentation.

## Markdown safety and remaining scope

Inputs with raw HTML/components, upstream frontmatter, active Vue interpolation, file includes,
snippet directives, custom containers, or code-fence metadata fail closed. Includes are checked
before parsing, even in fences. Titles and generated landing links are checked too. This is a
deliberately constrained corpus policy, not a general Markdown/HTML sanitizer. Tests include hostile
syntax and preserve fenced-code values. Normalized Markdown formatting is confined to generated files.

There are no images in this six-file corpus. Imported image syntax is rejected pending explicit asset
selection. Local HTML href/src assets are validated, but CSS URLs and srcset are not yet checked.
External links are rewritten/retained without network availability or upstream-fragment checks.

## Dependency audit follow-up

The final installation reports three affected packages: VitePress, its Vite dependency, and esbuild
(two moderate and one high severity package entries). Stable VitePress 1.6.4 declares Vite 5;
overriding it to a different major is not a supported routine update. Its next release is an alpha,
which would change the comparison's stability assumptions. Current Astro's earlier critical findings
are absent after the runtime/dependency update.

The known Vite/esbuild advisories include development-server file access and editor endpoint issues.
This project builds static output and uses a separate sirv server bound to `127.0.0.1`, with Host
validation; no Vite development/editor middleware is started by the documented commands. This limits
exposure but does not mean the dependencies are vulnerability-free. Before production acceptance,
recheck the audit and choose a maintained release or explicitly reviewed remediation. Owner:
documentation maintainer; review condition: SSG selection and before production hardening.

Primary references: [VitePress Markdown compilation](https://github.com/vuejs/vitepress/blob/v1.6.4/src/node/markdownToVue.ts),
[VitePress includes](https://github.com/vuejs/vitepress/blob/v1.6.4/src/node/utils/processIncludes.ts),
[Starlight authoring](https://starlight.astro.build/guides/authoring-content/),
[Astro processors](https://docs.astro.build/en/guides/markdown-content/#markdown-processors),
[esbuild advisory](https://github.com/advisories/GHSA-67mh-4wv8-2f99),
[Vite editor advisory](https://github.com/advisories/GHSA-587h-7wmj-h5pm).
