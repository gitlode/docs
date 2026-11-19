import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { parseSafeMarkdown, prepareMarkdown, routeFor } from "./markdown.ts";
import type { SourceTree } from "./markdown.ts";
import { git, stage } from "./pipeline.ts";
import { stableTranslationManifest } from "./stable-translations.ts";
import { loadTranslation } from "./translations.ts";
interface Document {
  sourcePath: string;
  stagedPath: string;
  sha256: string;
  sourceUrl: string;
}
interface Edition {
  name: string;
  requestedRef: string;
  path?: string;
  label?: string;
  resolvedCommit: string;
  documents: Document[];
}
interface Manifest {
  editions: Edition[];
}
interface Navigation {
  groups: { label: string; files: string[] }[];
}
function json<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}
function sourceTree(root: string, commit: string): SourceTree {
  const tree: SourceTree = new Map();
  for (const line of git(join(root, ".generated/source"), ["ls-tree", "-r", "-t", "-z", commit])
    .toString()
    .split("\0")) {
    if (!line) continue;
    const match = /^(\d+) (blob|tree|commit) [a-f0-9]+\t(.+)$/.exec(line);
    if (!match) throw new Error("Unexpected Git tree entry.");
    tree.set(match[3], { mode: match[1], type: match[2] });
  }
  return tree;
}

/** Prepare selected content without importing a renderer or writing renderer-specific files. */
export function prepareContent(
  root: string,
  editionName: string,
  linkBase: string,
  options: { staging?: string } = {},
) {
  if (!["stable", "next"].includes(editionName)) throw new Error("Edition must be stable or next.");
  const staging = options.staging ?? stage(root);
  const manifest = json<Manifest>(join(staging, "manifest.json"));
  const edition = manifest.editions.find((e) => e.name === editionName);
  if (!edition) throw new Error("Missing edition in staging manifest.");
  const translationManifest =
    editionName === "stable"
      ? stableTranslationManifest(root, {
          ref: edition.requestedRef,
          commit: edition.resolvedCommit,
        })
      : undefined;
  const tree = sourceTree(root, edition.resolvedCommit);
  const routes = new Map(
    edition.documents.map((doc) => [doc.sourcePath, routeFor(doc.sourcePath)]),
  );
  if (new Set([...routes.values()].map((route) => route.toLowerCase())).size !== routes.size)
    throw new Error("Published route collision.");
  const navigation = json<Navigation>(join(root, "config", editionName, "navigation.json"));
  const pages = edition.documents.flatMap((doc) => {
    const content = readFileSync(join(staging, doc.stagedPath));
    if (createHash("sha256").update(content).digest("hex") !== doc.sha256)
      throw new Error(`Staged content changed: ${doc.sourcePath}`);
    const translation = loadTranslation(
      root,
      editionName,
      doc.sourcePath,
      doc.sha256,
      translationManifest,
    );
    return (["en", "ja"] as const).map((locale) => {
      const translated = locale === "ja" && translation.status !== "missing";
      const source = translated ? translation.content : content.toString("utf8");
      const status = locale === "en" ? ("canonical" as const) : translation.status;
      const contentLocale = translated ? "ja" : "en";
      const route = `${locale}/${routeFor(doc.sourcePath)}`;
      const snapshot = `snapshots/${route}source.md`;

      return {
        ...doc,
        locale,
        route,
        status,
        snapshot,
        source,
        translationPath: translated ? translation.translationPath : undefined,
        checkedSourceSha256: translated ? translation.sourceSha256 : undefined,
        contentSha256: createHash("sha256").update(source).digest("hex"),
        ...prepareMarkdown(source, {
          sourcePath: doc.sourcePath,
          commit: edition.resolvedCommit,
          routes,
          tree,
          base: `${linkBase}${contentLocale}/`,
        }),
      };
    });
  });
  const groups = navigation.groups.map((group) => ({
    label: group.label,
    pages: group.files.map((file) => {
      const page = pages.find((p) => p.sourcePath === file && p.locale === "en");
      if (!page) throw new Error(`Sidebar contains unpublished page: ${file}`);
      return {
        title: page.title,
        jaTitle: pages.find((p) => p.sourcePath === file && p.locale === "ja")?.title ?? page.title,
        route: routeFor(file),
      };
    }),
  }));

  for (const group of groups) for (const page of group.pages) parseSafeMarkdown(page.title);
  return {
    edition: editionName,
    versions: Object.fromEntries(
      manifest.editions.map((e) => [e.name, { path: e.path ?? e.name, label: e.label ?? e.name }]),
    ),
    commit: edition.resolvedCommit,
    staging,
    pages,
    navigation: groups,
  };
}
