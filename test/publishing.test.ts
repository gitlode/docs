import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  git,
  readDocument,
  resolveCommit,
  safeDirectory,
  stage,
  validatePath,
  validatePublication,
  validateSources,
} from "../src/publishing/pipeline.ts";
import type { Sources } from "../src/publishing/pipeline.ts";

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
  return { root, repository, sources, commit };
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
  const publication = JSON.parse(readFileSync("config/publication.json", "utf8"));
  const navigation = JSON.parse(readFileSync("config/navigation.json", "utf8"));
  validatePublication(publication);
  validateSources(JSON.parse(readFileSync("config/sources.json", "utf8")));
  for (const group of navigation.groups)
    for (const path of group.files) assert.ok(publication.files.includes(path));
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
  const output = stage(root, sources, { files: [file] });
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
  const repeated = stage(root, sources, { files: [file] });
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
  assert.throws(
    () => stage(root, sources, { files: [file, "packages/gitlode/docs/profiling.md"] }),
    /Missing/,
  );
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
