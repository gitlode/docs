import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import { safeDirectory } from "../src/publishing/pipeline.ts";
import {
  loadTranslation,
  readTranslationManifest,
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
    join(root, "translations/ja/next/manifest.json"),
    JSON.stringify({ translations: entries }),
  );
  if (createTranslation)
    writeFileSync(join(root, record.translationPath), "# プロファイリング\n\n日本語の例です。\n");
  safeDirectory(root, "translations/ja/stable");
  writeFileSync(
    join(root, "translations/ja/stable/manifest.json"),
    JSON.stringify({ translations: [] }),
  );
  return root;
}

function translation(root: string, edition: string, sha256 = hash) {
  return loadTranslation(root, sourcePath, sha256, readTranslationManifest(root, edition));
}

test("translation freshness uses only canonical file identity and allows review without editing translation", () => {
  const root = fixture();
  const current = translation(root, "next");
  assert.equal(current.status, "current");
  assert.match(current.content, /日本語/);
  assert.equal(translation(root, "next", "b".repeat(64)).status, "source-changed");
  // Unrelated repository changes cannot affect this comparison: there is no commit identity input.
  assert.equal(translationFreshness(hash, hash), "current");
  writeFileSync(
    join(root, "translations/ja/next/manifest.json"),
    JSON.stringify({ translations: [{ ...record, sourceSha256: "b".repeat(64) }] }),
  );
  const reviewed = translation(root, "next", "b".repeat(64));
  assert.equal(reviewed.status, "current");
  assert.equal(reviewed.content, current.content);
});

test("missing records fall back but declared absent files and absent manifest fail", () => {
  assert.deepEqual(translation(fixture([]), "next"), { status: "missing" });
  assert.throws(
    () => translation(fixture([record], false), "next"),
    /Missing or unreadable translation file/,
  );
  const root = mkdtempSync(join(scratch, "no-manifest-"));
  assert.throws(() => readTranslationManifest(root, "next"), /manifest\.json/);
});

test("next translations are never substituted for stable even when source hashes match", () => {
  assert.deepEqual(translation(fixture(), "stable"), { status: "missing" });
  assert.throws(() => readTranslationManifest(fixture(), "../development"), /edition/);
  const foreign = {
    ...record,
    edition: "stable",
    translationPath: "translations/ja/stable/profiling.md",
  };
  assert.throws(() => readTranslationManifest(fixture([foreign]), "next"), /Unexpected edition/);
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
  assert.throws(() => translation(root, "next"), /Unsafe translation path/);
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
  assert.throws(() => readTranslationManifest(root, "next"), /Unsafe translation path/);
});
