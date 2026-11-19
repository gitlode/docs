import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import MiniSearch from "minisearch";
import { parse } from "parse5";
import type { DefaultTreeAdapterMap } from "parse5";
import { tokenizeSearchText } from "vitepress/dist/client/shared.js";

import { withPreviews } from "../../publishing/preview-server.ts";

interface Match {
  url: string;
  title: string;
}
const root = resolve(import.meta.dirname, "../../..");
const { output } = JSON.parse(readFileSync(join(root, ".generated/preview.json"), "utf8")) as {
  output: string;
};
interface SearchEdition {
  edition: string;
  base: string;
  pages: { route: string; status: string }[];
}
const build = JSON.parse(readFileSync(join(output, "build.json"), "utf8")) as {
  edition: string;
  editions: SearchEdition[];
};
if (build.edition !== "all")
  throw new Error("Search verification requires the complete two-edition build.");
const dist = join(output, "dist");
const queries = [
  "profiling",
  "OpenTelemetry",
  "プロファイリング",
  "ヒストグラム",
  "カウンター",
  "CLI",
  "全体",
  "zzzznomatchgitlode",
];
const report = {
  output,
  generatedAt: new Date().toISOString(),
  method: "Built search-engine APIs, not browser UI interactions",
  results: [] as {
    edition: string;
    locale: string;
    query: string;
    matches: Match[];
  }[],
};

function validateTarget(url: string, prefix: string) {
  const target = new URL(url, "https://search.invalid");
  if (target.origin !== "https://search.invalid" || !target.pathname.startsWith(prefix))
    throw new Error(`Search result escapes edition/locale: ${url}`);
  const path = decodeURIComponent(target.pathname.slice("/docs/".length));
  if (path.includes("\\") || path.includes("\0") || path.split("/").includes(".."))
    throw new Error(`Unsafe search result: ${url}`);
  const file = join(dist, path, "index.html");
  if (!existsSync(file) || !lstatSync(file).isFile())
    throw new Error(`Search result has no output page: ${url}`);
  if (target.hash) {
    const id = decodeURIComponent(target.hash.slice(1));
    let found = false;
    function visit(node: DefaultTreeAdapterMap["node"]): void {
      if ("tagName" in node && node.attrs.some((attr) => attr.name === "id" && attr.value === id))
        found = true;
      if ("childNodes" in node) for (const child of node.childNodes) visit(child);
    }
    visit(parse(readFileSync(file, "utf8")));
    if (!found) throw new Error(`Search result has no output fragment: ${url}`);
  }
}

function record(
  { edition, base, pages }: SearchEdition,
  locale: string,
  query: string,
  matches: Match[],
) {
  for (const match of matches) validateTarget(match.url, `${base}${locale}/`);
  const baseline = query === "profiling" ? "profiling/" : query === "CLI" ? "usage/" : undefined;
  if (
    baseline &&
    pages.some((page) => page.route === locale + "/" + baseline) &&
    matches.length === 0
  )
    throw new Error(`Missing baseline search results: ${edition}/${locale}/${query}`);
  if (
    pages.some((page) => page.route === "ja/profiling/" && page.status !== "missing") &&
    locale === "ja" &&
    query === "プロファイリング" &&
    !matches.some((match) =>
      new URL(match.url, "https://search.invalid").pathname.endsWith("/ja/profiling/"),
    )
  )
    throw new Error(`Missing Japanese profiling result: ${edition}/${locale}`);
  if (query === "zzzznomatchgitlode" && matches.length)
    throw new Error(`Unexpected match for no-result probe: ${edition}/${locale}`);
  report.results.push({ edition, locale, query, matches });
  console.log(`${edition}/${locale}: ${query} -> ${matches.length}`);
}

await withPreviews([{ directory: dist, base: "/docs/", port: 0 }], async ([preview]) => {
  console.log("Search probe listener: " + preview.url);
  for (const selected of build.editions) {
    const { edition, base } = selected;
    const prefix = base.slice("/docs/".length);
    for (const locale of ["en", "ja"]) {
      const chunkDirectory = join(dist, prefix, "assets/chunks");
      if (!existsSync(chunkDirectory))
        throw new Error("Missing edition search assets; rebuild the VitePress-only site first.");
      const chunk = readdirSync(chunkDirectory).find((name) =>
        name.startsWith(`@localSearchIndex${locale}.`),
      );
      if (!chunk) throw new Error(`Missing search chunk: ${edition}/${locale}`);
      // Verify that the browser-facing index asset is served at the expected deployment URL.
      const response = await fetch(`${preview.url}${prefix}assets/chunks/${chunk}`, {
        signal: AbortSignal.timeout(5000),
      });
      const served = await response.text();
      const chunkPath = join(chunkDirectory, chunk);
      if (!response.ok || served !== readFileSync(chunkPath, "utf8"))
        throw new Error(`Search asset HTTP mismatch: ${edition}/${locale}`);
      // Match the pinned VitePress UI tokenizer and result URL resolution.
      const module = (await import(pathToFileURL(chunkPath).href)) as { default: string };
      const index = MiniSearch.loadJSON<{ title: string; titles: string[] }>(module.default, {
        tokenize: tokenizeSearchText,
        fields: ["title", "titles", "text"],
        storeFields: ["title", "titles"],
        searchOptions: { fuzzy: 0.2, prefix: true, boost: { title: 4, text: 2, titles: 1 } },
      });
      for (const query of queries) {
        record(
          selected,
          locale,
          query,
          index.search(query).map((result) => ({
            url: `${base.slice(0, -1)}${String(result.id)}`,
            title: String(result.title),
          })),
        );
      }
    }
  }
});
writeFileSync(join(output, "search.json"), JSON.stringify(report, null, 2));
console.log(`Search verification complete: ${join(output, "search.json")}; owned listener closed.`);
