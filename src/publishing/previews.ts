import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { performance } from "node:perf_hooks";

import { parseSafeMarkdown, prepareMarkdown, routeFor } from "./markdown.ts";
import type { SourceTree } from "./markdown.ts";
import { git, safeDirectory, stage } from "./pipeline.ts";
import type { Sources, Publication } from "./pipeline.ts";
import { startPreview, withPreviews } from "./preview-server.ts";
import { loadTranslation } from "./translations.ts";
import { validateLocalization } from "./validate-localization.ts";
import { validateOutput, validateRendering } from "./validate-output.ts";
import { validateVersionNavigation } from "./validate-version.ts";

const root = resolve(import.meta.dirname, "../..");
type Candidate = "vitepress" | "starlight";
interface Document {
  sourcePath: string;
  stagedPath: string;
  sha256: string;
  sourceUrl: string;
}
interface Edition {
  name: string;
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

function write(root: string, path: string, content: string) {
  const parent = dirname(path);
  if (parent !== ".") safeDirectory(root, parent);
  writeFileSync(join(root, path), content, { flag: "wx" });
}

function sourceTree(commit: string): SourceTree {
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

export function preparePreviews(
  editionName = "next",
  options: { staging?: string; combined?: boolean } = {},
) {
  if (!["stable", "next"].includes(editionName)) throw new Error("Edition must be stable or next.");
  const staging =
    options.staging ??
    stage(
      root,
      json<Sources>(join(root, "config/sources.json")),
      json<Publication>(join(root, "config/publication.json")),
    );
  const manifest = json<Manifest>(join(staging, "manifest.json"));
  const edition = manifest.editions.find((e) => e.name === editionName);
  if (!edition) throw new Error("Missing edition in staging manifest.");
  const tree = sourceTree(edition.resolvedCommit);
  const routes = new Map(
    edition.documents.map((doc) => [doc.sourcePath, routeFor(doc.sourcePath)]),
  );
  if (new Set(routes.values()).size !== routes.size) throw new Error("Published route collision.");
  const navigation = json<Navigation>(join(root, "config/navigation.json"));
  const runs = safeDirectory(root, ".generated/previews");
  const output = mkdtempSync(join(runs, "run-"));
  const report = {
    edition: editionName,
    commit: edition.resolvedCommit,
    staging,
    candidates: {} as Record<
      Candidate,
      {
        root: string;
        base: string;
        pages: {
          route: string;
          sourcePath: string;
          sha256: string;
          locale: "en" | "ja";
          status: "canonical" | "missing" | "current" | "source-changed";
          snapshot: string;
        }[];
      }
    >,
  };
  for (const candidate of ["vitepress", "starlight"] as const) {
    const siteRoot = safeDirectory(output, candidate);
    const base = `/docs/${candidate}/${editionName}/`;
    const pages = edition.documents.flatMap((doc) => {
      const content = readFileSync(join(staging, doc.stagedPath));
      if (createHash("sha256").update(content).digest("hex") !== doc.sha256)
        throw new Error(`Staged content changed: ${doc.sourcePath}`);
      const translation = loadTranslation(root, editionName, doc.sourcePath, doc.sha256);
      return (["en", "ja"] as const).map((locale) => {
        const translated = locale === "ja" && translation.status !== "missing";
        const source = translated ? translation.content : content.toString("utf8");
        const status = locale === "en" ? ("canonical" as const) : translation.status;
        const contentLocale = translated ? "ja" : "en";
        const route = `${locale}/${routeFor(doc.sourcePath)}`;
        const snapshot = `snapshots/${route}source.md`;
        write(siteRoot, snapshot, source);
        return {
          ...doc,
          locale,
          route,
          status,
          snapshot,
          translationPath: translated ? translation.translationPath : undefined,
          checkedSourceSha256: translated ? translation.sourceSha256 : undefined,
          contentSha256: createHash("sha256").update(source).digest("hex"),
          ...prepareMarkdown(source, {
            sourcePath: doc.sourcePath,
            commit: edition.resolvedCommit,
            routes,
            tree,
            base: `${candidate === "vitepress" ? "/" : base}${contentLocale}/`,
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
          jaTitle:
            pages.find((p) => p.sourcePath === file && p.locale === "ja")?.title ?? page.title,
          route: routeFor(file),
        };
      }),
    }));
    write(
      siteRoot,
      "site.json",
      JSON.stringify(
        { edition: editionName, base, navigation: groups, combined: options.combined ?? false },
        null,
        2,
      ),
    );
    for (const page of pages) {
      // Leave absent Japanese entries to Starlight's native fallback.
      if (candidate === "starlight" && page.status === "missing") continue;
      const attribution = `\n\n---\n\n[Canonical English source](${page.sourceUrl}) · ${editionName} · commit \`${edition.resolvedCommit}\`\n`;
      const notice =
        page.status === "source-changed"
          ? "> 翻訳元の英語が更新されています。この翻訳は確認が必要です。\n\n"
          : "";
      const content =
        candidate === "vitepress"
          ? `---\ntranslationFallback: ${page.status === "missing"}\n---\n\n${notice}${page.markdown}`
          : `---\ntitle: ${JSON.stringify(page.title)}\n---\n\n${notice}${page.body}`;
      write(
        siteRoot,
        `${candidate === "vitepress" ? "content" : "src/content/docs"}/${page.route}index.md`,
        content + attribution,
      );
    }
    for (const locale of ["en", "ja"] as const) {
      const title =
        locale === "en"
          ? `gitlode ${editionName} documentation`
          : `gitlode ${editionName} ドキュメント`;
      const landing =
        pages
          .filter((p) => p.locale === locale)
          .map(
            (p) =>
              `- [${p.title.replace(/[\\`*{}\[\]()#+.!<>_]/g, "\\$&")}](${candidate === "vitepress" ? "/" : base}${p.route})`,
          )
          .join("\n") + "\n";
      parseSafeMarkdown(landing);
      write(
        siteRoot,
        `${candidate === "vitepress" ? "content" : "src/content/docs"}/${locale}/index.md`,
        (candidate === "vitepress"
          ? `# ${title}\n\n`
          : `---\ntitle: ${JSON.stringify(title)}\n---\n\n`) + landing,
      );
    }
    if (candidate === "vitepress")
      write(siteRoot, "content/index.md", "# gitlode\n\n[English](/en/) · [日本語](/ja/)\n");
    if (candidate === "vitepress") {
      safeDirectory(siteRoot, ".vitepress");
      copyFileSync(
        join(root, "candidates/vitepress/site.ts"),
        join(siteRoot, ".vitepress/site.ts"),
      );
      cpSync(join(root, "candidates/vitepress/theme"), join(siteRoot, ".vitepress/theme"), {
        recursive: true,
      });
      copyFileSync(
        join(root, "candidates/vitepress/config.ts"),
        join(siteRoot, ".vitepress/config.ts"),
      );
    } else {
      safeDirectory(siteRoot, "public");
      safeDirectory(siteRoot, "components");
      copyFileSync(
        join(root, "candidates/starlight/VersionedLanguageSelect.astro"),
        join(siteRoot, "components/VersionedLanguageSelect.astro"),
      );
      copyFileSync(join(root, "candidates/favicon.svg"), join(siteRoot, "public/favicon.svg"));
      copyFileSync(
        join(root, "candidates/starlight/astro.config.mjs"),
        join(siteRoot, "astro.config.mjs"),
      );
      copyFileSync(
        join(root, "candidates/starlight/content.config.ts"),
        join(siteRoot, "src/content.config.ts"),
      );
    }
    report.candidates[candidate] = {
      root: siteRoot,
      base,
      pages: pages.map(({ markdown: _markdown, body: _body, title: _title, ...page }) => page),
    };
  }
  write(output, "inputs.json", JSON.stringify(report, null, 2));
  return { output, report };
}

function cli(candidate: Candidate) {
  return join(
    root,
    candidate === "vitepress"
      ? "node_modules/vitepress/bin/vitepress.js"
      : "node_modules/astro/bin/astro.mjs",
  );
}

function buildEdition(edition: string, options: { staging?: string; combined?: boolean } = {}) {
  const { output, report } = preparePreviews(edition, options);
  const measurements: Record<string, number> = {};
  const validation: Record<string, ReturnType<typeof validateOutput>> = {};
  const localization: Record<string, ReturnType<typeof validateLocalization>[]> = {};
  const rendering: Record<string, ReturnType<typeof validateRendering>[]> = {};
  for (const candidate of ["vitepress", "starlight"] as const) {
    const started = performance.now();
    const siteRoot = report.candidates[candidate].root;
    execFileSync(
      process.execPath,
      [cli(candidate), "build", ...(candidate === "vitepress" ? [siteRoot] : ["--root", siteRoot])],
      { cwd: root, stdio: "inherit", env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" } },
    );
    measurements[candidate] = Math.round(performance.now() - started);
    if (!options.combined)
      validation[candidate] = validateOutput(
        join(siteRoot, "dist"),
        report.candidates[candidate].base,
        ["en/", "ja/", ...report.candidates[candidate].pages.map((p) => p.route)],
        candidate === "vitepress",
      );
    const site = json<{ navigation: { pages: { route: string }[] }[] }>(
      join(siteRoot, "site.json"),
    );
    const sidebarLinks = (locale: string) =>
      site.navigation.flatMap((group) =>
        group.pages.map((page) => report.candidates[candidate].base + locale + "/" + page.route),
      );
    localization[candidate] = report.candidates[candidate].pages.map((page) =>
      validateLocalization(
        readFileSync(join(siteRoot, "dist", page.route, "index.html"), "utf8"),
        candidate,
        page.locale,
        page.route.slice(3),
        report.candidates[candidate].base,
        page.status,
      ),
    );
    rendering[candidate] = report.candidates[candidate].pages.map((page) =>
      validateRendering(
        readFileSync(join(siteRoot, "dist", page.route, "index.html"), "utf8"),
        candidate,
        readFileSync(join(siteRoot, page.snapshot), "utf8"),
        sidebarLinks(page.locale),
      ),
    );
  }
  write(
    output,
    "build.json",
    JSON.stringify(
      { ...report, milliseconds: measurements, validation, rendering, localization },
      null,
      2,
    ),
  );
  return { output, report };
}

function selectPreview(output: string) {
  const latest = join(root, ".generated/preview.json");
  if (existsSync(latest) && lstatSync(latest).isSymbolicLink())
    throw new Error("Unsafe preview pointer.");
  writeFileSync(latest, JSON.stringify({ output }, null, 2));
}

export function buildPreviews(edition = "all") {
  if (edition !== "all") {
    const { output } = buildEdition(edition);
    selectPreview(output);
    console.log(`Built both candidates: ${output}`);
    return output;
  }
  const staging = stage(
    root,
    json<Sources>(join(root, "config/sources.json")),
    json<Publication>(join(root, "config/publication.json")),
  );
  const output = mkdtempSync(join(safeDirectory(root, ".generated/previews"), "combined-"));
  const dist = safeDirectory(output, "dist");
  const editions = (["stable", "next"] as const).map((name) =>
    buildEdition(name, { staging, combined: true }),
  );
  const expected: string[] = [];
  const versionNavigation: ReturnType<typeof validateVersionNavigation>[] = [];
  for (const { report } of editions) {
    if (report.edition !== "stable" && report.edition !== "next")
      throw new Error("Invalid built edition.");
    for (const candidate of ["vitepress", "starlight"] as const) {
      const site = report.candidates[candidate];
      const prefix = `${candidate}/${report.edition}/`;
      cpSync(join(site.root, "dist"), join(dist, prefix), {
        recursive: true,
        errorOnExist: true,
        force: false,
      });
      expected.push(
        ...["en/", "ja/", ...site.pages.map((page) => page.route)].map((route) => prefix + route),
      );
      for (const locale of ["en", "ja"] as const) {
        const routes = [
          "",
          ...site.pages.filter((page) => page.locale === locale).map((page) => page.route.slice(3)),
        ];
        for (const route of routes) {
          versionNavigation.push(
            validateVersionNavigation(
              readFileSync(join(dist, prefix, locale, route, "index.html"), "utf8"),
              candidate,
              report.edition,
              locale,
              route,
            ),
          );
        }
      }
    }
  }
  write(
    dist,
    "index.html",
    '<!doctype html><html lang="en"><meta charset="utf-8"><title>gitlode documentation comparison</title><h1>gitlode documentation comparison</h1>' +
      ["vitepress", "starlight"]
        .flatMap((candidate) =>
          ["stable", "next"].flatMap((name) =>
            ["en", "ja"].map(
              (locale) =>
                `<p><a href="/docs/${candidate}/${name}/${locale}/">${candidate} / ${name} / ${locale}</a></p>`,
            ),
          ),
        )
        .join("") +
      "</html>",
  );
  write(
    dist,
    "404.html",
    '<!doctype html><html lang="en"><meta charset="utf-8"><title>Not found</title><h1>Not found</h1><a href="/docs/">Documentation comparison</a></html>',
  );
  write(dist, ".nojekyll", "");
  const validation = validateOutput(dist, "/docs/", expected);
  const candidates = Object.fromEntries(
    ["vitepress", "starlight"].map((candidate) => [
      candidate,
      { root: output, base: "/docs/", entry: `${candidate}/next/en/` },
    ]),
  );
  write(
    output,
    "build.json",
    JSON.stringify(
      {
        edition: "all",
        staging,
        candidates,
        editions: editions.map(({ output: editionOutput, report }) => ({
          output: editionOutput,
          ...report,
        })),
        validation,
        versionNavigation,
      },
      null,
      2,
    ),
  );
  selectPreview(output);
  console.log(`Built complete comparison artifact: ${dist}`);
  return output;
}

function previewConfiguration(candidate: string, port?: number) {
  if (candidate !== "vitepress" && candidate !== "starlight")
    throw new Error("Unknown preview candidate.");
  const { output } = json<{ output: string }>(join(root, ".generated/preview.json"));
  const report = json<{
    edition: string;
    candidates: Record<Candidate, { root: string; base: string; entry?: string }>;
  }>(join(output, "build.json"));
  return {
    directory: join(report.candidates[candidate].root, "dist"),
    entry: report.candidates[candidate].entry ?? "en/",
    prefixes: report.edition === "all" ? [`${candidate}/stable/`, `${candidate}/next/`] : [""],
    base: report.candidates[candidate].base,
    port: port ?? (candidate === "vitepress" ? 4173 : 4174),
  };
}

export async function preview(candidate: string) {
  const config = previewConfiguration(candidate);
  const server = await startPreview(config.directory, config.base, config.port);
  console.log("Preview: " + server.url + config.entry);
  return server;
}

export async function verifyPreviews() {
  // Ephemeral ports avoid interfering with a developer's interactive previews.
  const configs = [previewConfiguration("vitepress", 0), previewConfiguration("starlight", 0)];
  await withPreviews(configs, async (previews) => {
    for (const [index, preview] of previews.entries()) {
      for (const prefix of configs[index].prefixes) {
        for (const [path, expected] of [
          ["en/", 200],
          ["ja/", 200],
          ["ja/profiling/", 200],
          ["ja/usage/", 200],
          ["en/design/plugins/", 200],
          ["not-found/", 404],
        ] as const) {
          const response = await fetch(preview.url + prefix + path, {
            signal: AbortSignal.timeout(5000),
          });
          await response.arrayBuffer();
          if (response.status !== expected)
            throw new Error(
              "Unexpected HTTP status: " + response.status + " for " + preview.url + prefix + path,
            );
        }
      }
      console.log("Verified: " + preview.url);
    }
  });
  console.log("Verification complete; all owned preview listeners and connections closed.");
}
