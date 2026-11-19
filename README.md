# gitlode documentation system

The long-lived documentation publishing repository for [gitlode](https://github.com/gitlode/gitlode).
Canonical English Markdown remains upstream; this repository owns publication, Japanese translations,
site implementation, and operations. Project documentation under `docs/` is not product-site content.

**Status:** VitePress v2 is selected and the implementation is consolidated on
`2.0.0-alpha.21`. The six-document PoC supports English/Japanese, stable/next, local search,
and complete artifact validation. No production deployment is enabled.
See [the accepted decision](docs/decisions/0001-use-vitepress-v2.md),
[PoC closeout](docs/poc/closeout.md), and the [production-readiness handoff](docs/handoff/production-readiness.md).

## Quick start

Requires Git, Node.js 22.23.4 (see `.node-version`), and npm 11.

```sh
npm ci --ignore-scripts
npm run check
npm run source:acquire
npm run content:stage
npm run site:build
npm run site:verify
npm run search:verify
npm run preview
```

Open <http://127.0.0.1:4173/docs/next/en/> or
<http://127.0.0.1:4173/docs/next/ja/>. Stop the preview with Ctrl+C.
The preview serves the last successful static build on loopback; rebuild after changing inputs.
The bounded verification commands close their own temporary listeners automatically.
These previews simulate the Pages path; they do not deploy the site.

SSG-independent publication processing lives in `src/publishing/`; VitePress orchestration and
checks live in `src/ssg/vitepress/`; trusted site configuration and Vue theme code live in
`site/vitepress/`. See [architecture](docs/design/architecture.md) for these boundaries.

Acquisition needs public GitHub access, without credentials. Staging is offline after acquisition.
The staging command prints a unique `.generated/staging/run-*/` directory containing both editions
and `manifest.json`. These are **raw selected inputs**, not safe-to-render website content.
All generated content is ignored by Git. No upstream scripts or Markdown are executed.

Sources approved by the owner: stable `gitlode@0.12.0`, next `integration/v0.13.0`.
Both are pinned in `config/<edition>/source.json`; changing a branch upstream does not change a build.

Start with the [documentation guide](docs/README.md) for durable knowledge, PoC work, handoffs,
and feedback proposals. See [development](docs/contributing/development.md), [architecture](docs/design/architecture.md),
[milestones and review gates](docs/poc/plan.md), and [evaluation evidence](docs/poc/evaluation.md).
