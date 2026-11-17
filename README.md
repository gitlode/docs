# gitlode documentation system

The long-lived documentation publishing repository for [gitlode](https://github.com/gitlode/gitlode).
Canonical English Markdown remains upstream; this repository owns publication, Japanese translations,
site implementation, and operations. Project documentation under `docs/` is not product-site content.

**Status:** English comparison previews implemented for VitePress and Astro Starlight, using the
same six real documents from the pinned next revision. Acquisition, Markdown preparation, HTML
validation, tests, and build CI are included. Japanese and combined stable/next deployment are next.
No SSG has been selected and no production deployment is enabled.

## Quick start

Requires Git, Node.js 22.23.4 (see `.node-version`), and npm 11.

```sh
npm ci
npm run check
npm run source:acquire
npm run content:stage
npm run previews:build
npm run previews:verify
```

Run `npm run preview:vitepress` and `npm run preview:starlight` in separate terminals, then open:

- VitePress: <http://127.0.0.1:4173/docs/vitepress/next/en/>
- Starlight: <http://127.0.0.1:4174/docs/starlight/next/en/>

These commands serve the last successful static build on loopback; rebuild after changing inputs.
See [English preview evidence and limitations](docs/poc/english-previews.md), including the remaining
VitePress dependency audit findings. These previews are not a production deployment.

Acquisition needs public GitHub access, without credentials. Staging is offline after acquisition.
The staging command prints a unique `.generated/staging/run-*/` directory containing both editions
and `manifest.json`. These are **raw selected inputs**, not safe-to-render website content.
All generated content is ignored by Git. No upstream scripts or Markdown are executed.

Sources approved by the owner: stable `gitlode@0.12.0`, next `integration/v0.13.0`.
Both are pinned in `config/sources.json`; changing a branch upstream does not change a build.

Start with the [documentation guide](docs/README.md) for durable knowledge, PoC work, handoffs,
and feedback proposals. See [development](docs/contributing/development.md), [architecture](docs/design/architecture.md),
[milestones and review gates](docs/poc/plan.md), and [evaluation evidence](docs/poc/evaluation.md).
