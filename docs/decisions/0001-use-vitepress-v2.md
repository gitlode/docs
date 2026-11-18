# ADR 0001: Use VitePress v2

Status: Accepted, 2026-11-18.
Decision authority: project owner.

## Context

The PoC compared VitePress 1.6.4, VitePress 2.0.0-alpha.21, and Starlight 0.43.1
with Astro 7.4.12. The owner reviewed the previews, including missing translations,
language and edition navigation, and local search. V2 improved Japanese search over v1;
the owner observed no unfinished behavior within the reviewed scope.
Automated validation and Ubuntu CI passed for the three-candidate implementation.

Both v2 and Starlight met the required capabilities without a decisive functional gap.
The implementation proposal narrowly preferred Starlight for native translation fallback.
The owner instead preferred the Vue.js-based development environment offered by VitePress.
Vue's perceived broader familiarity/popularity is an owner preference, not a measured
PoC result or a claim that the team has demonstrated greater Vue expertise.

## Decision

Adopt VitePress v2 for gitlode documentation. The evaluated starting version is
2.0.0-alpha.21; keep it exactly pinned until an explicitly reviewed update.

The owner considers the custom missing-translation implementation small enough to
maintain and accepts that responsibility in exchange for the preferred UI framework.
Absolute stability is not a prerequisite for this personal project. Prerelease status
does not disqualify v2, but neither the official onboarding path nor the PoC establishes
future compatibility guarantees. Starlight also requires care across minor updates.

V1 is not the adoption target: the owner prefers v2's expected development direction.
This does not assert that upstream v1 support has ended.

## Consequences

- Retain generated fallback pages, visible untranslated-content notices, and correct
  content-language markup, with regression coverage through future VitePress updates.
- Preserve TypeScript/Vue checks, source selection and safety boundaries, translation
  freshness checks, edition isolation, link validation, and search verification.
- Consolidate the implementation around v2 in the next increment. Remove non-selected
  candidates and comparison-only dependencies/configuration while preserving evidence.
  The npm alias and SSR settings introduced for v1/v2 coexistence should be reassessed
  when only v2 remains, rather than treated as permanent requirements.
- Recheck the resulting dependency graph and audit after consolidation. Historical
  v1 findings must not be attributed to v2, and an earlier clean audit is not a guarantee.
- Finalize publication scope, internal references, assets, stable translation policy,
  and deployment preparation separately. Selection does not approve production launch
  or establish PoC exit acceptance. No deployment is performed by this decision.

## Evidence

- [Owner review and three-candidate validation](../poc/three-candidates.md)
- [Historical selection proposal and owner outcome](../poc/ssg-proposal.md)
- [Future outlook and migration experiment](../poc/future-outlook.md)
