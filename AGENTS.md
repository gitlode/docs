# Agent instructions

Read [the documentation guide](docs/README.md), [architecture](docs/design/architecture.md), and
[development workflow](docs/contributing/development.md) before changing implementation.
The [PoC plan](docs/poc/plan.md) and [owner's kickoff](docs/poc/kickoff.md) preserve historical requirements.

- Write durable documentation, LLM-oriented documents, and code comments in English.
  Write PoC result summaries primarily reviewed by the human owner in Japanese.
- Prefer TypeScript where the framework provides useful type support, including Vue SFC scripts.
  Include migrated code in type checks; do not force TypeScript where usable type information is absent.
- Keep canonical English documentation upstream; transform only generated copies.
- Never expand publication by following links automatically. Keep publication and navigation separate.
- Treat imported Markdown as untrusted input. Do not execute upstream code or enable executable MDX.
- Keep generated sources, test fixtures, and build output under ignored `.generated/`.
- VitePress v2 is selected in ADR 0001; preserve historical comparison evidence. Production launch and changes
  to ownership or hosting require the human owner; ordinary implementation does not.
- Keep evaluation claims tied to tests or observations. A successful staging run is not a site build.
- Commit at working increments on a topic branch and submit changes to `main` through a PR.
- Consult gitlode's development settings when evolving tooling; record relevant adaptations in
  `docs/contributing/development.md` rather than copying product-only infrastructure wholesale.
- Follow the documentation lifecycle in `docs/README.md`. Record cross-project feedback under
  `docs/proposals/` and continue authorized work while proposals are under review.
- Run `npm run format:write`, then `npm run check` after implementation changes and document limitations.
- Own the full lifecycle of verification processes. Follow the process cleanup procedure in
  `docs/contributing/development.md`; prefer bounded `npm run site:verify` for HTTP checks.
  Never infer child-process termination from a tool/session exit. Confirm owned PIDs have exited
  and listeners are released before handoff, unless the user explicitly requested a running preview.
