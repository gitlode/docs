# Development environment alignment feedback

Status: open feedback. No cross-project adoption has been approved.
Recorded: 2026-11-16. Decision authority: human owner and each project's maintainers.
Review point: a separate tooling-alignment review scheduled by the owner.

## Context and evidence

The projects share many developers. Align tooling where it reduces context switching and maintenance
knowledge, and allow improvements to flow back from the documentation project to gitlode itself.
The inspected upstream baseline is
[`90512564`](https://github.com/gitlode/gitlode/tree/90512564d76490088ecc99da7596128df1c45a2c).
Its CI selects Node `22`; its package manifest uses caret dependency ranges, and the inspected tree
has neither `.node-version` nor a root `.npmrc`. These are baseline observations, not promises
about later upstream revisions.

The documentation project added `.node-version` and `.npmrc` during bootstrap for reproducibility
and early environment checks. Neither is specific to documentation publishing or inherently required.

## Suggestions for later review

| Topic                    | Current documentation-project choice                                                            | Suggestion and trade-off                                                                                                                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Development Node version | `.node-version` contains `22.23.4`; CI reads it                                                 | Consider the same file convention upstream to share the local/CI baseline. Exact patch pins improve consistency but require intentional updates. The file needs a compatible version manager or CI consumer; it does not switch Node by itself.                     |
| Dependency save policy   | `.npmrc` sets `save-exact=true`                                                                 | Decide jointly whether exact versions or caret ranges better fit update workflows. Exact saves are not necessary for locked installation: a committed lockfile and `npm ci` already serve that purpose. Keeping upstream's caret convention is a valid alternative. |
| Environment enforcement  | `.npmrc` sets `engine-strict=true`; local engines allow Node `>=22.23.4 <23` and npm `>=11 <12` | Review supported development ranges before aligning enforcement. Strict checking fails early but also rejects newer, possibly compatible environments.                                                                                                              |

Keep the recommended development runtime distinct from the gitlode product's supported runtime
range. Agreeing on a development version does not justify narrowing compatibility for product users.
For npm behavior, see the [configuration reference](https://docs.npmjs.com/cli/v11/using-npm/config/).

## Current local decision and next action

Use the current settings for this repository while each project reviews the proposal independently.

At the later review, compare developer version-manager usage, CI maintenance cost, supported Node/npm
ranges, and dependency-update practices. Record each project's decision independently. If accepted,
implement changes in separately authorized work and update the durable development guide; otherwise
record why the divergence remains useful. Close or supersede this proposal when those outcomes are
recorded. No upstream issue, pull request, or configuration change has been made by this proposal.
