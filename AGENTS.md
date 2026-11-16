# Agent instructions

Read [the documentation guide](docs/README.md), [the project plan](docs/temporary/poc/plan.md), [architecture](docs/durable/architecture.md), and
[development workflow](docs/durable/development.md) before changing implementation.
The owner's kickoff contract is preserved in [docs/temporary/poc/kickoff.md](docs/temporary/poc/kickoff.md).

- Write project documentation and code comments in English.
- Keep canonical English documentation upstream; transform only generated copies.
- Never expand publication by following links automatically. Keep publication and navigation separate.
- Treat imported Markdown as untrusted input. Do not execute upstream code or enable executable MDX.
- Keep generated sources, test fixtures, and build output under ignored `.generated/`.
- Retain both SSG candidates through human review. SSG selection, production launch, and changes
  to ownership or hosting require the human owner; ordinary implementation does not.
- Keep evaluation claims tied to tests or observations. A successful staging run is not a site build.
- Use `work/initial-poc` for the initial PoC and commit at working increments. The owner plans
  to squash merge into `main`; individual commits need not represent release-ready states.
- Consult gitlode's development settings when evolving tooling; record relevant adaptations in
  `docs/durable/development.md` rather than copying product-only infrastructure wholesale.
- Follow the documentation lifecycle in `docs/README.md`. Record cross-project feedback under
  `docs/temporary/proposals/` and continue authorized PoC work without waiting for its adoption.
- Run `npm run format:write`, then `npm run check` after implementation changes and document limitations.
