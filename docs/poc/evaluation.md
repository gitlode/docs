# Comparative PoC evidence

Status: baseline acquisition evidence only. Rendering comparison is **not yet performed**.
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

- Node 22.23.1 / npm 11.11.0 on Windows.
- Locked clean installation (`npm ci --ignore-scripts`) succeeded.
- `npm run check`: type check and eight meaningful automated tests passed.
- `npm run source:acquire`: fetched and verified both approved refs/pins.
- `npm run content:stage`: staged six byte-preserved documents for each edition and emitted provenance.
- Only selected Markdown enters staging; agent/handoff files are excluded by validation.
- Remote CI, clean-clone execution on another machine, and HTML output remain unverified.

## Comparison to collect

| Criterion               | VitePress       | Astro Starlight | Required evidence                                                  |
| ----------------------- | --------------- | --------------- | ------------------------------------------------------------------ |
| Rendering fidelity      | Not tested      | Not tested      | Same manifest; headings, tables, TypeScript fences, angle brackets |
| Navigation/TOC          | Not tested      | Not tested      | Sidebar subset; per-page headings; README routes                   |
| Markdown safety         | Not implemented | Not implemented | Active HTML, expressions, includes and MDX fixtures                |
| Japanese/missing pages  | Not tested      | Not tested      | Owned translated page; missing translation; language navigation    |
| Stable/next Pages paths | Not tested      | Not tested      | Complete artifact under nested base; link/asset validation         |
| Local search            | Not tested      | Not tested      | English/Japanese sample queries; index scope                       |
| Maintenance cost        | Not measured    | Not measured    | Actual transformations and dependencies; warnings/workarounds      |
| Build performance/size  | Not measured    | Not measured    | Commands, runtime, duration, artifact bytes                        |

VitePress explicitly compiles Markdown as Vue components, so untrusted source must be constrained
before rendering ([official guide](https://vitepress.dev/guide/using-vue)). Its Markdown extensions
also support file inclusion ([official guide](https://vitepress.dev/guide/markdown)). These are
implementation constraints, not observed defects in the gitlode corpus.

No evidence currently supports choosing either SSG. Keep the [decision proposal](ssg-proposal.md)
open until both previews and their validation results exist. All PoC exit criteria involving rendered
sites, localization, Pages simulation, and a recommendation remain incomplete.
