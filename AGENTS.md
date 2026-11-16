# Agent instructions

Read [the project plan](docs/plan.md), [architecture](docs/architecture.md), and
[development workflow](docs/development.md) before changing implementation.
The owner's kickoff contract is preserved in [docs/kickoff.md](docs/kickoff.md).

- Write project documentation and code comments in English.
- Keep canonical English documentation upstream; transform only generated copies.
- Never expand publication by following links automatically. Keep publication and navigation separate.
- Treat imported Markdown as untrusted input. Do not execute upstream code or enable executable MDX.
- Keep generated sources, test fixtures, and build output under ignored `.generated/`.
- Retain both SSG candidates through human review. SSG selection, production launch, and changes
  to ownership or hosting require the human owner; ordinary implementation does not.
- Keep evaluation claims tied to tests or observations. A successful staging run is not a site build.
- Run `npm run check` after implementation changes and document meaningful limitations.
