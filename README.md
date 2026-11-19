# gitlode documentation system

The long-lived documentation publishing repository for [gitlode](https://github.com/gitlode/gitlode).
Canonical English Markdown remains upstream; this repository owns publication, Japanese translations,
site implementation, and operations. Project documentation under `docs/` is not product-site content.

The [production site](https://gitlode.github.io/docs/) serves English and Japanese documentation for stable and next.

| Maintainer task                          | Guide                                                                                                    |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Update a source pin or promote a release | [Edition operations](docs/operations/editions.md)                                                        |
| Select documents or reorder the sidebar  | [Publication operations](docs/operations/publication.md)                                                 |
| Add, review or transfer a translation    | [Translation operations](docs/operations/translations.md)                                                |
| Publish, verify or recover the site      | [Deployment and recovery](docs/operations/deployment.md)                                                 |
| Change the publishing system             | [Development workflow](docs/contributing/development.md) and [architecture](docs/design/architecture.md) |

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

Each edition's source ref and pinned commit are in `config/<edition>/source.json`.

The [documentation guide](docs/README.md) indexes operating procedures, design decisions and historical evidence.
