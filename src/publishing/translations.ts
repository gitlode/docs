import { lstatSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { validatePath, validatePublication } from "./pipeline.ts";

export interface TranslationRecord {
  edition: "stable" | "next";
  locale: "ja";
  sourcePath: string;
  sourceSha256: string;
  translationPath: string;
}

export type TranslationResult =
  | { status: "missing" }
  | {
      status: "current" | "source-changed";
      content: string;
      translationPath: string;
      sourceSha256: string;
    };

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateHash(value: unknown): asserts value is string {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) {
    throw new Error("Translation source identity must be a lowercase SHA-256 hash.");
  }
}

/** File-level identity intentionally excludes repository commits and timestamps. */
export function translationFreshness(checkedHash: string, currentHash: string) {
  validateHash(checkedHash);
  validateHash(currentHash);
  return checkedHash === currentHash ? "current" : "source-changed";
}

export function validateTranslationManifest(value: unknown): TranslationRecord[] {
  if (!object(value) || !Array.isArray(value.translations)) {
    throw new Error("translations/manifest.json must contain a translations array.");
  }
  const keys = new Set<string>();
  const paths = new Set<string>();
  return value.translations.map((entry: unknown) => {
    if (
      !object(entry) ||
      (entry.edition !== "stable" && entry.edition !== "next") ||
      entry.locale !== "ja" ||
      typeof entry.sourcePath !== "string" ||
      typeof entry.translationPath !== "string"
    ) {
      throw new Error(
        "Invalid translation record: expected edition, ja locale, sourcePath, sourceSha256, and translationPath.",
      );
    }
    validatePublication({ files: [entry.sourcePath] });
    validateHash(entry.sourceSha256);
    validatePath(entry.translationPath);
    if (
      !entry.translationPath.startsWith(`translations/ja/${entry.edition}/`) ||
      !entry.translationPath.endsWith(".md")
    ) {
      throw new Error(
        `Translation must be Markdown inside translations/ja/${entry.edition}/: ${entry.translationPath}`,
      );
    }
    const key = `${entry.edition}:${entry.sourcePath}`.toLowerCase();
    const pathKey = entry.translationPath.toLowerCase();
    if (keys.has(key) || paths.has(pathKey)) {
      throw new Error(`Duplicate translation record or file: ${entry.sourcePath}`);
    }
    keys.add(key);
    paths.add(pathKey);
    return {
      edition: entry.edition,
      locale: entry.locale,
      sourcePath: entry.sourcePath,
      sourceSha256: entry.sourceSha256,
      translationPath: entry.translationPath,
    };
  });
}

export function readOwnedFile(root: string, relativePath: string): string {
  validatePath(relativePath);
  let cursor = resolve(root);
  // Refuse a symlink/junction in the selected root or its ancestors as well as below it.
  for (let ancestor = cursor; ;) {
    if (lstatSync(ancestor).isSymbolicLink())
      throw new Error(`Unsafe translation directory: ${ancestor}`);
    const parent = resolve(ancestor, "..");
    if (parent === ancestor) break;
    ancestor = parent;
  }
  const parts = relativePath.split("/");
  for (const [index, part] of parts.entries()) {
    cursor = join(cursor, part);
    let stat;
    try {
      stat = lstatSync(cursor);
    } catch (error) {
      throw new Error(
        `Missing or unreadable translation file: ${relativePath}. Check translations/manifest.json.`,
        { cause: error },
      );
    }
    if (
      stat.isSymbolicLink() ||
      (index === parts.length - 1 ? !stat.isFile() : !stat.isDirectory())
    ) {
      throw new Error(
        `Unsafe translation path (symlinks and non-regular files are forbidden): ${relativePath}`,
      );
    }
  }
  return readFileSync(cursor, "utf8");
}

export function loadTranslation(
  root: string,
  edition: string,
  sourcePath: string,
  currentSha256: string,
  manifestPath = "translations/manifest.json",
): TranslationResult {
  if (edition !== "stable" && edition !== "next")
    throw new Error("Translation edition must be stable or next.");
  validatePublication({ files: [sourcePath] });
  validateHash(currentSha256);
  const raw = readOwnedFile(root, manifestPath);
  let manifest: unknown;
  try {
    manifest = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in ${manifestPath}.`, { cause: error });
  }
  const record = validateTranslationManifest(manifest).find(
    (entry) => entry.edition === edition && entry.sourcePath === sourcePath,
  );
  if (!record) return { status: "missing" };
  // A declared translation disappearing is a configuration failure, not missing-page fallback.
  return {
    status: translationFreshness(record.sourceSha256, currentSha256),
    content: readOwnedFile(root, record.translationPath),
    translationPath: record.translationPath,
    sourceSha256: record.sourceSha256,
  };
}
