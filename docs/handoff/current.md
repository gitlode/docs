# Current PoC handoff

Status: active continuation note, updated 2026-11-16.
Maintainer: the next human or LLM working on the PoC. Decision authority: human project owner.
Replace or retire this note when the next increment is handed off; migrate lasting facts to durable docs.

## Starting point

- Repository: `gitlode/docs`; work branch: `work/initial-poc`.
- `0ef1673`: initial pinned acquisition/staging foundation.
- `f983e3c`: development tooling alignment with gitlode itself.
- Documentation is organized by purpose: `design/`, `contributing/`, `poc/`, `handoff/`, and
  `proposals/`. Durable and temporary describe document lifecycles, not parent directories.
- Working increments should be committed; the owner plans a squash merge to `main`.

Use [development](../contributing/development.md) for commands and
[architecture](../design/architecture.md) for current contracts. The
[PoC plan](../poc/plan.md) owns milestones; [evaluation](../poc/evaluation.md) owns test evidence.
Both next-English previews now build from the same six-document corpus and pass HTML links,
fragments, sidebar/TOC presence, code-block, and table checks. See
[English preview evidence](../poc/english-previews.md) for reproduction, measurements, and screenshots.
Node 22.23.4 is now required by the current Astro dependency line; npm 11 remains the baseline.
Run `npm run previews:build`, then the two `preview:*` commands in separate terminals.
For agent-owned HTTP checks, prefer bounded `npm run previews:verify`: it uses ephemeral ports and
closes both servers in `finally`. Follow the [process lifecycle procedure](../contributing/development.md#verification-process-lifecycle)
for all verification processes. A previous shell/tool exit left a Node child holding both fixed
preview ports; do not treat wrapper completion as evidence of child termination.

Next action: add a minimal owned Japanese translation and compare missing-page behavior, followed
by combined stable/next artifact assembly. Keep both candidates and the existing human decision gate.
The SSG recommendation is not yet ready. Search remains disabled for this increment.

## Pending review

[Environment alignment feedback](../proposals/development-environment.md) is recorded for later
cross-project review. Keep the current local configuration and continue the PoC without waiting
for that review. SSG selection and production launch still require their separate human gates.

VitePress's declared Vite/esbuild dependency line still produces three npm audit package findings.
The documented preview uses a separate loopback-only static server; do not substitute a publicly
exposed Vite development server. Revisit the dependency findings before production acceptance.
Starlight's i18n/custom-404 warnings are recorded for the localization increment. Hosted CI and
full interactive/mobile browser validation remain unverified.

No upstream modifications or remote publication are implied by this handoff.
