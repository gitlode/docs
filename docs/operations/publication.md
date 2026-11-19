# Change the publication scope

Edit `config/publication.json` using exact upstream paths. Put documents shared by both
editions in `files`. Use `additionalFiles.stable` and `additionalFiles.next` for
edition-specific documents. For example, the two telemetry guides belong only to next.
To withdraw a shared guide from next, move its entry from `files` to `additionalFiles.stable`.

Each edition must have at least one selected document. The supported sources are the CLI
and plugin package READMEs, usage and profiling guides, and Markdown under the CLI design
and contributing directories. Agent and handoff material is excluded. Package READMEs appear
at `packages/<package-name>/` under each locale. The section README and a link to its
directory resolve to the same route. Other selected guides use their source-relative route.

Edit `config/navigation.json` separately to list a guide in the sidebar. A group applies to
both editions by default. Add `"editions": ["next"]` to a next-only group. Each sidebar entry
must already be selected for every edition that displays it.

Check the file at each applicable pin and review incoming links and translation records.
Relative links to published documents become site links; other existing files and directories
remain links to the pinned upstream revision. Imported images remain unsupported. Run
`npm run check`, then follow the [edition build and verification procedure](editions.md).
Review additions and removals in both locales and check the resulting navigation and fragments.
