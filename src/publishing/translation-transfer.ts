import {
  closeSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

import { prepareMarkdown, prepareTransferLinks, sourceTree } from "./markdown.ts";
import {
  loadSources,
  readDocument,
  safeDirectory,
  validateEdition,
  validatePublication,
} from "./pipeline.ts";
import type { Publication } from "./pipeline.ts";
import {
  readOwnedFile,
  readTranslationManifest,
  validateTranslationManifest,
} from "./translations.ts";
import type { TranslationRecord } from "./translations.ts";

function replaceDirectory(target: string, replacement: string, previous: string) {
  const existing = lstatSync(target, { throwIfNoEntry: false });
  if (existing && (!existing.isDirectory() || existing.isSymbolicLink()))
    throw new Error(`Unsafe destination translation directory: ${target}.`);
  if (existing) renameSync(target, previous);
  try {
    renameSync(replacement, target);
  } catch (error) {
    if (existing) {
      try {
        renameSync(previous, target);
      } catch (restoreError) {
        throw new AggregateError(
          [error, restoreError],
          `Could not restore ${target}. Previous translations are in ${previous}.`,
        );
      }
    }
    throw error;
  }
}

export function transferTranslations(
  root: string,
  from: string,
  to: string,
  sources = loadSources(root),
) {
  validateEdition(from);
  validateEdition(to);
  if (from === to || !Object.hasOwn(sources.editions, from) || !Object.hasOwn(sources.editions, to))
    throw new Error("Select two distinct registered editions.");
  const origin = sources.editions[from];
  const destination = sources.editions[to];
  const generated = safeDirectory(root, ".generated");
  const lock = join(generated, "translation-transfer.lock");
  const fd = openSync(lock, "wx");
  try {
    writeFileSync(fd, `${process.pid}\n`);
    const candidates = readTranslationManifest(root, from);
    const publication: Publication = JSON.parse(
      readFileSync(join(root, "config", to, "publication.json"), "utf8"),
    );
    validatePublication(publication);
    const originTree = sourceTree(root, origin.commit);
    const destinationTree = sourceTree(root, destination.commit);
    const pending = mkdtempSync(join(generated, `transfer-${to}-`));
    const previous = join(pending, "previous");
    let installed = false;
    try {
      const replacement = safeDirectory(pending, "replacement");
      const target = join(safeDirectory(root, "translations/ja"), to);
      const records: TranslationRecord[] = [];
      const routes = new Map<string, string>();
      let review = 0;
      for (const sourcePath of publication.files) {
        const { sha256 } = readDocument(join(generated, "source"), destination.commit, sourcePath);
        const candidate = candidates.get(sourcePath);
        if (!candidate) continue;
        const source = readOwnedFile(root, candidate.translationPath);
        const content = prepareTransferLinks(
          source,
          { sourcePath, commit: origin.commit, tree: originTree, routes, base: "/" },
          destinationTree,
        );
        prepareMarkdown(content, {
          sourcePath,
          commit: destination.commit,
          tree: destinationTree,
          routes,
          base: "/",
        });
        safeDirectory(replacement, dirname(sourcePath));
        writeFileSync(join(replacement, sourcePath), content, { flag: "wx" });
        records.push({
          ...candidate,
          edition: to,
          translationPath: `translations/ja/${to}/${sourcePath}`,
        });
        if (candidate.sourceSha256 !== sha256) review++;
      }
      const data = { translations: records };
      validateTranslationManifest(data);
      writeFileSync(join(replacement, "manifest.json"), JSON.stringify(data, null, 2) + "\n");
      replaceDirectory(target, replacement, previous);
      installed = true;
      return {
        from,
        to,
        copied: records.length,
        review,
        missing: publication.files.length - records.length,
      };
    } finally {
      // Keep the backup if a failed installation could not restore it.
      if (installed || !existsSync(previous)) rmSync(pending, { recursive: true, force: true });
    }
  } finally {
    closeSync(fd);
    unlinkSync(lock);
  }
}
