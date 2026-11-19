import { appendFileSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const { GITHUB_OUTPUT, GITHUB_STEP_SUMMARY, GITHUB_SHA, GITHUB_RUN_ID, GITHUB_RUN_ATTEMPT } =
  process.env;
if (!GITHUB_OUTPUT || !GITHUB_STEP_SUMMARY || !GITHUB_SHA || !GITHUB_RUN_ID || !GITHUB_RUN_ATTEMPT)
  throw new Error("Expected GitHub Actions run metadata.");

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const { output } = read(".generated/preview.json");
if (dirname(output) !== resolve(".generated/previews") || !basename(output).startsWith("combined-"))
  throw new Error("Expected a complete combined preview.");
const build = read(join(output, "build.json"));
const manifest = read(join(build.staging, "manifest.json"));
if (
  build.edition !== "all" ||
  build.root !== output ||
  build.base !== "/docs/" ||
  manifest.docsRevision !== GITHUB_SHA ||
  manifest.docsDirty !== false
)
  throw new Error("Candidate must come from the clean selected docs revision.");

const artifact = `github-pages-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}`;
const summary = [
  "### Verified Pages candidate",
  "",
  `Docs commit: \`${GITHUB_SHA}\``,
  "",
  `Pages artifact: \`${artifact}\``,
  "",
];
for (const edition of manifest.editions)
  summary.push(
    `- \`${edition.name}\`: \`${edition.requestedRef}\` at \`${edition.resolvedCommit}\` (${edition.documents.length} documents)`,
  );

appendFileSync(GITHUB_STEP_SUMMARY, summary.join("\n") + "\n");
appendFileSync(GITHUB_OUTPUT, `dist=${join(output, "dist")}\nartifact_name=${artifact}\n`);
