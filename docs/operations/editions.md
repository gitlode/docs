# Update an edition

Edit the appropriate entry in `config/sources.json`. The keys `stable` and `next`
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
3. Run `npm run site:build`, `npm run site:verify` and `npm run search:verify`.
   Review the landing page and version switch in both locales before release.

Individual document routes follow the selected source paths. On an upstream move or rename,
review selection, sidebar references and translation records together. Old document URLs may
stop resolving after publication. Revisit redirects if a concrete compatibility need arises.
