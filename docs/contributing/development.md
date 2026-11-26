# Development

## Environment and commands

Use Node.js 22.23.4, npm 11 (verified with 11.11.0), and Git on Windows or Linux. Node runs the
erasable TypeScript scripts directly; TypeScript 5.9.3 checks types separately. Build and preview
dependencies are local to this repository; no upstream package installation occurs.
`package-lock.json` is checked in.
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
Each successful stage prints a new directory. Its manifest lists the raw Markdown files selected
by each edition's publication configuration, with their source revisions and hashes.

## Debug npm scripts in VS Code

Open this repository as a workspace and ensure its integrated terminal can run the supported
Node.js and npm versions. In **Run and Debug**, select **npm: site:build** for the combined build,
**npm: Select script** for acquisition, staging, preparation, preview, verification or tests,
or **npm: translations:transfer** to enter the source and destination edition IDs. Press F5 to
start. These launches adapt gitlode's integrated-terminal debugger settings to run the existing npm
scripts directly, with automatic attachment to Node.js child processes.

To trace edition paths, set a breakpoint in `prepareSite` in
[`src/ssg/vitepress/build.ts`](../../src/ssg/vitepress/build.ts). VitePress loads a generated copy of
the config for each edition. To debug that copy, pause in `buildEdition` before it launches
VitePress, then use `report.root` to locate `.vitepress/config.ts` in the generated site.
**preview** serves the latest successful build. Stop any existing preview on port 4173 before
starting it, and use Ctrl+C in its terminal when finished.

## Site builds and preview

`npm run site:prepare` creates trusted VitePress inputs for the default edition (currently `next`) without building a site.
`npm run site:build` builds all configured editions by default, then prints a unique
`.generated/previews/combined-*/dist` complete artifact mounted at `/docs/`. The edition builds share
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

The language selector switches the current page. The header dropdown shows the current edition
and lists the editions from `config/editions.json`. Its links preserve the current
locale and open the target edition home with a full reload, without retaining the current document
or fragment. The Japanese Profiling Guide matches the pinned next source. Its stable 0.12.0
copy displays a source-change notice. Other untranslated pages use English fallback.

`npm run site:build -- stable` or `-- next` creates a single-edition diagnostic build without
version controls. Run the default build again to restore the complete preview. The complete
artifact includes both editions/locales, an edition/language landing, 404 and `.nojekyll`.
For the steps from a verified build to a hosted release, see [deployment and recovery](../operations/deployment.md#prepare-then-publish).

## Code organization

Keep SSG-independent acquisition, staging, Markdown processing, translations, static serving, and
HTML reference validation in `src/publishing/`. `content.ts` returns prepared content and metadata
without generating framework files. Keep VitePress build assembly and checks that depend on its
rendered markup or search APIs in `src/ssg/vitepress/`. `src/cli/site.ts` composes that adapter.
Trusted VitePress config and metadata types live in `site/vitepress/` and are
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

For every agent-owned long-running verification process, including browsers, follow this procedure:

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
cross-project suggestions in `../proposals/` and continue authorized work using the
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
  Generated content, dependencies and the lockfile are excluded from formatting.
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

Use a topic branch and submit changes through a PR. The [deployment procedure](../operations/deployment.md)
covers publication after integration.

## Updating inputs

1. Resolve an explicitly chosen tag/branch using `git ls-remote --heads --tags https://github.com/gitlode/gitlode.git`.
2. For annotated tags, use the peeled `^{}` commit, not the tag object's SHA.
3. Update the requested ref and full commit in `config/<edition>/source.json` together.
4. Acquire the pin. For a new stable release, follow the [edition update procedure](../operations/editions.md) to select a fresh translation set before transferring translations.
   Stage, inspect the diff and manifest, and run checks.

Use exact file paths in `config/<edition>/publication.json`; adding to the sidebar is a separate edit in
`config/<edition>/navigation.json`. Never follow all links or publish a whole repository to avoid failures.

## Validation

`npm run search:verify` probes the built native local search indexes after a complete
build. It executes eight queries per edition and locale (32 with the current configuration) using MiniSearch,
VitePress's tokenizer, and default UI query options. It runs in Node, not a browser or simulated
search UI. It checks that the served index assets match the built files, records query results in
the generated run's `search.json`, verifies result scope and destinations/fragments, and closes its
ephemeral static server. Missing matches for Japanese substrings are observations rather than build
failures.

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
bounded HTTP checks, and search probes. Manual publication and recovery follow the
[deployment procedure](../operations/deployment.md).

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
before updating that hash. A human decides whether to publish the wording when incorporating
a translation change. Stable translations may be added and improved after release. Follow the
[stable release policy](../operations/editions.md#stable-release-policy).

## VitePress upgrades

To review the locked dependencies, start in a clean checkout with the project Node/npm
versions. Run `npm ci --ignore-scripts --no-audit`, `npm ls --all`, then `npm audit --json`
with development dependencies included. Build and type-check tools are development dependencies.
For a finding, use `npm explain <package>` to trace it to a caller and check the advisory
status before choosing an update. Record the revision, date, registry, package versions,
findings and any remaining release decision. Run `npm run check` against the clean install.

The sole renderer is exact-pinned as `vitepress@2.0.0-alpha.21`.
When upgrading, rerun type checks, both edition builds, output/localization/version checks,
search probes, and browser checks of fallback notices, navigation, and search. Alpha status means
compatibility must be verified against the actual pinned release; the owner's adoption decision
accepts that maintenance responsibility.
