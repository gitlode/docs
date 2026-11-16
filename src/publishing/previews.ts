import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
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
import { validateOutput, validateRendering } from "./validate-output.ts";

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

export function preparePreviews(editionName = "next") {
  if (!["stable", "next"].includes(editionName)) throw new Error("Edition must be stable or next.");
  const staging = stage(
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
      { root: string; base: string; pages: { route: string; sourcePath: string; sha256: string }[] }
    >,
  };
  for (const candidate of ["vitepress", "starlight"] as const) {
    const siteRoot = safeDirectory(output, candidate);
    const base = `/docs/${candidate}/${editionName}/en/`;
    const pages = edition.documents.map((doc) => {
      const content = readFileSync(join(staging, doc.stagedPath));
      if (createHash("sha256").update(content).digest("hex") !== doc.sha256)
        throw new Error(`Staged content changed: ${doc.sourcePath}`);
      return {
        ...doc,
        route: routeFor(doc.sourcePath),
        ...prepareMarkdown(content.toString("utf8"), {
          sourcePath: doc.sourcePath,
          commit: edition.resolvedCommit,
          routes,
          tree,
          base: candidate === "vitepress" ? "/" : base,
        }),
      };
    });
    const groups = navigation.groups.map((group) => ({
      label: group.label,
      pages: group.files.map((file) => {
        const page = pages.find((p) => p.sourcePath === file);
        if (!page) throw new Error(`Sidebar contains unpublished page: ${file}`);
        return { title: page.title, route: page.route };
      }),
    }));
    write(
      siteRoot,
      "site.json",
      JSON.stringify({ edition: editionName, base, navigation: groups }, null, 2),
    );
    for (const page of pages) {
      const attribution = `\n\n---\n\n[Canonical English source](${page.sourceUrl}) · ${editionName} · commit \`${edition.resolvedCommit}\`\n`;
      const content =
        candidate === "vitepress"
          ? page.markdown
          : `---\ntitle: ${JSON.stringify(page.title)}\n---\n\n${page.body}`;
      write(
        siteRoot,
        `${candidate === "vitepress" ? "content" : "src/content/docs"}/${page.route}index.md`,
        content + attribution,
      );
    }
    const title = `gitlode ${editionName} documentation`;
    const landing =
      `English comparison preview from commit \`${edition.resolvedCommit}\`.\n\n` +
      pages
        .map(
          (p) =>
            `- [${p.title.replace(/[\\`*{}\[\]()#+.!<>_]/g, "\\$&")}](${candidate === "vitepress" ? "/" : base}${p.route})`,
        )
        .join("\n") +
      "\n";
    parseSafeMarkdown(landing);
    write(
      siteRoot,
      candidate === "vitepress" ? "content/index.md" : "src/content/docs/index.md",
      (candidate === "vitepress"
        ? `# ${title}\n\n`
        : `---\ntitle: ${JSON.stringify(title)}\n---\n\n`) + landing,
    );
    if (candidate === "vitepress") {
      safeDirectory(siteRoot, ".vitepress");
      copyFileSync(
        join(root, "candidates/vitepress/config.mjs"),
        join(siteRoot, ".vitepress/config.mjs"),
      );
    } else {
      safeDirectory(siteRoot, "public");
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
      pages: pages.map(({ route, sourcePath, sha256 }) => ({ route, sourcePath, sha256 })),
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

export function buildPreviews(edition = "next") {
  const { output, report } = preparePreviews(edition);
  const measurements: Record<string, number> = {};
  const validation: Record<string, ReturnType<typeof validateOutput>> = {};
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
    validation[candidate] = validateOutput(
      join(siteRoot, "dist"),
      report.candidates[candidate].base,
      report.candidates[candidate].pages.map((p) => p.route),
    );
    const site = json<{ navigation: { pages: { route: string }[] }[] }>(
      join(siteRoot, "site.json"),
    );
    const sidebarLinks = site.navigation.flatMap((group) =>
      group.pages.map((page) => report.candidates[candidate].base + page.route),
    );
    rendering[candidate] = report.candidates[candidate].pages.map((page) =>
      validateRendering(
        readFileSync(join(siteRoot, "dist", page.route, "index.html"), "utf8"),
        candidate,
        readFileSync(join(report.staging, edition, "en", page.sourcePath), "utf8"),
        sidebarLinks,
      ),
    );
  }
  write(
    output,
    "build.json",
    JSON.stringify({ ...report, milliseconds: measurements, validation, rendering }, null, 2),
  );
  const latest = join(root, ".generated/preview.json");
  if (existsSync(latest) && lstatSync(latest).isSymbolicLink())
    throw new Error("Unsafe preview pointer.");
  writeFileSync(latest, JSON.stringify({ output }, null, 2));
  console.log(`Built both candidates: ${output}`);
  return output;
}

function previewConfiguration(candidate: string, port?: number) {
  if (candidate !== "vitepress" && candidate !== "starlight")
    throw new Error("Unknown preview candidate.");
  const { output } = json<{ output: string }>(join(root, ".generated/preview.json"));
  const report = json<ReturnType<typeof preparePreviews>["report"]>(join(output, "build.json"));
  return {
    directory: join(report.candidates[candidate].root, "dist"),
    base: report.candidates[candidate].base,
    port: port ?? (candidate === "vitepress" ? 4173 : 4174),
  };
}

export async function preview(candidate: string) {
  const config = previewConfiguration(candidate);
  const server = await startPreview(config.directory, config.base, config.port);
  console.log("Preview: " + server.url);
  return server;
}

export async function verifyPreviews() {
  // Ephemeral ports avoid interfering with a developer's interactive previews.
  await withPreviews(
    [previewConfiguration("vitepress", 0), previewConfiguration("starlight", 0)],
    async (previews) => {
      for (const preview of previews) {
        for (const [path, expected] of [
          ["", 200],
          ["usage/", 200],
          ["design/plugins/", 200],
          ["not-found/", 404],
        ] as const) {
          const response = await fetch(preview.url + path, { signal: AbortSignal.timeout(5000) });
          await response.arrayBuffer();
          if (response.status !== expected)
            throw new Error(
              "Unexpected HTTP status: " + response.status + " for " + preview.url + path,
            );
        }
        console.log("Verified: " + preview.url);
      }
    },
  );
  console.log("Verification complete; all owned preview listeners and connections closed.");
}
