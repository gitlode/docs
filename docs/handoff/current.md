# Current production handoff

Status: PoC complete. Production preparation started on 2026-11-19.
Decision authority: project owner. The trunk session coordinates work and owner decisions.

[PR #3](https://github.com/gitlode/docs/pull/3) was squash merged into main at
`19ef3b121c7d9b070c13cb141e3abfb8a10611e2`. The
[main validation run](https://github.com/gitlode/docs/actions/runs/44439421213) succeeded.
The [PoC closeout report](../poc/closeout.md) preserves the pre-merge review evidence.

Resume with the [production readiness backlog and owner decisions](production-readiness.md).
The owner approved the initial pins and publication scope for current work. Edition identity and URL behavior are agreed; see [edition operations](../operations/editions.md).
The approved corpus is configured; see [publication operations](../operations/publication.md).
The owner confirmed that the stable publication list and navigation share the same defect-only correction rule for each release.
Stable translation preparation now snapshots exact next matches and falls back for all other documents.
See [translation operations](../operations/translations.md). Initial language review remains open. Production
launch requires a separate owner decision. Read the [documentation guide](../README.md),
[architecture](../design/architecture.md), [development workflow](../contributing/development.md)
and [SSG decision](../decisions/0001-use-vitepress-v2.md) before implementation.

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
