# Current PoC handoff

Status: closeout evidence ready; owner merge and PoC exit acceptance pending, 2026-11-19.
Maintainer: next human or LLM. Decision authority: project owner.
Replace this note after integration/exit decisions; preserve the active production backlog until resolved.

## Start here

1. Read [documentation guide](../README.md), [architecture](../design/architecture.md),
   [development workflow](../contributing/development.md), and [ADR 0001](../decisions/0001-use-vitepress-v2.md).
2. Check Git status, branch and remote integration before editing. PR #2 was squash merged into main
   as `1a3835c`. Active branch `work/poc-closeout` starts there and contains the post-selection commits;
   consolidation is `09cb3f5` (original `be680f5` remains on `work/poc-evaluation`).
   [PR #3](https://github.com/gitlode/docs/pull/3) is open; do not claim integration complete before merge.
3. Use [production readiness](production-readiness.md) as the actionable follow-up backlog. Start with
   production publication scope; it supplies file entrypoints, dependencies, open decisions and evidence
   required to close each gap. Do not infer production readiness from a successful PoC.

## Decisions and verification

The owner selected VitePress 2.0.0-alpha.21 and accepted its consolidation on 2026-11-19, including
separate publication services, VitePress adaptation and site theme/config. Other candidate code is
removed; historical comparison evidence remains. The owner approved closeout work and the deferred
production backlog, prioritizing continuity between sessions. Final PoC exit and launch remain
separate owner decisions.

Use [closeout evidence](../poc/closeout.md) for the final review status. See
[consolidation evidence](../poc/consolidation.md): clean install, 43 tests, two builds, 28 version
navigation checks, 32 search queries, and Edge desktop/mobile behavior passed locally. Owned browsers
and listeners were closed. Post-consolidation Ubuntu CI passed for `4d6922881c2e64afaf31d46a54017639eb6226dc` in [run 44434629573](https://github.com/gitlode/docs/actions/runs/44434629573);
older three-candidate CI evidence is not a substitute. The dated dependency finding and its follow-up
are recorded in production-readiness.md; do not report it as a fresh audit.

## Restart commands

Use Node 22.23.4 / npm 11.11.0, Git, and a clean checkout. With Volta, prefix npm commands with
`volta run --node 22.23.4`. No upstream dependency installation or privileged source credentials are needed.

```sh
npm ci --ignore-scripts
npm run check
npm run source:acquire
npm run content:stage
npm run site:build
npm run site:verify
npm run search:verify
```

Dependency installation needs registry access unless cached; source acquisition needs GitHub access.
The subsequent stage/build/verification commands use local input. Generated inputs and results are ignored under
`.generated/`; regenerate them after a clone rather than depending on a previous session's files.
For manual review use `npm run preview`, open `http://127.0.0.1:4173/docs/next/ja/`, and stop with
Ctrl+C in the same terminal. Follow the development process-lifecycle procedure for agent-owned
processes and verify actual PID exit and port release. No preview should be left running by default.

## Remaining closeout actions

- Confirm the latest PR checks remain successful after evidence-only commits and integrate through owner review
  and squash merge; do not merge automatically.
- Present the completed evidence and explicit production gaps for owner PoC-exit acceptance.
- Record that decision and final integration state here, then continue with production-readiness.md
  when the owner starts the next phase. Selection, consolidation acceptance and CI success alone do
  not authorize deployment, upstream changes, or cross-repository notifications.
