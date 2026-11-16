# gitlode documentation system

The long-lived documentation publishing repository for [gitlode](https://github.com/gitlode/gitlode).
Canonical English Markdown remains upstream; this repository owns publication, Japanese translations,
site implementation, and operations. Project documentation under `docs/` is not product-site content.

**Status:** kickoff increment implemented: pinned acquisition, explicit selection, provenance, tests,
and validation CI. VitePress and Astro Starlight previews are the next milestone, not yet implemented.
No SSG has been selected and no production deployment is enabled.

## Quick start

Requires Git, Node.js 22.23.1 (see `.node-version`), and npm 11.

```sh
npm ci
npm run check
npm run source:acquire
npm run content:stage
```

Acquisition needs public GitHub access, without credentials. Staging is offline after acquisition.
The staging command prints a unique `.generated/staging/run-*/` directory containing both editions
and `manifest.json`. These are **raw selected inputs**, not safe-to-render website content.
All generated content is ignored by Git. No upstream scripts or Markdown are executed.

Sources approved by the owner: stable `gitlode@0.12.0`, next `integration/v0.13.0`.
Both are pinned in `config/sources.json`; changing a branch upstream does not change a build.

See [development](docs/development.md), [architecture](docs/architecture.md),
[milestones and review gates](docs/plan.md), and [evaluation evidence](docs/evaluation.md).
