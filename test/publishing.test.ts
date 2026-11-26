import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs, {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import type { PathLike } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { basename, join, resolve } from "node:path";
import test from "node:test";

import { prepareContent } from "../src/publishing/content.ts";
import {
  git,
  loadSources,
  readDocument,
  resolveCommit,
  safeDirectory,
  stage,
  validatePath,
  validatePublication,
  validateSources,
} from "../src/publishing/pipeline.ts";
import type { Sources } from "../src/publishing/pipeline.ts";
import { transferTranslations } from "../src/publishing/translation-transfer.ts";
import { loadTranslation, readTranslationManifest } from "../src/publishing/translations.ts";

const scratch = safeDirectory(resolve("."), ".generated/tests");
const file = "packages/gitlode/docs/usage.md";
const repositoryUrl = "https://github.com/gitlode/gitlode.git";

function fixture() {
  const root = mkdtempSync(join(scratch, "fixture-"));
  const repository = safeDirectory(root, ".generated/source");
  git(repository, ["init"]);
  const parent = safeDirectory(repository, "packages/gitlode/docs");
  writeFileSync(join(parent, "usage.md"), "# Usage\n\n## Example\n\n```ts\nconst x = 1;\n```\n");
  git(repository, ["add", "."]);
  git(repository, [
    "-c",
    "user.name=Test",
    "-c",
    "user.email=test@example.invalid",
    "-c",
    "commit.gpgsign=false",
    "commit",
    "-m",
    "Fixture",
  ]);
  const commit = resolveCommit(repository, "HEAD");
  const sources: Sources = {
    repository: repositoryUrl,
    editions: {
      stable: { path: "stable", label: "stable", ref: "refs/tags/example", commit },
      next: { path: "next", label: "next", ref: "refs/heads/main", commit },
    },
  };
  for (const edition of ["stable", "next"]) {
    const directory = safeDirectory(root, "config/" + edition);
    writeFileSync(join(directory, "publication.json"), JSON.stringify({ files: [file] }));
    writeFileSync(
      join(directory, "navigation.json"),
      JSON.stringify({ groups: [{ label: "Guides", files: [file] }] }),
    );
  }
  return { root, repository, sources, commit };
}

function transferFixture() {
  const state = fixture();
  const next = safeDirectory(state.root, "translations/ja/next");
  const nextManifest = join(next, "manifest.json");
  const candidate = {
    edition: "next",
    locale: "ja",
    sourcePath: file,
    translationPath: "translations/ja/next/usage.md",
    sourceSha256: "a".repeat(64),
  };
  writeFileSync(nextManifest, JSON.stringify({ translations: [candidate] }));
  writeFileSync(join(state.root, candidate.translationPath), "# Japanese");
  return { ...state, candidate, nextManifest };
}

test("paths reject traversal, Windows special paths, absolute paths and alternate streams", () => {
  for (const path of [
    "../usage.md",
    "a/../b.md",
    "/tmp/x",
    "C:/tmp/x",
    "a\\b.md",
    "a//b",
    "a/./b",
    "a/NUL.md",
    "a:b",
    "a/%2e%2e/b",
  ]) {
    assert.throws(() => validatePath(path), /Unsafe/);
  }
  assert.equal(validatePath(file), file);
});

test("publication excludes agent, handoff, executable MDX and duplicate paths", () => {
  for (const path of [
    "AGENTS.md",
    "packages/gitlode/docs/agents/README.md",
    "packages/gitlode/docs/handoff/README.md",
    "packages/gitlode/docs/design/test.mdx",
    "packages/gitlode/docs/design/agents/README.md",
  ]) {
    assert.throws(() => validatePublication({ files: [path] }), /policy/);
  }
  assert.throws(() => validatePublication({ files: [file, file] }), /Duplicate/);
  assert.throws(() => validatePublication({ files: [] }), /select/);
});

test("configured navigation is a subset of explicit publication", () => {
  const sources = loadSources(".");
  for (const id of Object.keys(sources.editions)) {
    const publication = JSON.parse(readFileSync(join("config", id, "publication.json"), "utf8"));
    validatePublication(publication);
    const navigation = JSON.parse(readFileSync(join("config", id, "navigation.json"), "utf8"));
    for (const group of navigation.groups)
      for (const path of group.files) assert.ok(publication.files.includes(path));
  }
});

test("next selection and navigation edits leave stable documents, links and sidebar intact", () => {
  const { root, repository, sources } = fixture();
  const guide = "packages/gitlode/docs/profiling.md";
  writeFileSync(join(repository, guide), "# Profiling");
  writeFileSync(join(repository, file), "# Usage\\n\\n[Profiling](profiling.md)");
  git(repository, ["add", "."]);
  git(repository, [
    "-c",
    "user.name=Test",
    "-c",
    "user.email=test@example.invalid",
    "-c",
    "commit.gpgsign=false",
    "commit",
    "-m",
    "Add guide",
  ]);
  const commit = resolveCommit(repository, "HEAD");
  for (const source of Object.values(sources.editions)) source.commit = commit;
  writeFileSync(
    join(safeDirectory(root, "translations/ja/next"), "manifest.json"),
    JSON.stringify({ translations: [] }),
  );
  function content(id: string) {
    const { pages, navigation } = prepareContent(root, id, "/", { staging: stage(root, sources) });
    return { pages, navigation };
  }
  transferTranslations(root, "next", "stable", sources);
  const stable = content("stable");
  writeFileSync(
    join(root, "config/next/publication.json"),
    JSON.stringify({ files: [file, guide] }),
  );
  writeFileSync(
    join(root, "config/next/navigation.json"),
    JSON.stringify({ groups: [{ label: "Next only", files: [guide, file] }] }),
  );
  const next = content("next");
  assert.equal(next.navigation[0].pages[0].route, "profiling/");
  assert.ok(next.pages[0].markdown.includes("/en/profiling/"));
  assert.ok(stable.pages[0].markdown.includes("github.com/gitlode/gitlode/blob/"));
  assert.deepEqual(content("stable"), stable);
});

test("transfer replaces destination translations, removes unused files, and preserves checked hashes", () => {
  const { root, sources, repository, commit, candidate } = transferFixture();
  const hash = readDocument(repository, commit, file).sha256;
  const result = { from: "next", to: "stable", copied: 1, review: 1, missing: 0 };
  assert.deepEqual(transferTranslations(root, "next", "stable", sources), result);
  const records = readTranslationManifest(root, "stable");
  const received = loadTranslation(root, file, hash, records);
  assert.equal(received.status, "source-changed");
  assert.equal(received.sourceSha256, candidate.sourceSha256);
  const stableCopy = join(root, received.translationPath);
  const obsolete = join(safeDirectory(root, "translations/ja/stable/obsolete"), "draft.md");
  writeFileSync(obsolete, "# No longer referenced");
  writeFileSync(stableCopy, "# Stable correction");
  for (let attempt = 0; attempt < 2; attempt++) {
    assert.deepEqual(transferTranslations(root, "next", "stable", sources), result);
    assert.deepEqual(readTranslationManifest(root, "stable"), records);
    assert.equal(readFileSync(stableCopy, "utf8"), "# Japanese");
    assert.equal(existsSync(obsolete), false);
    assert.equal(readFileSync(join(root, candidate.translationPath), "utf8"), "# Japanese");
  }
  writeFileSync(stableCopy, "# Stable correction");
  assert.equal(transferTranslations(root, "stable", "next", sources).copied, 1);
  const reverse = loadTranslation(root, file, hash, readTranslationManifest(root, "next"));
  assert.equal(reverse.status, "source-changed");
  assert.equal(reverse.content, "# Stable correction");
  assert.equal(existsSync(join(root, candidate.translationPath)), false);
});

test("transfer applies the destination publication list for any registered edition", () => {
  const { root, sources, repository, commit, candidate, nextManifest } = transferFixture();
  const hash = readDocument(repository, commit, file).sha256;
  sources.editions.lts = { ...sources.editions.next, path: "lts" };
  writeFileSync(
    join(safeDirectory(root, "config/lts"), "publication.json"),
    JSON.stringify({ files: [file] }),
  );
  writeFileSync(
    nextManifest,
    JSON.stringify({
      translations: [
        { ...candidate, sourceSha256: hash },
        {
          ...candidate,
          sourcePath: "packages/gitlode/docs/profiling.md",
          translationPath: "translations/ja/next/profiling.md",
        },
      ],
    }),
  );
  assert.deepEqual(transferTranslations(root, "next", "lts", sources), {
    from: "next",
    to: "lts",
    copied: 1,
    review: 0,
    missing: 0,
  });
  assert.equal(
    loadTranslation(root, file, hash, readTranslationManifest(root, "lts")).status,
    "current",
  );
});

test("a valid empty transfer clears the destination and produces English fallback", () => {
  const { root, sources, nextManifest } = transferFixture();
  assert.equal(transferTranslations(root, "next", "stable", sources).copied, 1);
  writeFileSync(nextManifest, JSON.stringify({ translations: [] }));
  assert.deepEqual(transferTranslations(root, "next", "stable", sources), {
    from: "next",
    to: "stable",
    copied: 0,
    review: 0,
    missing: 1,
  });
  assert.deepEqual(readdirSync(join(root, "translations/ja/stable")), ["manifest.json"]);
  const prepared = prepareContent(root, "stable", "/", { staging: stage(root, sources) });
  assert.equal(prepared.pages.find((page) => page.locale === "ja")?.status, "missing");
});

test("missing transfer input leaves the previous translation directory intact", () => {
  const { root, sources, candidate, nextManifest } = transferFixture();
  transferTranslations(root, "next", "stable", sources);
  const stableManifest = join(root, "translations/ja/stable/manifest.json");
  const previous = readFileSync(stableManifest);
  unlinkSync(join(root, candidate.translationPath));
  assert.throws(
    () => transferTranslations(root, "next", "stable", sources),
    /unreadable translation/,
  );
  writeFileSync(nextManifest, JSON.stringify({ translations: [] }));
  writeFileSync(
    join(root, "config/stable/publication.json"),
    JSON.stringify({ files: ["packages/gitlode/docs/profiling.md"] }),
  );
  assert.throws(() => transferTranslations(root, "next", "stable", sources), /selected file/);
  assert.deepEqual(readFileSync(stableManifest), previous);
  assert.equal(readFileSync(join(root, "translations/ja/stable", file), "utf8"), "# Japanese");
});

test("transfer restores the previous directory when installation fails", (t) => {
  const { root, sources, candidate } = transferFixture();
  transferTranslations(root, "next", "stable", sources);
  writeFileSync(join(root, candidate.translationPath), "# Updated Japanese");
  const target = join(root, "translations/ja/stable");
  const rename = fs.renameSync;
  const mocked = t.mock.method(fs, "renameSync", (from: PathLike, to: PathLike) => {
    if (basename(String(from)) === "replacement" && to === target)
      throw new Error("Installation failed");
    rename(from, to);
  });
  syncBuiltinESMExports();
  try {
    assert.throws(
      () => transferTranslations(root, "next", "stable", sources),
      /Installation failed/,
    );
  } finally {
    mocked.mock.restore();
    syncBuiltinESMExports();
  }
  assert.equal(readFileSync(join(target, file), "utf8"), "# Japanese");
  assert.equal(readTranslationManifest(root, "stable").size, 1);
  transferTranslations(root, "next", "stable", sources);
  assert.equal(readFileSync(join(target, file), "utf8"), "# Updated Japanese");
});

test("transfer refuses a linked destination directory and respects the shared lock", () => {
  const { root, sources, candidate } = transferFixture();
  const origin = join(root, "translations/ja/next");
  symlinkSync(
    origin,
    join(root, "translations/ja/stable"),
    process.platform === "win32" ? "junction" : "dir",
  );
  assert.throws(() => transferTranslations(root, "next", "stable", sources), /Unsafe destination/);
  assert.equal(readFileSync(join(root, candidate.translationPath), "utf8"), "# Japanese");
  const lock = join(root, ".generated/translation-transfer.lock");
  writeFileSync(lock, "locked", { flag: "wx" });
  assert.throws(() => transferTranslations(root, "stable", "next", sources), { code: "EEXIST" });
  assert.equal(readFileSync(lock, "utf8"), "locked");
});

test("source pins and edition names are validated before IO", () => {
  const { sources } = fixture();
  assert.throws(
    () => validateSources({ ...sources, repository: "file:///tmp/source" }),
    /repository/,
  );
  assert.throws(
    () => validateSources({ ...sources, editions: { "../x": sources.editions.next } }),
    /editions/,
  );
  sources.editions.next.commit = "main";
  assert.throws(() => validateSources(sources), /full commit/);
});

test("staging preserves exact Git bytes, excludes unselected files, records per-file identity and is repeatable", () => {
  const { root, repository, sources, commit } = fixture();
  writeFileSync(join(repository, file), "UNCOMMITTED CONTENT MUST NOT APPEAR");
  const output = stage(root, sources);
  const manifest = JSON.parse(readFileSync(join(output, "manifest.json"), "utf8"));
  assert.equal(manifest.editions.length, 2);
  for (const edition of manifest.editions) {
    assert.equal(edition.resolvedCommit, commit);
    assert.equal(edition.documents.length, 1);
    const document = edition.documents[0];
    const original = git(repository, ["show", `${commit}:${file}`]);
    assert.deepEqual(readFileSync(join(output, document.stagedPath)), original);
    assert.equal(document.sha256, createHash("sha256").update(original).digest("hex"));
    assert.equal(
      document.blob,
      git(repository, ["rev-parse", `${commit}:${file}`])
        .toString()
        .trim(),
    );
    assert.ok(document.sourceUrl.includes(commit));
  }
  const repeated = stage(root, sources);
  assert.notEqual(repeated, output);
  assert.deepEqual(
    readFileSync(join(repeated, "manifest.json")),
    readFileSync(join(output, "manifest.json")),
  );
});

test("missing selected files and invalid revisions fail with actionable errors", () => {
  const { root, repository, sources, commit } = fixture();
  assert.throws(() => resolveCommit(repository, "not-a-ref"), /Cannot resolve commit/);
  assert.throws(
    () => readDocument(repository, commit, "packages/gitlode/docs/profiling.md"),
    /Missing or non-regular/,
  );
  writeFileSync(
    join(root, "config/next/publication.json"),
    JSON.stringify({ files: [file, "packages/gitlode/docs/profiling.md"] }),
  );
  assert.throws(() => stage(root, sources), /Missing/);
  assert.deepEqual(readdirSync(join(root, ".generated")), ["source"]);
});

test("Git symlink blobs cannot enter publication", () => {
  const { repository, commit } = fixture();
  const blob = git(repository, ["rev-parse", `${commit}:${file}`])
    .toString()
    .trim();
  git(repository, [
    "update-index",
    "--add",
    "--cacheinfo",
    `120000,${blob},packages/gitlode/docs/profiling.md`,
  ]);
  git(repository, [
    "-c",
    "user.name=Test",
    "-c",
    "user.email=test@example.invalid",
    "-c",
    "commit.gpgsign=false",
    "commit",
    "-m",
    "Symlink fixture",
  ]);
  assert.throws(
    () =>
      readDocument(
        repository,
        resolveCommit(repository, "HEAD"),
        "packages/gitlode/docs/profiling.md",
      ),
    /non-regular/,
  );
});

test("output rejects path escape and symlink/junction components", () => {
  const root = mkdtempSync(join(scratch, "paths-"));
  const outside = mkdtempSync(join(scratch, "outside-"));
  assert.throws(() => safeDirectory(root, "../escape"), /under generated root/);
  mkdirSync(join(root, "generated"));
  symlinkSync(
    outside,
    join(root, "generated", "link"),
    process.platform === "win32" ? "junction" : "dir",
  );
  assert.throws(() => safeDirectory(root, "generated/link/subdir"), /Unsafe output/);
  assert.deepEqual(readdirSync(outside), []);
});
