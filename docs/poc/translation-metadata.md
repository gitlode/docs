# Translation metadata evaluation

Status: implemented for the localization PoC. Decision authority: human project owner.
Next action: review stable snapshot policy during the combined-edition increment. Retain this note
until that policy is decided, then archive or retire it.

The implemented contract is maintained in [architecture](../design/architecture.md#translation-boundary).
Tests cover unchanged files despite unrelated repository changes, changed files, review by updating
the recorded hash, missing records, invalid declarations, symlinks, and edition isolation.

A declared missing file fails instead of silently falling back. `current` means source identity
matches; it is not a translation quality or approval status. The Japanese example explicitly states
that human language review is pending. Stable snapshot policy remains open.
