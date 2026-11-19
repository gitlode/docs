import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { loadSources, readDocument, safeDirectory, validatePublication } from "./pipeline.ts";
import type { Publication } from "./pipeline.ts";
import { readOwnedFile, validateTranslationManifest } from "./translations.ts";
import type { TranslationRecord } from "./translations.ts";

interface Release {
  ref: string;
  commit: string;
}

function releaseDirectory({ ref, commit }: Release) {
  if (!ref.startsWith("refs/tags/") || !/^[a-f0-9]{40}$/.test(commit))
    throw new Error("Stable translation preparation requires a pinned release tag.");
  const version = /^refs\/tags\/gitlode@(\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?)$/.exec(ref)?.[1];
  const key = version ?? "tag-" + createHash("sha256").update(ref).digest("hex");
  return `translations/ja/stable/${key}`;
}

export function stableTranslationManifest(root: string, release: Release) {
  const directory = releaseDirectory(release);
  const path = directory + "/manifest.json";
  if (!existsSync(join(root, path)))
    throw new Error(
      "Stable translations are not prepared. Run npm run translations:prepare-stable.",
    );
  const metadata = JSON.parse(readOwnedFile(root, path));
  if (metadata.ref !== release.ref || metadata.commit !== release.commit)
    throw new Error("Prepared stable translations do not match the pinned release.");
  const records = validateTranslationManifest(metadata);
  if (records.some((r) => r.edition !== "stable" || !r.translationPath.startsWith(directory + "/")))
    throw new Error("Stable translation outside its release directory.");
  return path;
}

export function prepareStableTranslations(
  root: string,
  release: Release = loadSources(root).editions.stable,
) {
  const directory = releaseDirectory(release);
  if (existsSync(join(root, directory))) {
    stableTranslationManifest(root, release);
    return { directory, prepared: false };
  }
  const publication: Publication = JSON.parse(
    readFileSync(join(root, "config/stable/publication.json"), "utf8"),
  );
  validatePublication(publication);
  const candidates = validateTranslationManifest(
    JSON.parse(readOwnedFile(root, "translations/manifest.json")),
  );
  const next = new Map(
    candidates.filter((r) => r.edition === "next").map((r) => [r.sourcePath, r]),
  );
  const pending = mkdtempSync(join(safeDirectory(root, ".generated"), "stable-translations-"));
  const translations: TranslationRecord[] = [];
  for (const path of publication.files) {
    const { sha256 } = readDocument(join(root, ".generated/source"), release.commit, path);
    const candidate = next.get(path);
    if (candidate?.sourceSha256 !== sha256) continue;
    const text = readOwnedFile(root, candidate.translationPath);
    safeDirectory(pending, dirname(path));
    writeFileSync(join(pending, path), text, { flag: "wx" });
    translations.push({ ...candidate, edition: "stable", translationPath: directory + "/" + path });
  }
  writeFileSync(
    join(pending, "manifest.json"),
    JSON.stringify({ ref: release.ref, commit: release.commit, translations }, null, 2) + "\n",
  );
  safeDirectory(root, dirname(directory));
  try {
    renameSync(pending, join(root, directory));
  } catch (error) {
    if (!existsSync(join(root, directory))) throw error;
    stableTranslationManifest(root, release);
    return { directory, prepared: false };
  }
  return {
    directory,
    prepared: true,
    inherited: translations.length,
    fallback: publication.files.length - translations.length,
  };
}
