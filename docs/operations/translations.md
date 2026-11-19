# Maintain a Japanese translation

Select the edition and canonical path in its publication list. The pinned English Git blob
is the reference for that edition. A release can ship with missing translations.

1. Run `npm run content:stage` after acquiring the configured pins. Open the resulting
   `manifest.json` and locate the document by edition name and `sourcePath`. Use its
   `sourceUrl` to inspect the exact English revision and its `sha256` for the translation record.
2. Add or edit the Markdown under `translations/ja/<edition>/`. Keep commands, output
   examples and link destinations faithful to the original. Relative links resolve from
   the canonical English document's directory.
3. In `translations/manifest.json`, maintain one record for the edition, locale and canonical
   path. Set `sourceSha256` to the hash of the English text actually checked. A Japanese-only
   correction against the same original keeps the existing hash.
4. When the original changes, compare its previous and current texts and check the affected
   passages. Update the checked hash after review, even when the existing Japanese remains accurate.
   Until then the site displays the translation with a source-change notice. An unchanged
   file remains current across a commit change.
5. Build the site and verify the Japanese route, language switch, links and examples using the
   [edition verification procedure](editions.md). A missing record produces the English fallback
   with a Japanese notice. A record pointing to a missing file fails validation.

Stable corrections and additions follow the [stable release policy](editions.md#stable-release-policy).
The file hash establishes which English text was checked. Record language review separately in
the change that introduces or corrects a translation.
