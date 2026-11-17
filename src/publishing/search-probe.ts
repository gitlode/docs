import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import MiniSearch from "minisearch";
import { parse } from "parse5";
import type { DefaultTreeAdapterMap } from "parse5";

import { withPreviews } from "./preview-server.ts";

interface Match {
  url: string;
  title: string;
}
interface PagefindInstance {
  init(): Promise<void>;
  destroy(): Promise<void>;
  search(query: string): Promise<{
    results: { data(): Promise<{ url: string; meta: { title: string } }> }[];
  }>;
}
interface PagefindModule {
  createInstance(options: { basePath: string; baseUrl: string }): PagefindInstance;
}
interface ProbeDocument {
  currentScript: null;
  querySelector(selector: string): { getAttribute(name: string): string };
}

const root = resolve(import.meta.dirname, "../..");
const { output } = JSON.parse(readFileSync(join(root, ".generated/preview.json"), "utf8")) as {
  output: string;
};
const build = JSON.parse(readFileSync(join(output, "build.json"), "utf8")) as { edition: string };
if (build.edition !== "all")
  throw new Error("Search comparison requires the combined preview build.");
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
    candidate: string;
    edition: string;
    locale: string;
    query: string;
    matches: Match[];
  }[],
};

function validateTarget(url: string, prefix: string) {
  const target = new URL(url, "https://search.invalid");
  if (target.origin !== "https://search.invalid" || !target.pathname.startsWith(prefix))
    throw new Error(`Search result escapes candidate/edition/locale: ${url}`);
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
  candidate: string,
  edition: string,
  locale: string,
  query: string,
  matches: Match[],
) {
  for (const match of matches)
    validateTarget(match.url, `/docs/${candidate}/${edition}/${locale}/`);
  if (["profiling", "CLI"].includes(query) && matches.length === 0)
    throw new Error(`Missing baseline search results: ${candidate}/${edition}/${locale}/${query}`);
  if (
    edition === "next" &&
    locale === "ja" &&
    query === "プロファイリング" &&
    !matches.some((match) =>
      new URL(match.url, "https://search.invalid").pathname.endsWith("/ja/profiling/"),
    )
  )
    throw new Error(`Missing Japanese profiling result: ${candidate}`);
  if (query === "zzzznomatchgitlode" && matches.length)
    throw new Error(`Unexpected match for no-result probe: ${candidate}/${edition}/${locale}`);
  report.results.push({ candidate, edition, locale, query, matches });
  console.log(`${candidate}/${edition}/${locale}: ${query} -> ${matches.length}`);
}

await withPreviews([{ directory: dist, base: "/docs/", port: 0 }], async ([preview]) => {
  console.log("Search probe listener: " + preview.url);
  const originalFetch = globalThis.fetch;
  const globals = globalThis as unknown as { document?: ProbeDocument };
  const originalDocument = globals.document;
  // Pagefind's browser API needs only HTML language detection in this Node probe.
  // Fetch uses the real static server and a bounded timeout; no DOM UI is simulated.
  globalThis.fetch = (input, init) => {
    const url = input instanceof Request ? input.url : input.toString();
    if (!url.startsWith(preview.url)) throw new Error(`Unexpected search asset request: ${url}`);
    return originalFetch(input, { ...init, signal: AbortSignal.timeout(5000) });
  };
  try {
    for (const edition of ["stable", "next"]) {
      for (const locale of ["en", "ja"]) {
        const chunkDirectory = join(dist, "vitepress", edition, "assets/chunks");
        const chunk = readdirSync(chunkDirectory).find((name) =>
          name.startsWith(`@localSearchIndex${locale}.`),
        );
        if (!chunk) throw new Error(`Missing VitePress search chunk: ${edition}/${locale}`);
        // The version-pinned VitePress adapter emits a module containing serialized MiniSearch JSON.
        const module = (await import(pathToFileURL(join(chunkDirectory, chunk)).href)) as {
          default: string;
        };
        const index = MiniSearch.loadJSON<{ title: string; titles: string[] }>(module.default, {
          fields: ["title", "titles", "text"],
          storeFields: ["title", "titles"],
          searchOptions: { fuzzy: 0.2, prefix: true, boost: { title: 4, text: 2, titles: 1 } },
        });
        for (const query of queries) {
          record(
            "vitepress",
            edition,
            locale,
            query,
            index
              .search(query)
              .map((result) => ({ url: String(result.id), title: String(result.title) })),
          );
        }
        globals.document = {
          currentScript: null,
          querySelector: () => ({ getAttribute: () => locale }),
        };
        const pagefind = (await import(
          pathToFileURL(join(dist, "starlight", edition, "pagefind/pagefind.js")).href
        )) as PagefindModule;
        const instance = pagefind.createInstance({
          basePath: `${preview.url}starlight/${edition}/pagefind/`,
          baseUrl: `/docs/starlight/${edition}/`,
        });
        try {
          await instance.init();
          for (const query of queries) {
            const response = await instance.search(query);
            const matches = await Promise.all(
              response.results.map(async (result) => {
                const data = await result.data();
                return { url: data.url, title: data.meta.title };
              }),
            );
            record("starlight", edition, locale, query, matches);
          }
        } finally {
          await instance.destroy();
        }
      }
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (originalDocument) globals.document = originalDocument;
    else delete globals.document;
  }
});
writeFileSync(join(output, "search.json"), JSON.stringify(report, null, 2));
console.log(`Search comparison complete: ${join(output, "search.json")}; owned listener closed.`);
