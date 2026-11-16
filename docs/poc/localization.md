# Localization comparison evidence

Status: implemented locally on 2026-11-16; human review pending.
Decision authority: human project owner. Next action: review both locales, then assemble both
editions with version navigation. Retain this evidence until the SSG decision is recorded.

The owner reviewed both English previews and found the important end-user functions equivalent.
Visual theme differences have low weight in this PoC. This increment compares localization work
and maintenance without selecting an SSG.

## Reproduction and scope

Run `npm run previews:build`, then `npm run previews:verify`. For interactive review run
`npm run preview:vitepress` and `npm run preview:starlight` in separate terminals; stop each with
Ctrl+C. Existing English URLs still work. Japanese examples:

- `http://127.0.0.1:4173/docs/vitepress/next/ja/profiling/`
- `http://127.0.0.1:4174/docs/starlight/next/ja/profiling/`

The next Profiling Guide is a complete owned translation example, marked as awaiting human
language review. Other five Japanese documents intentionally use English fallback. Use `usage/`
to compare missing-page behavior. All six English pages remain canonical upstream content.

## Observations

| Concern                          | VitePress                                          | Starlight                                                 |
| -------------------------------- | -------------------------------------------------- | --------------------------------------------------------- |
| Same-page locale switch          | Native locale navigation                           | Native locale selector                                    |
| Missing Japanese pages           | Pipeline emits English fallback pages              | Native generation from English entries                    |
| Missing notice and body language | Small trusted Markdown renderer wrapper            | Native localized notice and English main content language |
| Translation freshness            | Shared file-level metadata and warning             | Same shared metadata and warning                          |
| Sidebar                          | Pipeline supplies locale-specific titles and links | Native locale resolution from content entries             |

Starlight removes some fallback code from this repository. It does not remove translation ownership,
source-hash comparison, security validation, or edition assembly. The wrapper in VitePress does not
enable imported HTML or require a custom theme. Neither result alone establishes an overall winner.

## Local verification

Successful run `.generated/previews/run-QUqiZv` used the pinned next commit
`90512564d76490088ecc99da7596128df1c45a2c`. Generated artifacts are ignored and machine-local.

| Measurement                             | VitePress | Starlight |
| --------------------------------------- | --------: | --------: |
| Build milliseconds (one warm local run) |     4,220 |     4,838 |
| Output bytes                            | 2,156,619 | 1,203,515 |
| HTML files including 404                |        16 |        15 |
| Validated local href/src links          |       558 |       963 |

VitePress has an additional language-choice root page; Starlight starts at `/en/` or `/ja/`.
These measurements are observations, not a repeatable performance benchmark.

Both builds passed local targets/fragments, single H1, sidebar/TOC, source code blocks and tables,
document/content language, native same-page switch targets, and fallback-notice assertions for all
12 document routes per candidate. Tests separately cover current/changed/missing translation states,
edition isolation, invalid declarations, symlinks, and incorrect localization output.
Bounded HTTP checks covered both locale homes, a translated page, a fallback page, English content,
and a 404. Owned ports 52825/52826 were confirmed released in the host after the checks.

## Limits and remaining work

- Browser click/keyboard/mobile verification of this new locale increment remains a human review
  item; static control targets and HTTP responses were checked, not interactive browser behavior.
- Language controls do not translate fragment IDs. An English section fragment may not exist
  after switching to a translated Japanese heading. Locale switching at page level is checked.
- English fallback body links stay English, while Japanese sidebar navigation stays Japanese.
- Matching source hashes do not imply translation accuracy or approval. Changed-source warnings
  have unit coverage; the normal pinned example currently has a matching hash.
- Starlight still reports optional i18n collection/custom-404 warnings; both fallback and default
  404 output build successfully. Search remains disabled.
- Combined stable/next output, stable translation snapshot policy, deployment, hosted CI,
  dependency findings, and final SSG selection remain pending.
