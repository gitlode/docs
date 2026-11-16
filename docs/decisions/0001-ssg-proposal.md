# 0001 — Static site generator selection

Status: **Proposed evaluation; selection pending human approval.**

## Context

Canonical English Markdown remains upstream. The documentation repository must support selective
publication, navigation/TOC, English/Japanese, stable/next, and GitHub Pages. The same repository
must survive the comparative PoC. [The evaluation](../evaluation.md) currently contains acquisition
evidence only; it does not establish rendering fidelity or relative maintenance cost.

## Proposal

Implement both VitePress and Astro Starlight adapters against the same immutable staging manifest.
Keep Docusaurus as reference only. Defer a preferred-SSG recommendation until both candidates have
been built and compared. The final proposal must name a recommendation, show evidence and trade-offs,
list required custom code, and present known failures before asking the owner to select.

## Consequences and review gate

Maintain both candidates until human review. Do not remove either, finalize selection, or treat this
ADR as approval to launch production. After selection, retain the selected implementation here,
remove comparison-only code/dependencies, and prepare a separate production-readiness review.
