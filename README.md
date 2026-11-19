# gitlode documentation system

This repository builds and publishes the [gitlode documentation](https://gitlode.github.io/docs/) on GitHub Pages in English and Japanese for the stable and next editions. The English source documents live in the [gitlode repository](https://github.com/gitlode/gitlode). This repository maintains the Japanese translations and determines which documents appear on the site.

## For documentation maintainers

- [Update an edition](docs/operations/editions.md) when promoting a release or updating the development version.
- [Manage publication and navigation](docs/operations/publication.md) to select documents and arrange the sidebar.
- [Maintain translations](docs/operations/translations.md) to add, review or carry Japanese translations between editions.
- [Publish and recover the site](docs/operations/deployment.md) to deploy a reviewed revision, verify it on GitHub Pages or restore a previous release.

## For documentation system developers

Start with the [architecture](docs/design/architecture.md) to understand how upstream documents become published pages. The [development guide](docs/contributing/development.md) covers local setup, builds, preview and tests.

The [documentation index](docs/README.md) also links to design decisions and project history.
