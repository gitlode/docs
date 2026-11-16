# gitlode Documentation System — Project Kickoff

**Status:** Implementation kickoff / comparative proof of concept (PoC)  
**Working repository name:** `gitlode/docs` (provisional; confirm availability and final name)  
**Document language:** English  
**Decision authority:** Human project owner  
**Target implementation environment:** Node.js / TypeScript, GitHub Actions, GitHub Pages  
**Source project:** <https://github.com/gitlode/gitlode>

> **Purpose of this document**  
> Enable a separate Codex development session to establish a maintainable documentation-system repository and implement a comparative PoC. This document is a starting contract, **not** a complete implementation specification. Decisions explicitly marked for validation must remain open until the evidence has been reviewed by the human owner.

## 1. Mission and outcome

Build and operate a static documentation website for **gitlode**, a Git history extraction CLI project. The site must publish selected existing English Markdown documents from the gitlode repository, eventually offer Japanese translations maintained in the documentation-system repository, and expose both a stable release and a development version.

The documentation system is a **separate product/service and repository**, not the canonical authoring location for gitlode's English documentation.

**Crucially, the PoC repository is the future production repository.** Do not create a disposable prototype that must be rebuilt elsewhere. Build the foundations for continued development, while allowing exploratory SSG implementations to be removed after selection.

### Success in the initial PoC

1. A cloneable, understandable, maintainable project foundation exists.
2. The same representative real gitlode Markdown files render in **VitePress** and **Astro Starlight** previews.
3. Shared content acquisition/preparation is separated from SSG-specific adaptation.
4. The previews exercise navigation, per-page TOC, English/Japanese behavior, and stable/next deployment paths to a useful extent.
5. An evidence-based comparison report and an architecture decision **proposal** are available for human review.
6. The repository contains documentation explaining its own architecture, development workflow, and decisions.

**The PoC does not select an SSG autonomously or require a publicly launched production site.**

## 2. Context and current state

- The gitlode project is an npm-workspaces TypeScript monorepo in the `gitlode` GitHub organization.
- Existing canonical English documents are Markdown in the gitlode repository, primarily under `packages/gitlode/docs/`, plus certain root/package `README.md` files.
- The existing docs directory has meaningful categories including `usage.md`, `profiling.md`, `design/`, `contributing/`, `agents/`, and `handoff/`.
- Its documentation policy distinguishes end users, developers, coding agents, durable design documents, and temporary handoff material. Preserve these distinctions.
- English documentation remains owned and maintained by the gitlode product maintainers. Publishing and translation are additional services owned by this project.

Inspect the actual current source tree rather than assuming this snapshot is still complete. Use the repository's existing documentation conventions and link structure as test inputs.

## 3. Decision vocabulary

- **Decided:** A requirement or architectural boundary already agreed by the human owner. Do not change silently.
- **Proposed:** The preferred initial implementation approach; adjust if testing exposes concrete problems, and record the rationale.
- **To validate:** An open decision that the PoC must investigate and report. Do not treat a provisional choice as final.
- **Deferred:** Explicitly outside the initial PoC's required scope; do not implement merely for completeness.

## 4. Requirements and constraints

### 4.1 Core requirements

| Requirement | Priority / status | Expectation |
| --- | --- | --- |
| Readable HTML output from existing Markdown | High / Decided | Preserve standard Markdown authoring in the source project. |
| Per-document table of contents | High / Decided | Derive from document headings. |
| Multi-document navigation/sidebar | Medium / Decided | Navigation across selected pages, informed by existing source structure. |
| CI-driven documentation generation | High / Decided | Reproducible build that can be automated from source revisions. |
| English and Japanese editions | Medium / Decided | English canonical in gitlode; Japanese translations owned by docs-site. |
| Stable and development editions | Medium / Decided | Stable release and a `next` view; simple independent static builds are acceptable. |
| Full-text search | Low / Deferred as a release gate | Evaluate built-in search cheaply in PoC; no external SaaS required. |
| GitHub Pages hosting | Decided | Production hosting platform; do not choose a different provider. |
| Selective publication | Decided | Do **not** publish all repository documents by default. |
| Preserve source file layout where practical | Proposed | Avoid gratuitous restructuring or rewriting canonical Markdown. |
| Non-disposable PoC | Decided | The same repository becomes the production documentation project. |
| Project's own documentation and tests | Decided | Start with a maintainable foundation, not just demo pages. |

### 4.2 Explicit ownership boundaries

**`gitlode/gitlode` owns:**

- Canonical **English** Markdown source and its correctness.
- Product behavior, design contracts, and documentation updates as part of product changes.

**The documentation-system repository owns:**

- Selection, retrieval, normalization/staging, site generation, validation, and publishing.
- Japanese translation sources and translation maintenance policy.
- Site UI, navigation organization, SSG dependencies, CI/CD, and operational documentation.

The documentation-system project **must not require changes to the canonical English Markdown** just to satisfy an SSG. If preprocessing is needed, do it against generated/staged copies, not the upstream source files.

### 4.3 Publication scope

Start with an explicit **allowlist** of selected durable end-user and developer documentation. Candidate content includes:

- `packages/gitlode/docs/usage.md`
- `packages/gitlode/docs/profiling.md`
- `packages/gitlode/docs/design/**`
- `packages/gitlode/docs/contributing/**`

Evaluate root/package READMEs separately where helpful. **Do not automatically publish** coding-agent guidance (`agents/`, `AGENTS.md`) or temporary handoff/working documents (`handoff/`) on the site. An explicit exception must be justified.

Publication selection and sidebar inclusion are **different decisions**: a published document may be reachable through links without occupying a primary navigation position.

## 5. Architecture direction

```text
   gitlode/gitlode (canonical English Markdown, Git refs)
                          |
                acquire pinned source
                          |
 docs-site repository ----+---- Japanese translations
 (config / project docs)   |
                          v
                 Publishing pipeline
         resolve refs -> select -> normalize/stage
                          |
             +------------+------------+
             |                         |
        VitePress adapter         Starlight adapter
             |                         |
        Preview A                 Preview B
             +------------+------------+
                          |
                PoC comparison/review
                          |
                HUMAN SSG DECISION
                          |
             retain selected implementation
                          |
       stable + next static output -> GitHub Pages
```

This is a **logical boundary diagram**, not an instruction to create one package, class, subprocess, or microservice per box. Prefer a small TypeScript toolchain and straightforward scripts.

### 5.1 Source acquisition — proposed

- Use **Git checkout** of `gitlode/gitlode`, rather than fetching individual documents through the GitHub API, unless the PoC demonstrates a material disadvantage.
- Resolve each requested ref to an exact commit SHA **before** preparing the content. Each build should operate on immutable pinned input.
- Preserve source provenance: requested ref, resolved commit SHA, documentation-system revision, and (where useful) source paths.
- Local commands must be reproducible; do not implement all acquisition behavior exclusively in GitHub Actions YAML.
- Public source reads should not require privileged credentials; use least privilege in CI.
- Handle failure to fetch a source, missing selected files, and invalid refs with actionable errors.

### 5.2 Publication and staging — proposed

Use a configuration-driven allowlist and a generated staging directory:

```text
Git checkout(s)   -> selected canonical English files
Translations      -> selected Japanese files
Configuration     -> source ref + publication/navigation policy
                                    |
                                    v
                     generated, disposable staging
                                    |
                         SSG-specific adaptation
```

- Keep generated inputs and static outputs out of Git unless there is an explicit operational reason.
- Consider selected adjacent assets (images, referenced files) and relative Markdown links; do not silently create broken output.
- Preserve a mapping from published document to original source file and commit/ref.
- Prefer native SSG Markdown routing/rendering; transform links or metadata only where necessary.
- Avoid designing a generalized Markdown AST abstraction or universal SSG adapter framework in this PoC.

### 5.3 Content normalization — limited scope

Potential transformations to evaluate:

1. **Title/frontmatter:** Starlight normally requires a document title in frontmatter. Derive it from the existing H1 or configuration without changing the canonical source. Avoid duplicate visible titles.
2. **`README.md` routing:** Test whether directory `README.md` should become an index-like route in staged input.
3. **Relative links/assets:** Verify cross-document links and paths after routing changes, for both candidates.
4. **Source attribution:** Retain enough metadata to link to the correct upstream English file or docs-site Japanese translation, including version-aware references.
5. **Markdown dialects:** Test real TypeScript snippets, angle brackets, GFM tables, fenced code, and other existing syntax against both renderers.

Each candidate may need a small candidate-specific adaptation. Do not force these into an artificial common abstraction.

### 5.4 Versions — proposed / to validate

- **Stable:** a released gitlode tag, resolved to a commit SHA.
- **Next:** a configured active development ref (for example an `integration/*` branch), also pinned to a SHA at build time.
- Do **not** infer the active development branch by sorting all matching branch names. Prefer explicit configuration initially.
- Independently build stable and next, including their locale variants, and **assemble one complete GitHub Pages deployment artifact**. A Pages deploy must not assume it can append to an existing deployment.
- Start with straightforward full rebuilds; optimize only if measurements justify doing so.
- Deeply integrated native SSG documentation-versioning is **not required**. Path-separated sites or simple navigation between versions are acceptable.
- Version/locale path examples (illustrative, not an exact routing contract): `/stable/en/`, `/stable/ja/`, `/next/en/`, `/next/ja/` beneath the chosen Pages base path.
- Favor native routing conventions if enforcing the exact example paths would require brittle customization.

### 5.5 Localization — ownership and eventual consistency

- English content remains in gitlode, and Japanese translation files live **only** in docs-site.
- Automated translation generation is **not** an initial requirement.
- A missing Japanese page and an outdated Japanese page are distinct conditions; do not confuse them.
- Evaluate **missing-page fallback** in the SSG comparison (Starlight has built-in behavior; VitePress may require custom handling).
- Plan early **translation freshness detection** using a source-file-level identity (e.g., Git blob ID or content hash) recorded for the source that each translation was last checked against. A repository-wide commit SHA alone must not make unrelated translations appear stale.
- `source changed` means the canonical file changed; it does **not** prove its translation is semantically outdated. Allow maintainers to confirm that no translation edit is needed.
- The full translation freshness tool and automated translation CI are **not required for first PoC completion**. Define/test the metadata concept and document the follow-up.
- Stable translations should ultimately be associated with the corresponding stable English release rather than silently using next's Japanese translations. The exact snapshot/update strategy remains an open design decision.

### 5.6 GitHub Pages and CI

- **Production hosting is GitHub Pages.** The PoC must verify nested base paths, internal links, static assets, and static build output for that environment.
- Local build/preview commands should work without GitHub Actions.
- Pull requests should run validation/build, without privileged production deployment.
- Production publishing should operate from a trusted branch/workflow, with minimal `pages: write` and `id-token: write` permissions where required.
- Candidate triggers after the PoC: docs-site updates, manual `workflow_dispatch`, and scheduled source synchronization. Cross-repository `repository_dispatch` from gitlode can be added later if needed.
- The comparison PoC need not deploy a public production site, but should show that its artifact layout is compatible with GitHub Pages.

## 6. SSG comparison plan

### 6.1 Candidates

| Candidate | PoC role | Primary hypothesis to test |
| --- | --- | --- |
| **VitePress** | Full preview | Simpler integration and high Markdown compatibility offset potential localization customization. |
| **Astro Starlight** | Full preview | Built-in docs/i18n/navigation features offset frontmatter and content-pipeline adaptation. |
| **Docusaurus** | Reference only | Not a required third PoC; revisit if the two main candidates cannot satisfy critical requirements. |

**SSG selection is reserved for the human owner.** Codex must keep both candidates until the comparison has been reviewed.

### 6.2 Common test corpus

Use the **same exact pinned gitlode revision** and representative content in both previews. Include, where present:

- `packages/gitlode/docs/usage.md` (long user guide, CLI examples, TOC)
- `packages/gitlode/docs/profiling.md` (technical usage)
- `packages/gitlode/docs/design/README.md` (directory landing/navigation)
- `packages/gitlode/docs/design/architecture.md` (technical details)
- `packages/gitlode/docs/design/plugins.md` (types and plugin contracts)
- `packages/gitlode/docs/contributing/README.md` (contributor structure)

If paths have changed, select semantically equivalent real files and record the substitutions. Include at least one translated Japanese example page **owned by docs-site**, one missing translation, and two distinct Git refs when available.

### 6.3 Required PoC scenarios

1. Render representative canonical Markdown **without modifying upstream files**.
2. Display a multi-document sidebar and a per-document heading TOC.
3. Navigate across documents, including nested `README.md` entries; validate relative links and code fences.
4. Switch or navigate between English and Japanese; inspect missing-translation behavior.
5. Assemble a stable and a next static site from separately resolved refs, or demonstrate the working process with a documented minimal setup if matching historical refs are unavailable.
6. Verify nested GitHub Pages-style base paths, assets, and navigation between built sites.
7. Test the candidate's built-in local search if it is inexpensive; record limitations without making it a release gate.
8. Run repeatable local build commands and automated CI validation.
9. Check that excluded agent/temporary documentation is absent from generated publication output.
10. Record warnings, syntax incompatibilities, plugins, custom transformations, and implementation complexity.

### 6.4 Comparative evaluation criteria

Evaluate both candidates using evidence rather than unqualified scores:

| Criterion | Evidence to collect | Importance |
| --- | --- | --- |
| Non-invasive Markdown integration | Failures, source changes required (target: zero), transformations | Critical |
| Operational maintainability | Custom logic, dependencies, stability of extension APIs | Critical |
| Required navigation/TOC | Actual rendered behavior, usability | High |
| Localization and missing translation | Working switch/fallback, custom effort | High |
| Git-based stable/next publishing | Reproducible multi-ref builds, links/assets | High |
| Reproducibility and CI | Clean clone + documented build commands | High |
| User experience | Side-by-side manual review, screenshots where useful | Medium |
| Performance/build size | Measured build time and artifact size | Supporting |
| Local full-text search | Basic behavior and Japanese search quality | Low |

Do not choose solely by generated LOC, GitHub stars, or visual preference. Distinguish *initial configuration effort* from *long-term maintenance risk*.

## 7. Production-minded repository foundation

The PoC should establish the long-lived repository structure and keep temporary candidate implementations identifiable. An **illustrative** layout (Codex may refine names and boundaries with a short rationale):

```text
docs-site/
├── README.md                  # project purpose, setup, status
├── AGENTS.md                  # agent routing and guardrails
├── package.json
├── package-lock.json
├── docs/
│   ├── architecture.md        # system-owned technical documentation
│   ├── development.md         # local workflows, testing, CI
│   ├── evaluation.md          # PoC findings / comparison
│   └── decisions/             # concise ADRs / decision proposals
├── config/
│   ├── sources.*              # stable/next sources
│   ├── publication.*          # allowlist
│   └── navigation.*           # navigation rules as needed
├── translations/
│   └── ja/                    # documentation-system-owned translations
├── src/
│   └── publishing/            # shared acquisition/preparation logic
├── test/
│   └── publishing/            # core tests
├── candidates/
│   ├── vitepress/             # replaceable comparison implementation
│   └── starlight/             # replaceable comparison implementation
├── .generated/                # ignored, reproducible artifacts
└── .github/workflows/
    └── docs.yml               # validation; controlled deployment later
```

**Do not mechanically create empty files/directories for completeness.** Build only what is needed, and make the resulting structure self-explanatory.

The intended evolution is:

- **PoC:** preserve both implementations under `candidates/`.
- **After human selection:** move/retain the chosen implementation as the production site, remove the rejected candidate and comparison-only dependencies, and document the ADR.
- **Production hardening:** finish deployment, translation freshness checks, operational checks, and incremental improvements **within the same repository**.

### Project documentation required during the PoC

1. `README.md`: what the repository is, source/ownership boundary, setup, quick-start commands, PoC status.
2. `docs/architecture.md`: source acquisition, publication policy, staging, SSG boundary, build/deployment flow, provenance.
3. `docs/development.md`: prerequisites, scripts, test and preview commands, CI, debugging, generated-file policy.
4. `docs/evaluation.md` (or equivalent): methodology, observations, candidate comparisons, known blockers, recommendation.
5. `docs/decisions/` (or equivalent): material decisions and rationale, especially a **proposed** SSG ADR pending human approval.
6. `AGENTS.md`: concise agent working rules pointing to canonical project docs; **do not duplicate** the architecture or user documentation inside it.

Documentation about the **documentation system** belongs in this repository and is **not automatically included** in the public gitlode product documentation site.

## 8. Engineering quality and security

- Use TypeScript where useful for scripts and configuration; prefer established tools to hand-rolled frameworks.
- Apply clear input/output contracts to shared publishing logic and SSG adapters. Keep the implementation proportionate to PoC scope.
- Provide automated tests for meaningful source-selection, ref/provenance, staging, and path-handling logic.
- Use checked-in dependency lockfiles and documented runtime versions; validate a clean installation.
- Treat imported Markdown and assets as **untrusted input**. Prevent path traversal and uncontrolled writes outside staging; do not execute arbitrary content or trust executable MDX from a source checkout by default.
- Keep download/build permissions minimal; keep deployment credentials out of untrusted PR runs.
- Validate the published file set, including absence of excluded directories. Prefer build failures over silently publishing wrong or missing content.
- Keep generated content out of source control; commit only durable configuration, translation source, implementation, and docs.
- Avoid speculative plugin abstractions, premature caching, premature microservices, or highly customized themes during the PoC.
- Any necessary temporary workaround must have an explanation, owner, and removal/review condition.

## 9. PoC deliverables and acceptance

### Required deliverables

1. **Working Project Foundation:** source code, configuration, repeatable commands, initial tests/CI, and a structure designed to survive the PoC.
2. **Two Documentation Previews:** VitePress and Starlight running from the same real gitlode test corpus and shared content pipeline.
3. **SSG Evaluation Report:** findings backed by reproducible tests, observed behavior, and implementation trade-offs.
4. **Architecture Decision Proposal:** a recommended SSG and alternatives with evidence; clearly marked **pending human approval**.
5. **Project Documentation:** README, architecture, development workflow, and agent guidance.

### PoC exit criteria

- [ ] A fresh clone installs and executes the documented build and preview commands.
- [ ] Both candidates render the agreed real Markdown corpus from a pinned source revision.
- [ ] The canonical English source is not modified to satisfy SSG requirements.
- [ ] Navigation, TOC, cross-document links, and representative code blocks work in both candidates, or defects are explicitly documented.
- [ ] English/Japanese navigation and missing-translation behavior have been demonstrated and compared.
- [ ] Stable/next content sourcing and GitHub Pages-style path separation have been exercised, with known limitations recorded.
- [ ] The publishing pipeline, configuration, and SSG-specific customizations have understandable responsibility boundaries.
- [ ] Excluded content is not silently published; representative automated validation exists.
- [ ] No generated staging/site output is unintentionally committed.
- [ ] CI verifies the PoC build/tests without granting deployment privileges to untrusted PRs.
- [ ] All five deliverables exist and material decisions/risks are documented.
- [ ] The human owner has sufficient evidence to select an SSG; the PoC does not preempt that decision.

A real production launch, production translations for every page, automatic translation, and a fully automated translation-freshness service **are not PoC exit criteria**.

## 10. Execution guidance for Codex

Use small, reviewable, sequential milestones. Prefer working increments over constructing all infrastructure before the first preview.

**Suggested implementation sequence**

1. **Inspect and bootstrap:** verify gitlode content and release/development refs; create the long-lived docs-site foundation, package management, README, ignore rules, and basic CI.
2. **Acquire and stage:** implement pinned source acquisition, allowlist selection, minimal provenance, and repeatable local staging; add focused tests.
3. **First two previews:** integrate representative content into VitePress and Starlight; produce comparable pages, sidebar, and TOC.
4. **Localization comparison:** add a minimal owned Japanese translation and an intentionally missing translation; observe fallback and language navigation.
5. **Version/Pages simulation:** exercise stable/next builds, nested base paths, asset handling, artifact assembly, and links.
6. **Evaluate and document:** collect reproducible evidence, compare trade-offs, update project docs, and draft an ADR recommendation.
7. **Stop at the selection gate:** request human review before removing a candidate, finalizing the SSG, or starting production hardening.

### Decision authority

| Decision class | Authority |
| --- | --- |
| Function names, internal file layout, ordinary tests and scripts | Codex, with rationale when non-obvious |
| Small implementation trade-offs within the agreed architecture | Codex, document meaningful decisions |
| SSG selection, removal of a candidate | **Human** |
| Changes to source ownership or modifying canonical gitlode Markdown | **Human** |
| New hosting/provider or external operational service | **Human** |
| Production go-live / PoC exit approval | **Human** |

If an architectural proposal becomes impractical, document the evidence and present an alternative; do not silently override a **Decided** boundary.

## 11. Open questions and deferred work

### To validate during the PoC

- VitePress vs. Starlight rendering fidelity with *actual* gitlode Markdown.
- Required frontmatter normalization and compatibility of TypeScript/Markdown syntax.
- Directory `README.md` route mapping and canonical relative-link behavior.
- Sidebar generation from a selected subset of source files.
- Missing-translation handling and simplicity of locale navigation.
- Two-version build assembly, site base paths, and cross-version links.
- Source provenance format and where to expose it.
- The minimum SSG-specific adapter surface and resulting maintenance cost.

### Deferred until after SSG selection

- Fully automated translation creation and review workflows.
- Production-grade translation staleness reports, notifications, and policy enforcement.
- Stable-translation snapshots and post-release corrections.
- Cross-repository push event notification (`repository_dispatch`) versus scheduled polling.
- Sophisticated cross-version search or unified search indexing.
- Custom domain, elaborate theme design, analytics, and other optional services.
- Historical published versions beyond stable and next.
- Build caching and incremental rebuild optimization without measured need.

## 12. Handoff instructions

At the end of the comparative PoC, provide a concise human-readable handoff stating:

1. Exact repository/branch and implementation state.
2. Commands to run both previews and validation locally.
3. Which gitlode refs/commits were tested.
4. The SSG evaluation report and **proposed**, not finalized, ADR.
5. Known failures, trade-offs, security issues, and incomplete acceptance criteria.
6. The next actionable steps after the human SSG selection.

**Do not equate a successful PoC with production launch.** The project and repository persist, but production readiness remains a separate acceptance decision.

---

**Guiding principle:** *Production-minded foundations, evidence-driven technology selection, minimal irreversible decisions.*
