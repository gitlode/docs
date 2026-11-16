# Translation metadata proposal

Status: proposed, not implemented. Decision authority: human project owner.
Next action: validate during the localization milestone; migrate accepted contracts to durable
architecture documentation when implemented, and retire this draft after recording the outcome.

Future translation records should contain `sourcePath`, `sourceSha256`, `locale`, `edition`, and
`translationPath`. Compare with the selected canonical file, not a repository-wide commit:

| Condition                                       | State                          |
| ----------------------------------------------- | ------------------------------ |
| No translation record/file                      | Missing                        |
| Translation exists and source file hash matches | Checked against current source |
| Translation exists and source file hash differs | Source changed; review needed  |

Source changed does not prove a semantic translation defect. A maintainer can confirm that no
translation edit is needed and update the recorded hash. Stable snapshot policy is still open;
do not silently substitute next translations. Metadata logic and Japanese examples are not yet
implemented. The current per-file manifest hashes supply the future comparison input.
