# Current PoC handoff

Status: active continuation note, updated 2026-11-18.
Maintainer: next human or LLM. Decision authority: project owner.
Replace this note at the next handoff; durable contracts live in architecture and development.

## Current state

- Work branch: `work/poc-evaluation`, following the initial PoC merge into main.
- Owner selected VitePress 2.0.0-alpha.21; see ADR 0001. Vue preference and acceptable custom
  fallback maintenance outweigh the proposal's narrow Starlight preference.
- Owner authorized consolidation, explicitly requiring SSG-dependent and independent domains.
- `src/publishing/` owns acquisition, staging, content preparation, translation freshness,
  Markdown safety/link rewriting, static serving and generic HTML reference checks.
- `src/ssg/vitepress/` owns builds and rendering/localization/version/search verification.
- `site/vitepress/` owns trusted config and Vue theme; `src/cli/site.ts` is the site entry point.
- Non-selected implementations, package alias, and comparison-only dependencies are removed.
  Comparison documents remain historical evidence, not current command references.
- Current URLs are `/docs/{stable|next}/{en|ja}/`; use `npm run site:build`, `site:verify`,
  `search:verify`, and `npm run preview`. Stop a manual preview with Ctrl+C.

## Verification and limitations

See the Japanese [consolidation evidence](../poc/consolidation.md) for local validation.
A clean install, 43 tests, two builds, 28 version-navigation checks, 32 search queries and
Edge desktop/mobile checks passed. All owned browsers and listeners were closed.
The current dependency audit reports seven high package findings from one picomatch advisory;
compatible update did not resolve them. No forced downgrade to VitePress v1 was performed.
Historical clean audit/CI observations do not certify this new dependency graph.

## Next work

1. Owner reviews consolidation and separately accepts PoC exit.
2. Define production publication and explicit assets; current links to unselected documents
   deliberately point upstream. Do not automatically publish link targets.
3. Decide stable translation snapshot policy and review Japanese sample quality.
4. Review dependency findings and prepare deployment. Production launch is not authorized.

Continue nonblocking cross-project feedback in `docs/proposals/`. Preserve canonical English
upstream; do not edit gitlode itself or send notifications without authorization.
