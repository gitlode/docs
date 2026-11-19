# Development

## Environment and commands

Use Node.js 22.23.4, npm 11 (verified with 11.11.0), and Git on Windows or Linux. Node runs the
erasable TypeScript scripts directly; TypeScript 5.9.3 checks types separately. Build and preview
dependencies are local to this repository; no upstream package installation occurs.
`package-lock.json` is checked in. The runtime remains pinned after removing the comparison-only dependencies.
With Volta, `volta run --node 22.23.4 npm run check` uses the selected runtime without changing
the global default; the same prefix works for installation, build, and preview commands.

```sh
npm ci --ignore-scripts
npm run check
npm run source:acquire
npm run content:stage
npm run site:build
```

`source:acquire` needs outbound HTTPS to GitHub; `content:stage` is offline after acquisition.
Each successful stage prints a new directory with a manifest and 12 raw Markdown files (six per
edition). Inspect that manifest to identify exact inputs. Do not mistake staged Markdown for a built site.

## Site builds and preview

`npm run site:prepare` creates trusted VitePress inputs for `next` without building a site.
`npm run site:build` defaults to both editions, then prints a unique
`.generated/previews/combined-*/dist` complete artifact mounted at `/docs/`. The two builds share
one upstream staging manifest. Each edition retains its own report: `inputs.json` records source
and translation provenance; `build.json` adds output checks and measurements. A failed build does
not replace the `.generated/preview.json` pointer to the last successful build.

```sh
npm run preview
```

Open `http://127.0.0.1:4173/docs/next/en/` or `http://127.0.0.1:4173/docs/next/ja/`.
Stop with Ctrl+C. The preview server serves built static files on loopback; it does not run the
VitePress development server or watch files. Rebuild after changes. The preview port is fixed;
stop an existing preview before starting another on port 4173.

The language selector switches the current page. The header version links preserve the current
locale and open the target edition home with a full reload, without retaining the current document
or fragment. Stable has no owned translations in this corpus and uses English fallback. The next
Profiling Guide has the Japanese example; the other five next documents demonstrate fallback.

`npm run site:build -- stable` or `-- next` creates a single-edition diagnostic build without
version controls. Run the default build again to restore the complete preview. The complete
artifact includes both editions/locales, an edition/language landing, 404 and `.nojekyll`.
This is a Pages-path simulation; nothing is deployed. Old candidate-prefixed URLs and `preview:*`
commands are retired. Rebuild before previewing outputs created by the former comparison pipeline.

## Code organization

Keep SSG-independent acquisition, staging, Markdown processing, translations, static serving, and
HTML reference validation in `src/publishing/`. `content.ts` returns prepared content and metadata
without generating framework files. Keep VitePress build assembly and checks that depend on its
rendered markup or search APIs in `src/ssg/vitepress/`. `src/cli/site.ts` composes that adapter.
Trusted VitePress config, metadata types, and Vue theme code live in `site/vitepress/` and are
copied into disposable generated roots. All generated inputs and output stay under `.generated/`.
Do not import VitePress into the publication domain. See [architecture](../design/architecture.md).

## Verification process lifecycle

For automated HTTP checks, use `npm run site:verify` after building. It starts a static
server inside one Node process on an OS-assigned port, checks representative responses with
five-second request timeouts, and closes all owned listeners and connections in `finally`.
It does not compete for the developer's fixed port 4173. The reusable server utility also handles
partial startup failures. Regression tests confirm ports can be rebound after successful
checks, failed checks, and partial startup failures; unrelated listeners are left alone.

The manual `preview` command keeps serving until interrupted. Its CLI handles SIGINT/SIGTERM and
waits for server closure. A forced termination or a terminated shell wrapper is not proof that its
children stopped; signal behavior varies across operating systems and launch tools.

For every agent-owned long-running verification process, including browsers and other future PoC
tools, follow this procedure:

1. Prefer a finite command with timeouts and `try/finally` cleanup. For custom checks, use
   `withPreviews` from `src/publishing/preview-server.ts` and await all work inside its callback.
2. If a separate process is necessary, record its PID, executable/command line, start time, tool
   session, and owned ports. Use an isolated browser profile and wait for browser exit too.
3. On success, failure, interruption, or handoff, close/stop the owned processes and await exit.
   A tool session reporting completion is not sufficient, especially with npm/Volta/shell wrappers.
4. Verify the actual child PID is gone and owned listener ports are free. On Windows, use
   `Get-NetTCPConnection` and `Get-CimInstance Win32_Process` from the host context when the sandbox
   cannot see host processes. Recheck identity before stopping a leftover process; never kill by
   port number alone, and never stop an unrelated developer process.
5. Report any cleanup failure explicitly. Leave a server running only when the user has requested
   it, with its URL and stop instructions. Otherwise complete cleanup before the final response.

This procedure applies beyond preview servers. Do not rely solely on signal handlers: they cannot
run after an uncatchable process kill. Bounded checks minimize the chance of orphaned processes.

## Development tooling conventions

Prefer TypeScript where the framework provides useful type information, including VitePress
configuration, theme entry points, and Vue SFC scripts (`script setup lang="ts"`). Do not force
migration when useful type support is absent. `npm run typecheck` checks the pipeline with `tsc`
and the VitePress configuration/theme/templates with `vue-tsc`. The site uses Bundler module
resolution to match Vite; the publishing scripts retain NodeNext. Generated site metadata has a
shared TypeScript interface and reaches Vue through typed theme data. The JSON input is trusted
pipeline output, not a runtime-validated external API. Vue is a direct pinned development dependency
because the theme imports it; vue-tsc supplies SFC/template type checking.

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
3. Update the requested ref and full commit in `config/<edition>/source.json` together.
4. Acquire the pin. For a new stable release run `npm run translations:prepare-stable`.
   Stage, inspect the diff and manifest, and run checks.

Use exact file paths in `config/<edition>/publication.json`; adding to the sidebar is a separate edit in
`config/<edition>/navigation.json`. Never follow all links or publish a whole repository to avoid failures.

## Validation

`npm run search:verify` probes the built native local search indexes after a complete two-edition
build. It executes 32 queries (eight queries across two editions and two locales) using MiniSearch,
VitePress's tokenizer, and default UI query options. It runs in Node, not a browser or simulated
search UI. It checks that the served index assets match the built files, records query results in
the generated run's `search.json`, verifies result scope and destinations/fragments, and closes its
ephemeral static server. Missing matches for Japanese substrings are observations rather than build
failures. Historical comparisons and limitations remain in [search evidence](../poc/search.md) and
[three-candidate evidence](../poc/three-candidates.md).

The probe intentionally depends on the pinned VitePress index format and internal tokenizer API.
Revisit it when upgrading. MiniSearch is explicitly pinned to the installed VitePress dependency
version because the probe imports it directly. No external search service, tokenizer customization,
or cross-version index aggregation is configured.

`npm run check` runs formatting validation, linting, type checking, and Node's test runner. Tests create isolated local Git fixtures
under `.generated/tests/`; they do not use the network. They verify immutable blob reads despite
dirty worktrees, provenance hashes, repeatability, excluded paths, missing files, invalid refs,
symlink blobs, output path containment, Markdown safety, route/link rewriting, and built HTML
validation failures. Generated test fixtures remain ignored for diagnosis.

`.github/workflows/docs.yml` performs these checks plus real upstream acquisition/staging on PRs,
main pushes, and manual runs, followed by both edition builds, English/Japanese output validation,
bounded HTTP checks, and search probes. Production deployment remains a separate approval and
implementation step. Historical clean-clone and hosted results are in
[reproducibility evidence](../poc/reproducibility.md); they are not proof for a later untested commit.

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

## Translation maintenance

Add owned plain Markdown and its record using the [edition-specific translation workflow](../operations/translations.md).
Record the canonical file SHA-256 from staging, not the repository
commit. Relative links use the canonical document directory. Review translation and source changes
before updating that hash. A matching hash does not certify translation quality. The current
Profiling Guide is a PoC example awaiting human language review. Stable translations may be added and improved after release. Follow the
[stable release policy](../operations/editions.md#stable-release-policy).

## VitePress upgrades

The sole renderer is exact-pinned as `vitepress@2.0.0-alpha.21`; application code imports the
canonical package. The old `vitepress-v2` alias and alias-specific SSR bundling are removed.
Use the retained PoC comparison documents as historical evidence, not current command references.
When upgrading, rerun type checks, both edition builds, output/localization/version checks,
search probes, and browser checks of fallback notices, navigation, and search. Alpha status means
compatibility must be verified against the actual pinned release; the owner's adoption decision
accepts that maintenance responsibility.
