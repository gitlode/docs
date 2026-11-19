# PoC closeout plan

Status: implementation and owner review of VitePress v2 consolidation complete, 2026-11-19.
Closeout preparation is authorized; final PoC exit acceptance and PR merge remain with the owner.
Implementation: Codex. Working branch: `work/poc-closeout`, based on main after PR #2.
No production deployment has been performed or enabled.

## Confirmed outcomes

| Milestone                         | Outcome                                                                                                    | Evidence                                                               |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Foundation and source acquisition | Pinned refs, explicit six-document allowlist, byte-preserving staging and provenance                       | [Evaluation](evaluation.md), [architecture](../design/architecture.md) |
| Comparable renderers              | VitePress v1, v2 and Starlight evaluated on the same corpus                                                | [Three candidates](three-candidates.md)                                |
| Localization                      | Owner accepted styled fallback notices, same-document language switching and file-level freshness behavior | [Localization](localization.md), [metadata](translation-metadata.md)   |
| Edition navigation                | Owner accepted header links to the target edition home, preserving locale                                  | [Versions](versions.md)                                                |
| Local search                      | Owner accepted sufficient functionality; v2 Japanese search improved over v1                               | [Search](search.md), [three candidates](three-candidates.md)           |
| Selection                         | Owner selected VitePress 2.0.0-alpha.21, preferring Vue and accepting custom fallback maintenance          | [ADR 0001](../decisions/0001-use-vitepress-v2.md)                      |
| Consolidation                     | Non-selected code removed; publication and renderer domains separated; owner confirmed result              | [Consolidation](consolidation.md)                                      |

The original [kickoff](kickoff.md) and earlier comparison documents remain historical evidence.
Their retired commands and pending-selection statements do not govern current work.
Current architecture and commands live in the durable documentation.

## Closeout sequence

1. Record owner acceptance of consolidation and prepare the production-readiness handoff.
2. Create a follow-up PR with the selection decision, consolidation and closeout documentation.
3. Verify the final PR revision in GitHub's Ubuntu validation workflow. Earlier CI success is
   evidence for earlier revisions only; record the tested SHA and run URL in [closeout](closeout.md).
4. Present the result for owner review and squash merge, plus explicit PoC exit acceptance.
5. Record that acceptance and the resulting main revision when supplied; leave production
   readiness tasks open. PoC exit does not mean production readiness or launch authorization.

## Confirmed constraints for the next phase

- Continue in `gitlode/docs`; canonical English remains in `gitlode/gitlode`.
- Stable `gitlode@0.12.0` and next `integration/v0.13.0` are the approved PoC refs, pinned in
  `config/sources.json`. A production refresh needs an explicit decision, not automatic movement.
- GitHub Pages at `https://gitlode.github.io/docs/`, base `/docs/`, no custom domain.
  The owner previously checked GitHub settings; deployment permissions/workflow still need implementation.
- Preserve TypeScript, domain separation, untrusted Markdown restrictions and process cleanup.
- Owner-facing PoC results are Japanese; durable docs and LLM handoffs are English.

## Deferred implementation

The owner accepted these as follow-up work, not reasons to keep extending the comparison PoC:
publication scope and internal links, explicit assets, stable translation policy and language review,
dependency findings, deployment preparation and launch. Follow-up work also includes the system's
own documentation: separate development and operations guides,
replace active PoC framing, and update documentation as part of every implementation increment.
The actionable continuation plan is
[production readiness](../handoff/production-readiness.md), with decisions, file entry points,
ordering and completion criteria. Cross-project tooling proposals remain a separate nonblocking review.
