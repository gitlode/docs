# Development

## Environment and commands

Use Node.js 22.23.4, npm 11 (verified with 11.11.0), and Git on Windows or Linux. Node runs the
erasable TypeScript scripts directly; TypeScript 5.9.3 checks types separately. Build and preview
dependencies are local to this repository; no upstream package installation occurs.
`package-lock.json` is checked in. The Node patch upgrade supports current Astro dependencies.
With Volta, `volta run --node 22.23.4 npm run check` uses the selected runtime without changing
the global default; the same prefix works for installation, build, and preview commands.

```sh
npm ci --ignore-scripts
npm run check
npm run source:acquire
npm run content:stage
npm run previews:build
```

`source:acquire` needs outbound HTTPS to GitHub; `content:stage` is offline after acquisition.
Each successful stage prints a new directory with a manifest and 12 raw Markdown files (six per
edition). Inspect that manifest to identify exact inputs. Do not mistake staged Markdown for a built site.

## English comparison previews

`npm run previews:prepare` creates trusted candidate inputs from a single staging run. The default
edition is `next`. `npm run previews:build` prepares, builds, and validates both candidates, then
prints a unique `.generated/previews/run-*/` directory. `inputs.json` records identical source
hashes for both candidates; `build.json` adds output checks and measurements. A failed build does
not replace the `.generated/preview.json` pointer to the last successful build.

Run in separate terminals:

```sh
npm run preview:vitepress
npm run preview:starlight
```

Open `http://127.0.0.1:4173/docs/vitepress/next/en/` and
`http://127.0.0.1:4174/docs/starlight/next/en/`. Stop with Ctrl+C. The shared preview server serves
only built static files on loopback; it does not run either SSG's development server or watch files.
Rebuild after changes. Ports are fixed; stop an existing preview before starting another on that port.
`npm run previews:build -- stable` selects stable explicitly, but historical-source defects may
fail validation. It does not assemble a combined deployment or supply version switching.

The Starlight adapter uses Astro's unified processor explicitly. Imported files remain plain `.md`;
Starlight's transitive MDX dependency does not grant permission to import `.mdx`. SSG configuration
is maintained under `candidates/` and copied into each disposable build root.

## Development tooling conventions

Tooling alignment is bidirectional: both projects can benefit from each other's choices. Record
cross-project suggestions in `../proposals/` and continue authorized PoC work using the
current local configuration. See the [documentation lifecycle](../README.md) and the open
[environment feedback](../proposals/development-environment.md). Pending upstream
adoption is not a prerequisite for local development.

The reference is gitlode's development configuration at
[`90512564`](https://github.com/gitlode/gitlode/tree/90512564d76490088ecc99da7596128df1c45a2c):
root `package.json`, `.editorconfig`, `.oxfmtrc.json`, `.oxlintrc.json`, `tsconfig.base.json`,
and the contributor lint policy. Use it as a baseline when evolving this project.

- Use oxfmt for formatting (including import sorting) and oxlint for an explicit subset of
  correctness, ESM, and TypeScript rules. Adopted rules are errors; category presets are disabled.
- Run `npm run format:write` to format, `npm run format:check` to verify, and `npm run lint`
  to lint. `npm run lint:fix` applies supported fixes. Bare `npm run format` deliberately fails
  rather than ambiguously checking or modifying files, matching the upstream convention.
- EditorConfig uses UTF-8, LF, and two spaces, preserving significant Markdown trailing spaces.
  Generated content, dependencies, the lockfile, and the original kickoff attachment are excluded
  from formatting. The attachment is retained verbatim.
- `oxlint` uses upstream's 1.77.0 baseline. `oxfmt` uses 0.78.0: upstream's 0.62.0 pulled in
  tinypool versions flagged by npm audit (GHSA-5gmw-xhrv-c9v3 and GHSA-85c8-ppgw-ccpr).
  The newer formatter removes that dependency exposure in this installation.
- TypeScript keeps the validated 5.9.3 pin for this increment, strict NodeNext/no-emit checking,
  and additional upstream-style checks for unused bindings, returns, overrides, switch fallthrough,
  and filename casing. Upstream's declaration emission/project references serve its published
  monorepo; they are unnecessary here. `noUncheckedIndexedAccess` remains a follow-up rather than
  adding non-null assertions to JSON/regex handling solely to match configuration.
- Keep Node's built-in test runner for the small publishing pipeline. Vitest, Changesets,
  syncpack, bundling, package-publication checks, and architecture tooling can be added if a
  concrete need arises; the documentation service is not a published npm monorepo.
- Dependencies remain exact-pinned with a committed lockfile. `npm run lockfile:sync` follows
  the upstream lockfile-refresh convention. CI runs the same `npm run check` used locally.

Follow the [current handoff](../handoff/current.md) for the working branch and
integration instructions. Commit at practical work increments; do not merge automatically.

## Updating inputs

1. Resolve an explicitly chosen tag/branch using `git ls-remote --heads --tags https://github.com/gitlode/gitlode.git`.
2. For annotated tags, use the peeled `^{}` commit, not the tag object's SHA.
3. Update the requested ref and full commit in `config/sources.json` together.
4. Acquire, stage, inspect the diff and manifest, and run checks.

Use exact file paths in `config/publication.json`; adding to the sidebar is a separate edit in
`config/navigation.json`. Never follow all links or publish a whole repository to avoid failures.

## Validation

`npm run check` runs formatting validation, linting, type checking, and Node's test runner. Tests create isolated local Git fixtures
under `.generated/tests/`; they do not use the network. They verify immutable blob reads despite
dirty worktrees, provenance hashes, repeatability, excluded paths, missing files, invalid refs,
symlink blobs, output path containment, Markdown safety, route/link rewriting, and built HTML
validation failures. Generated test fixtures remain ignored for diagnosis.

`.github/workflows/docs.yml` performs these checks plus real upstream acquisition/staging on PRs,
main pushes, and manual runs, followed by both next-English builds and output validation. Hosted
execution has not yet been observed. See [preview evidence](../poc/english-previews.md) for local
checks and the remaining browser, localization, and deployment acceptance work.

## Troubleshooting

- Fetch failure: verify outbound HTTPS, the configured ref, and whether the pinned commit is still
  fetchable. The CLI exits nonzero; it does not silently use another branch or stale documents.
- Missing selected file: inspect that exact commit's tree; document a semantic replacement before
  editing selection. Do not silently skip required files.
- Git ownership errors: script Git calls use an invocation-scoped `safe.directory` for the exact
  selected directory. They do not modify global Git configuration.
- Unsafe generated directory: remove the symlink/junction manually after checking its target;
  do not bypass the containment check.
- To clear generated files, verify the absolute target is this checkout's `.generated` directory
  before deleting it. Do not delete upstream or user-authored translation files.

No environment secrets, deployment keys, or privileged GitHub credentials are needed locally.
