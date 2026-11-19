# Maintain a Japanese translation

Select the edition and canonical path in its publication list. The pinned English Git blob
is the reference for that edition. A release can ship with missing translations.

## Decide whether to publish

When incorporating a new or revised translation, a human checks it against the English
original and decides whether readers should see it. Keep the draft in the proposed change
until that decision. Record the decision in the change that brings the translation into
the publication branch, such as its pull request.

An edition transfer can reuse a translation already accepted this way. The checked hash
determines whether the destination displays the source-difference notice. A human reviews
subsequent edits when incorporating the revised wording.

## Transfer between editions

After acquiring the configured pins, run `npm run translations:transfer -- --from next --to stable`.
Either argument accepts any registered edition ID. Swap the arguments for the reverse direction.
The destination publication list determines the candidate paths. An existing destination record
always wins, including a translation corrected after an earlier transfer.

For each missing destination record with a matching source path, copy the translation and retain
its checked English SHA-256. Readers see the copy with a review notice if the destination's
English blob differs. A missing source translation uses English fallback. Relative links whose
targets exist only at the origin are pinned to that upstream revision in the copied Markdown.
Commit the destination manifest and new Markdown files together. Re-running the command fills
any newly eligible gaps. An interrupted command can leave an unreferenced copy; only manifest
entries are published. If a process was killed and left `.transfer.lock`, confirm that it has
exited before removing that lock and retrying.

## Add or correct a translation

Use `translations/ja/<edition>/manifest.json`. When the edition source config selects a
`translationSet`, use the manifest in that subdirectory instead. This lets operators keep
separate release snapshots for any edition. On a new release choose a fresh set and transfer
into it. A newly created set records its configured ref and commit. For a continuously moving
edition, use the default directory. Store Markdown alongside or beneath the corresponding manifest.

1. Run `npm run content:stage` after acquiring the configured pins. Open the resulting
   `manifest.json` and locate the document by edition name and `sourcePath`. Use its
   `sourceUrl` to inspect the exact English revision and its `sha256` for the translation record.
2. Add or edit the Markdown under `translations/ja/<edition>/`. Keep commands, output
   examples and link destinations faithful to the original. Relative links resolve from
   the canonical English document's directory.
3. In the edition's manifest, maintain one record for the edition, locale and canonical
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
