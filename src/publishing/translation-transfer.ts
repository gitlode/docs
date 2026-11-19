import { createHash } from "node:crypto";
import {
  existsSync,
  mkdtempSync,
  openSync,
  closeSync,
  unlinkSync,
  renameSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

import { prepareTransferLinks, sourceTree } from "./markdown.ts";
import { loadSources, readDocument, safeDirectory, validatePublication } from "./pipeline.ts";
import type { Source } from "./pipeline.ts";
import { readOwnedFile, validateTranslationManifest } from "./translations.ts";

type Input = Pick<Source, "commit" | "ref" | "translationSet">;

function directory(id: string, input: Input) {
  return ["translations/ja", id, input.translationSet].filter(Boolean).join("/");
}

function readManifest(root: string, id: string, input: Input) {
  const base = directory(id, input);
  const data = JSON.parse(readOwnedFile(root, base + "/manifest.json"));
  if (
    (data.ref !== undefined || data.commit !== undefined) &&
    (data.ref !== input.ref || data.commit !== input.commit)
  )
    throw new Error("Translation manifest does not match the pinned source.");
  const records = validateTranslationManifest(data);
  if (
    records.some(
      (record) => record.edition !== id || !record.translationPath.startsWith(base + "/"),
    )
  )
    throw new Error("Translation outside the selected edition or translation set.");
  return { data, records };
}

export function editionManifest(root: string, id: string, input: Input) {
  readManifest(root, id, input);
  return directory(id, input) + "/manifest.json";
}

export function transferTranslations(
  root: string,
  from: string,
  to: string,
  sources = loadSources(root),
) {
  if (from === to || !Object.hasOwn(sources.editions, from) || !Object.hasOwn(sources.editions, to))
    throw new Error("Select two distinct registered editions.");
  const origin = sources.editions[from];
  const destination = sources.editions[to];
  const base = directory(to, destination);
  const output = safeDirectory(root, base);
  const manifest = join(output, "manifest.json");
  const lock = join(output, ".transfer.lock");
  const fd = openSync(lock, "wx");
  try {
    const candidates = readManifest(root, from, origin).records;
    const existing = existsSync(manifest)
      ? readManifest(root, to, destination)
      : {
          data: destination.translationSet
            ? { ref: destination.ref, commit: destination.commit }
            : {},
          records: [],
        };
    const publication = JSON.parse(
      readFileSync(join(root, "config", to, "publication.json"), "utf8"),
    );
    validatePublication(publication);
    const origins = new Map(candidates.map((r) => [r.sourcePath, r]));
    const selected = new Set(existing.records.map((r) => r.sourcePath));
    const originTree = sourceTree(root, origin.commit);
    const destinationTree = sourceTree(root, destination.commit);
    const pending = mkdtempSync(join(safeDirectory(root, ".generated"), "transfer-"));
    let copied = 0,
      review = 0,
      missing = 0;
    for (const path of publication.files as string[]) {
      if (selected.has(path)) continue;
      const candidate = origins.get(path);
      if (!candidate) {
        missing++;
        continue;
      }
      const { sha256 } = readDocument(join(root, ".generated/source"), destination.commit, path);
      const source = readOwnedFile(root, candidate.translationPath);
      const content = prepareTransferLinks(
        source,
        { sourcePath: path, commit: origin.commit, tree: originTree, routes: new Map(), base: "/" },
        destinationTree,
      );
      const hash = createHash("sha256").update(content).digest("hex");
      const translationPath = base + "/copied/" + hash.slice(0, 16) + "/" + path;
      const file = join(root, translationPath);
      safeDirectory(root, dirname(translationPath));
      const staged = join(pending, String(copied));
      writeFileSync(staged, content, { flag: "wx" });
      if (existsSync(file)) {
        if (readOwnedFile(root, translationPath) !== content)
          throw new Error("Existing translation file conflict: " + translationPath);
      } else renameSync(staged, file);
      existing.records.push({ ...candidate, edition: to, translationPath });
      copied++;
      if (candidate.sourceSha256 !== sha256) review++;
    }
    if (copied || !existsSync(manifest)) {
      const data = { ...existing.data, translations: existing.records };
      validateTranslationManifest(data);
      const temp = join(pending, "manifest.json");
      writeFileSync(temp, JSON.stringify(data, null, 2) + "\n");
      renameSync(temp, manifest);
    }
    return { from, to, copied, review, missing };
  } finally {
    closeSync(fd);
    unlinkSync(lock);
  }
}
