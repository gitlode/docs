import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import { safeDirectory } from "../src/publishing/pipeline.ts";
import {
  loadTranslation,
  translationFreshness,
  validateTranslationManifest,
} from "../src/publishing/translations.ts";

const sourcePath = "packages/gitlode/docs/profiling.md";
const hash = "a".repeat(64);
const record = {
  edition: "next",
  locale: "ja",
  sourcePath,
  sourceSha256: hash,
  translationPath: "translations/ja/next/profiling.md",
};
const scratch = safeDirectory(resolve("."), ".generated/tests");

function fixture(entries: unknown[] = [record], createTranslation = true) {
  const root = mkdtempSync(join(scratch, "translations-"));
  safeDirectory(root, "translations/ja/next");
  writeFileSync(
    join(root, "translations/manifest.json"),
    JSON.stringify({ translations: entries }),
  );
  if (createTranslation)
    writeFileSync(join(root, record.translationPath), "# プロファイリング\n\n日本語の例です。\n");
  return root;
}

test("translation freshness uses only canonical file identity and allows review without editing translation", () => {
  const root = fixture();
  const current = loadTranslation(root, "next", sourcePath, hash);
  assert.equal(current.status, "current");
  assert.match(current.content, /日本語/);
  assert.equal(loadTranslation(root, "next", sourcePath, "b".repeat(64)).status, "source-changed");
  // Unrelated repository changes cannot affect this comparison: there is no commit identity input.
  assert.equal(translationFreshness(hash, hash), "current");
  writeFileSync(
    join(root, "translations/manifest.json"),
    JSON.stringify({ translations: [{ ...record, sourceSha256: "b".repeat(64) }] }),
  );
  const reviewed = loadTranslation(root, "next", sourcePath, "b".repeat(64));
  assert.equal(reviewed.status, "current");
  assert.equal(reviewed.content, current.content);
});

test("missing records fall back but declared absent files and absent manifest fail", () => {
  assert.deepEqual(loadTranslation(fixture([]), "next", sourcePath, hash), { status: "missing" });
  assert.throws(
    () => loadTranslation(fixture([record], false), "next", sourcePath, hash),
    /Missing or unreadable translation file/,
  );
  const root = mkdtempSync(join(scratch, "no-manifest-"));
  assert.throws(() => loadTranslation(root, "next", sourcePath, hash), /manifest\.json/);
});

test("next translations are never substituted for stable even when source hashes match", () => {
  assert.deepEqual(loadTranslation(fixture(), "stable", sourcePath, hash), { status: "missing" });
  assert.throws(() => loadTranslation(fixture(), "development", sourcePath, hash), /edition/);
});

test("manifest validates schema, hashes, publication policy, duplicates, and edition-specific paths", () => {
  for (const invalid of [null, [], {}, { translations: {} }, { translations: [null] }]) {
    assert.throws(() => validateTranslationManifest(invalid));
  }
  for (const entry of [
    { ...record, sourceSha256: "commit" },
    { ...record, locale: "en" },
    { ...record, sourcePath: "packages/gitlode/docs/handoff/README.md" },
    { ...record, translationPath: "translations/ja/stable/profiling.md" },
    { ...record, translationPath: "translations/ja/next/../secret.md" },
    { ...record, translationPath: "translations/ja/next/a.mdx" },
    { ...record, translationPath: "C:/outside.md" },
  ])
    assert.throws(() => validateTranslationManifest({ translations: [entry] }));
  assert.throws(() => validateTranslationManifest({ translations: [record, record] }), /Duplicate/);
  assert.throws(
    () =>
      validateTranslationManifest({
        translations: [record, { ...record, sourcePath: "packages/gitlode/docs/usage.md" }],
      }),
    /Duplicate/,
  );
});

test("translation reads reject symlink or junction directories", () => {
  const root = fixture([{ ...record, translationPath: "translations/ja/next/link/profiling.md" }]);
  const external = mkdtempSync(join(scratch, "external-translation-"));
  writeFileSync(join(external, "profiling.md"), "# Outside\n");
  symlinkSync(
    external,
    join(root, "translations/ja/next/link"),
    process.platform === "win32" ? "junction" : "dir",
  );
  assert.throws(() => loadTranslation(root, "next", sourcePath, hash), /Unsafe translation path/);
});

test("manifest itself cannot be reached through a symlink or junction", () => {
  const root = mkdtempSync(join(scratch, "manifest-link-"));
  const external = mkdtempSync(join(scratch, "external-manifest-"));
  mkdirSync(join(external, "files"));
  writeFileSync(join(external, "manifest.json"), JSON.stringify({ translations: [] }));
  symlinkSync(
    external,
    join(root, "translations"),
    process.platform === "win32" ? "junction" : "dir",
  );
  assert.throws(() => loadTranslation(root, "next", sourcePath, hash), /Unsafe translation path/);
});
