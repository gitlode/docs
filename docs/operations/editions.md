# Update an edition

Edit `config/editions.json` for the public path and label. Edit `config/<edition>/source.json` for the ref and pinned commit. The keys `stable` and `next`
identify the release roles in translation records, staging and verification reports.

| Field              | Effect                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`             | One unique lowercase URL segment under `/docs/`, for example `latest`. Use letters, digits and hyphens between words. Changing this field moves the entire edition. |
| `label`            | Reader-facing text on the landing pages, navigation and attribution. A label-only edit preserves URLs. Use plain text such as `Latest Release`.                     |
| `ref` and `commit` | The upstream ref to fetch and exact commit to publish. Resolve and review both when updating the source.                                                            |

For example, set the next label to `Develop` and retain path `next` to keep existing
links. Set its path to `develop` to move those pages under `/docs/develop/`. Both
editions are assembled into a fresh artifact. Changing paths creates no redirect from the old path.

1. Edit only the fields needed. For a source update follow the [pin procedure](../contributing/development.md#updating-inputs)
   and review selected files, changed links and translation hashes.
2. Run `npm run check`. Acquire the pins with `npm run source:acquire` if needed.
   For a new stable release, set `translationSet` to its version in the source configuration, run `npm run translations:transfer -- --from next --to stable` and commit the
   [release translation snapshot](translations.md#transfer-between-editions) with the pin.
3. Run `npm run site:build`, `npm run site:verify` and `npm run search:verify`.
   Review the landing page and version switch in both locales before release.

Individual document routes follow the selected source paths. On an upstream move or rename,
review selection, sidebar references and translation records together. Old document URLs may
stop resolving after publication. Revisit redirects if a concrete compatibility need arises.

## Register an edition

Add its ID, unique public path and display label to `config/editions.json`. Set
`defaultEdition` to choose the default preview. Provide the same source, publication and
navigation files under `config/<id>/` as for the other editions. Acquire the pins, then
transfer translations into the new edition or initialize its manifest with an empty
`translations` array. The combined build, language-specific edition links and search
checks cover every registered edition.

## Stable release policy

The following rules apply while stable points to one particular gitlode release.

- The upstream release tag and commit fix the canonical English text. Every upstream correction,
  including a typo, arrives through a new gitlode release. Keep the original commit pin.
- Keep the release's approved document list, navigation structure and ordering. Correct a
  configuration defect in an explicit stable change and record the reason. For example, restore
  a guide accidentally omitted from the approved list. Schedule newly proposed additions,
  removals and navigation improvements for a future release.
- Publish stable near the package release even when translations are missing. Translators may
  subsequently add a translation or improve its fidelity to the pinned original. Review each
  translation against the stable source and store it under stable. A next translation cannot
  implicitly change a stable translation. A translated page title can change with its translation.
- Rebuild the complete site on republication. Shared renderer, theme and search implementation
  updates may change the generated site for a released edition.
