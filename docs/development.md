# Development

## Environment and commands

Use Node.js 22.23.1, npm 11 (verified with 11.11.0), and Git on Windows or Linux. Node runs the
erasable TypeScript scripts directly; TypeScript 5.9.3 checks types separately. There is no runtime
dependency or upstream package installation. `package-lock.json` is checked in.

```sh
npm ci --ignore-scripts
npm run check
npm run source:acquire
npm run content:stage
```

`source:acquire` needs outbound HTTPS to GitHub; `content:stage` is offline after acquisition.
Each successful stage prints a new directory with a manifest and 12 raw Markdown files (six per
edition). Inspect that manifest to identify exact inputs. No preview commands exist yet; see
[the next milestone](plan.md). Do not mistake staged Markdown for a built site.

## Development tooling conventions

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

Work on `work/initial-poc` and commit at practical work increments. The owner intends a squash
merge into `main`; intermediate commits need not be release-ready. Do not merge automatically.

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
symlink blobs, and output path containment. Generated test fixtures remain ignored for diagnosis.

`.github/workflows/docs.yml` performs these checks plus real upstream acquisition/staging on PRs,
main pushes, and manual runs. Hosted execution has not yet been observed. Rendering, browser QA,
Pages paths, link/asset checks, Japanese fallback, and build measurements remain future checks.

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
