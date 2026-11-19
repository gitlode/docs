# Change the publication scope

Edit the target edition's `config/<edition>/publication.json` using exact upstream paths.
Each file contains its edition's complete selection. For example, the two telemetry guides
are present only in next. Review the target edition's sidebar and incoming links when removing a guide.

Each edition must have at least one selected document. The supported sources are the CLI
and plugin package READMEs, usage and profiling guides, and Markdown under the CLI design
and contributing directories. Agent and handoff material is excluded. Package READMEs appear
at `packages/<package-name>/` under each locale. The section README and a link to its
directory resolve to the same route. Other selected guides use their source-relative route.

Edit `config/<edition>/navigation.json` to change group labels, group order and page order
within that edition. Each listed document must belong to the same edition's publication list.
Follow the [stable release policy](editions.md#stable-release-policy) for released navigation.

Check the file at each applicable pin and review incoming links and translation records.
Relative links to published documents become site links; other existing files and directories
remain links to the pinned upstream revision. Imported images remain unsupported. Run
`npm run check`, then follow the [edition build and verification procedure](editions.md).
Review additions and removals in both locales and check the resulting navigation and fragments.
