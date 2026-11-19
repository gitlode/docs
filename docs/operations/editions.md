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

## Review a source update PR

Use a regular pull request in `gitlode/docs` for each source update.

- **Stable:** The gitlode release maintainer opens the PR when publishing the upstream
  package. The docs update can proceed with English fallback while translations are pending.
- **Next:** The developer who integrated upstream documentation changes opens the PR when
  those changes are ready for readers. One PR can include several related changes.

The maintainer selects the pin and opens the PR manually. The existing read-only
[validation workflow](../../.github/workflows/docs.yml) checks the proposed revision,
builds the site and verifies HTTP responses and search. Revisit automated PR creation or
cross-repository triggers if experience with this workflow shows a need.

1. Start from a clean docs checkout. Record the edition's current ref and commit, the intended
   upstream ref and its resolved commit. For an annotated release tag, use its peeled commit.
   Compare the two upstream trees before editing the pin.
2. In the target edition, review the selected paths, sidebar and relative links against the
   new tree. Include any selection or navigation changes in the pin-update PR. For a new
   release, include the new translation set and the transfer result in the same PR.
3. Commit the candidate inputs, then acquire, check, build and verify using the commands above.
   In the staging manifest, check the docs revision and dirty flag, each requested ref and
   resolved commit, and the canonical file hashes. In the combined build report, inspect the
   Japanese page statuses and verify both editions. Report any new fallbacks or changed-source
   notices so the maintainer can follow up through the ordinary translation workflow.
4. Record the tested docs revision and validation run in the PR. If the candidate fails,
   correct it and rebuild the complete site. The local preview pointer can still identify an
   earlier successful build. Successful HTTP or search checks against that preview do not
   validate the failed revision. Only a successful build from the candidate revision supplies
   a candidate artifact.

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
