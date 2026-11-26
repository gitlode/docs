# Maintain a Japanese translation

Select the edition and canonical path in its publication list. The pinned English Git blob
is the reference for that edition. A release can ship with missing translations.

## Decide whether to publish

When incorporating a new or revised translation, a human checks it against the English
original and decides whether readers should see it. Keep the draft in the proposed change
until that decision. Record the decision in the change that brings the translation into
the publication branch, such as its pull request.

An edition transfer can reuse a translation already accepted this way. The checked hash
determines whether the destination displays the source-change notice. A human reviews
subsequent edits when incorporating the revised wording.

## Transfer between editions

Use a transfer when preparing a complete replacement for an edition, such as a new stable release.
It replaces every file under `translations/ja/<to>/`, including drafts and unreferenced Markdown.
Git history can restore committed contents. Commit or save any work in the destination directory
before running the transfer on the PR branch.

Acquire the configured pins, then run `npm run translations:transfer -- --from next --to stable`.
Both arguments accept any registered edition ID. The command matches each path in the destination
publication list against the source manifest, copies the matching translation and retains its
checked English SHA-256. Relative links to targets that exist only at the origin become links at
that pinned upstream commit. Readers see a source-change notice when the checked hash differs
from the destination English file. Pages without a matching record use English fallback, including
every page when the result is an empty manifest.

Review the additions, changes and removals under the destination directory in the PR. Use the
`review` and `missing` counts to check source-change notices and fallbacks. Commit the manifest,
added Markdown and removed files together, then validate the edition. Repeating the transfer with
the same inputs produces the same destination files.

The command prepares the replacement before changing the destination. If a transfer is interrupted,
confirm that the process identified by `.generated/translation-transfer.lock` has exited. Inspect
the destination and the `previous` directory in the corresponding `.generated/transfer-<edition>-*`
run before retrying. Restore the saved directory if the destination was left absent, or recover
committed translations from Git. Remove the stale lock after checking the state.

## Add or correct a translation

Use `translations/ja/<edition>/manifest.json`. Store Markdown alongside or beneath that manifest.
Earlier revisions of the edition's translations are available in Git history.

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

## Apply a correction across editions

When reviewing a correction to a released translation, check whether the other edition needs it.
A fix that applies to both can edit both Markdown files in one PR. If the development edition's
English has diverged, adapt the translation to that original in the same PR or in a linked PR.
Check each affected edition against its pinned English before changing its recorded hash. An
edition-specific correction can be applied only where it is needed. Review these file edits in
the normal PR flow so corrections needed for the next release are carried forward.
