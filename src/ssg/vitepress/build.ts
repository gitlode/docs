import { execFileSync } from "node:child_process";
import { cpSync, existsSync, lstatSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { performance } from "node:perf_hooks";

import { prepareContent } from "../../publishing/content.ts";
import { parseSafeMarkdown } from "../../publishing/markdown.ts";
import { safeDirectory, stage } from "../../publishing/pipeline.ts";
import type { Sources, Publication } from "../../publishing/pipeline.ts";
import { startPreview, withPreviews } from "../../publishing/preview-server.ts";
import { validateOutput } from "../../publishing/validate-output.ts";
import { validateLocalization } from "./validate-localization.ts";
import { validateRendering } from "./validate-rendering.ts";
import { validateVersionNavigation } from "./validate-version.ts";

const root = resolve(import.meta.dirname, "../../..");
function json<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}
function write(directory: string, path: string, content: string) {
  if (dirname(path) !== ".") safeDirectory(directory, dirname(path));
  writeFileSync(join(directory, path), content, { flag: "wx" });
}

export function prepareSite(
  edition = "next",
  options: { staging?: string; combined?: boolean } = {},
) {
  // VitePress adds the deployment base to site-root Markdown links.
  const content = prepareContent(root, edition, "/", options);
  const output = mkdtempSync(join(safeDirectory(root, ".generated/previews"), "run-"));
  const siteRoot = safeDirectory(output, "site");
  const { path, label } = content.versions[edition];
  const base = `/docs/${path}/`;
  write(
    siteRoot,
    "site.json",
    JSON.stringify(
      {
        edition,
        base,
        versions: content.versions,
        navigation: content.navigation,
        combined: options.combined ?? false,
      },
      null,
      2,
    ),
  );
  for (const page of content.pages) {
    write(siteRoot, page.snapshot, page.source);
    const attribution = `\n\n---\n\n[Canonical English source](${page.sourceUrl}) · ${label} · commit \`${content.commit}\`\n`;
    const notice =
      page.status === "source-changed"
        ? "> 翻訳元の英語が更新されています。この翻訳は確認が必要です。\n\n"
        : "";
    write(
      siteRoot,
      `content/${page.route}index.md`,
      `---\ntranslationFallback: ${page.status === "missing"}\n---\n\n${notice}${page.markdown}${attribution}`,
    );
  }
  for (const locale of ["en", "ja"] as const) {
    const title =
      locale === "en" ? `gitlode ${label} documentation` : `gitlode ${label} ドキュメント`;
    const landing =
      content.pages
        .filter((p) => p.locale === locale)
        .map((p) => `- [${p.title.replace(/[\\\x60*{}\[\]()#+.!<>_]/g, "\\$&")}](/${p.route})`)
        .join("\n") + "\n";
    parseSafeMarkdown(landing);
    write(siteRoot, `content/${locale}/index.md`, `# ${title}\n\n${landing}`);
  }
  write(siteRoot, "content/index.md", "# gitlode\n\n[English](/en/) · [日本語](/ja/)\n");
  safeDirectory(siteRoot, ".vitepress");
  for (const file of ["site.ts", "config.ts", "theme"])
    cpSync(join(root, "site/vitepress", file), join(siteRoot, ".vitepress", file), {
      recursive: true,
    });
  const report = {
    edition,
    versions: content.versions,
    path,
    label,
    commit: content.commit,
    staging: content.staging,
    root: siteRoot,
    base,
    pages: content.pages.map(
      ({ source: _source, markdown: _markdown, body: _body, title: _title, ...page }) => page,
    ),
  };
  write(output, "inputs.json", JSON.stringify(report, null, 2));
  return { output, report, navigation: content.navigation };
}

function buildEdition(edition: string, options: { staging?: string; combined?: boolean } = {}) {
  const { output, report, navigation } = prepareSite(edition, options);
  const started = performance.now();
  execFileSync(
    process.execPath,
    [join(root, "node_modules/vitepress/bin/vitepress.js"), "build", report.root],
    { cwd: root, stdio: "inherit" },
  );
  const milliseconds = Math.round(performance.now() - started);
  const validation = options.combined
    ? undefined
    : validateOutput(join(report.root, "dist"), report.base, [
        "en/",
        "ja/",
        ...report.pages.map((p) => p.route),
      ]);
  const localization = report.pages.map((page) =>
    validateLocalization(
      readFileSync(join(report.root, "dist", page.route, "index.html"), "utf8"),
      page.locale,
      page.route.slice(3),
      report.base,
      page.status,
    ),
  );
  const rendering = report.pages.map((page) =>
    validateRendering(
      readFileSync(join(report.root, "dist", page.route, "index.html"), "utf8"),
      readFileSync(join(report.root, page.snapshot), "utf8"),
      navigation.flatMap((g) => g.pages.map((p) => report.base + page.locale + "/" + p.route)),
    ),
  );
  const build = { ...report, milliseconds, validation, localization, rendering };
  write(output, "build.json", JSON.stringify(build, null, 2));
  return { output, report: build };
}

function selectPreview(output: string) {
  const latest = join(root, ".generated/preview.json");
  if (existsSync(latest) && lstatSync(latest).isSymbolicLink())
    throw new Error("Unsafe preview pointer.");
  writeFileSync(latest, JSON.stringify({ output }, null, 2));
}

export function buildSite(edition = "all") {
  if (edition !== "all") {
    const result = buildEdition(edition);
    selectPreview(result.output);
    console.log(`Built documentation: ${result.output}`);
    return result.output;
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
    cpSync(join(report.root, "dist"), join(dist, report.path), {
      recursive: true,
      errorOnExist: true,
      force: false,
    });
    expected.push(
      ...["en/", "ja/", ...report.pages.map((p) => p.route)].map(
        (route) => `${report.path}/${route}`,
      ),
    );
    for (const locale of ["en", "ja"] as const) {
      const routes = [
        "",
        ...report.pages.filter((p) => p.locale === locale).map((p) => p.route.slice(3)),
      ];
      for (const route of routes)
        versionNavigation.push(
          validateVersionNavigation(
            readFileSync(join(dist, report.path, locale, route, "index.html"), "utf8"),
            report.edition,
            locale,
            route,
            report.versions,
          ),
        );
    }
  }
  write(
    dist,
    "index.html",
    '<!doctype html><html lang="en"><meta charset="utf-8"><title>gitlode documentation</title><h1>gitlode documentation</h1>' +
      editions
        .flatMap(({ report }) =>
          ["en", "ja"].map(
            (locale) =>
              `<p><a href="/docs/${report.path}/${locale}/">${report.label} / ${locale}</a></p>`,
          ),
        )
        .join("") +
      "</html>",
  );
  write(
    dist,
    "404.html",
    '<!doctype html><html lang="en"><meta charset="utf-8"><title>Not found</title><h1>Not found</h1><a href="/docs/">Documentation</a></html>',
  );
  write(dist, ".nojekyll", "");
  const validation = validateOutput(dist, "/docs/", expected);
  write(
    output,
    "build.json",
    JSON.stringify(
      {
        edition: "all",
        root: output,
        base: "/docs/",
        entry: editions[1].report.path + "/en/",
        staging,
        editions: editions.map(({ output, report }) => ({ output, ...report })),
        validation,
        versionNavigation,
      },
      null,
      2,
    ),
  );
  selectPreview(output);
  console.log(`Built complete documentation artifact: ${dist}`);
  return output;
}

function previewConfiguration(port = 4173) {
  const { output } = json<{ output: string }>(join(root, ".generated/preview.json"));
  const report = json<{
    edition: string;
    root: string;
    base: string;
    entry?: string;
    editions?: { base: string }[];
  }>(join(output, "build.json"));
  if (!report.root || !report.base)
    throw new Error("Rebuild with npm run site:build before previewing.");
  return {
    directory: join(report.root, "dist"),
    base: report.base,
    entry: report.entry ?? "en/",
    prefixes: report.editions?.map((e) => e.base.slice(report.base.length)) ?? [""],
    port,
  };
}
export async function preview() {
  const config = previewConfiguration();
  const server = await startPreview(config.directory, config.base, config.port);
  console.log("Preview: " + server.url + config.entry);
  return server;
}
export async function verifySite() {
  const config = previewConfiguration(0);
  await withPreviews([config], async ([server]) => {
    console.log("Owned verification port: " + server.port);
    for (const prefix of config.prefixes)
      for (const [path, expected] of [
        ["en/", 200],
        ["ja/", 200],
        ["ja/profiling/", 200],
        ["ja/usage/", 200],
        ["en/design/plugins/", 200],
        ["not-found/", 404],
      ] as const) {
        const response = await fetch(server.url + prefix + path, {
          signal: AbortSignal.timeout(5000),
        });
        await response.arrayBuffer();
        if (response.status !== expected)
          throw new Error(
            `Unexpected HTTP status ${response.status}: ${server.url + prefix + path}`,
          );
      }
    console.log("Verified: " + server.url);
  });
  console.log("Verification complete; all owned preview listeners and connections closed.");
}
