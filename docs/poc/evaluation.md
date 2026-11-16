# Comparative PoC evidence

Status: English comparison previews implemented. Full PoC comparison is still incomplete.
Observation date: 2026-11-16, Asia/Tokyo.

## Verified inputs

| Edition | Requested ref                    | Exact commit                               |
| ------- | -------------------------------- | ------------------------------------------ |
| Stable  | `refs/tags/gitlode@0.12.0`       | `76b124e23fcc069be1278629cf01b62ae1456c7a` |
| Next    | `refs/heads/integration/v0.13.0` | `90512564d76490088ecc99da7596128df1c45a2c` |

Both contain all six kickoff corpus paths without substitutions. `config/publication.json`
is the exact list. The next tree contains telemetry design material absent from stable, confirming
that the two refs are meaningful distinct source snapshots. No canonical source was modified.
The design README links to other durable docs and `../handoff/`, so directory landing pages must
exercise links outside the allowlist. Those targets must not be automatically published.

## Local evidence

- Node 22.23.4 / npm 11.11.0 on Windows for the preview increment.
- Locked clean installation (`npm ci --ignore-scripts`) succeeded.
- `npm run check`: formatting, lint, type checks, and publishing/Markdown/output fixture tests.
- `npm run source:acquire`: fetched and verified both approved refs/pins.
- `npm run content:stage`: staged six byte-preserved documents for each edition and emitted provenance.
- Only selected Markdown enters staging; agent/handoff files are excluded by validation.
- `npm run previews:build`: both next-English sites and generated output checks pass.
- [English preview evidence](english-previews.md) records commands, versions, observations, and limitations.
- Remote CI and clean-clone execution on another machine remain unverified.

## Comparison to collect

| Criterion               | VitePress                               | Astro Starlight                         | Required evidence                                                    |
| ----------------------- | --------------------------------------- | --------------------------------------- | -------------------------------------------------------------------- |
| Rendering fidelity      | Static checks pass                      | Static checks pass                      | Same source hashes; code-block text and table counts checked         |
| Navigation/TOC          | Static checks pass                      | Static checks pass                      | Sidebar links, TOC presence, single H1, README routes and fragments  |
| Markdown safety         | Shared validation + disabled extensions | Shared validation + plain Markdown      | Includes, active HTML, interpolation, unsafe URL and image rejection |
| Japanese/missing pages  | Not tested                              | Not tested                              | Owned translated page; missing translation; language navigation      |
| Stable/next Pages paths | Next-English nested base passes         | Next-English nested base passes         | Combined artifact and version navigation still pending               |
| Local search            | Not tested                              | Not tested                              | English/Japanese sample queries; index scope                         |
| Maintenance cost        | Small config; base-specific URLs        | Small config; frontmatter/H1 adaptation | Long-term assessment pending; dependency findings recorded           |
| Build performance/size  | Recorded in build.json                  | Recorded in build.json                  | Single-run supporting evidence, not a benchmark                      |

VitePress explicitly compiles Markdown as Vue components, so untrusted source must be constrained
before rendering ([official guide](https://vitepress.dev/guide/using-vue)). Its Markdown extensions
also support file inclusion ([official guide](https://vitepress.dev/guide/markdown)). These are
implementation constraints, not observed defects in the gitlode corpus.

The English increment alone does not support final SSG selection. Keep the [decision proposal](ssg-proposal.md)
open through localization, multi-version assembly, and human usability review. Those scenarios,
the recommendation, hosted CI verification, and PoC exit approval remain incomplete.
