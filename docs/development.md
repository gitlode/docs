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

## Updating inputs

1. Resolve an explicitly chosen tag/branch using `git ls-remote --heads --tags https://github.com/gitlode/gitlode.git`.
2. For annotated tags, use the peeled `^{}` commit, not the tag object's SHA.
3. Update the requested ref and full commit in `config/sources.json` together.
4. Acquire, stage, inspect the diff and manifest, and run checks.

Use exact file paths in `config/publication.json`; adding to the sidebar is a separate edit in
`config/navigation.json`. Never follow all links or publish a whole repository to avoid failures.

## Validation

`npm run check` runs type checking and Node's test runner. Tests create isolated local Git fixtures
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
