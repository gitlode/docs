import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, posix, resolve } from "node:path";

import { parse } from "parse5";
import type { DefaultTreeAdapterMap } from "parse5";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";

interface Reference {
  attribute: "href" | "src";
  value: string;
}

interface HtmlInfo {
  ids: Set<string>;
  h1Count: number;
  references: Reference[];
}

export interface OutputStatistics {
  bytes: number;
  htmlFiles: number;
  localLinks: number;
  expectedPages: number;
}

export interface RenderingStatistics {
  sidebarLinks: number;
  tocHeadings: number;
  codeBlocks: number;
  tables: number;
}

/** Small candidate-specific assertions for the comparison's actual rendering requirements. */
export function validateRendering(
  html: string,
  candidate: "vitepress" | "starlight",
  sourceMarkdown: string,
  expectedSidebarLinks: string[],
): RenderingStatistics {
  const source = remark().use(remarkGfm).parse(sourceMarkdown);
  const sourceCode: string[] = [];
  let sourceTables = 0;
  let tocHeadings = 0;
  visit(source, (node) => {
    if (node.type === "code") sourceCode.push(node.value);
    if (node.type === "table") sourceTables++;
    if (node.type === "heading" && (node.depth === 2 || node.depth === 3)) tocHeadings++;
  });

  const sidebarLinks = new Set<string>();
  const renderedCode: string[] = [];
  let renderedTables = 0;
  let hasToc = false;
  function textContent(node: DefaultTreeAdapterMap["node"]): string {
    if ("value" in node) return node.value;
    if (
      candidate === "starlight" &&
      "tagName" in node &&
      node.attrs.some(
        (attr) => attr.name === "class" && attr.value.split(/\s+/).includes("ec-line"),
      )
    ) {
      // Expressive Code renders lines as adjacent block elements, without text-node newlines.
      const code = node.childNodes.find(
        (child) =>
          "tagName" in child &&
          child.attrs.some(
            (attr) => attr.name === "class" && attr.value.split(/\s+/).includes("code"),
          ),
      );
      const line = code ? textContent(code) : node.childNodes.map(textContent).join("");
      return line.replace(/\r?\n$/, "") + "\n";
    }
    return "childNodes" in node ? node.childNodes.map(textContent).join("") : "";
  }
  function inspect(node: DefaultTreeAdapterMap["node"], inSidebar = false, inPre = false): void {
    if ("tagName" in node) {
      const attr = (name: string) => node.attrs.find((item) => item.name === name)?.value ?? "";
      const classes = attr("class").split(/\s+/);
      inSidebar ||=
        candidate === "vitepress"
          ? node.tagName === "aside" && classes.includes("VPSidebar")
          : node.tagName === "nav" && classes.includes("sidebar");
      inPre ||= node.tagName === "pre";
      if (inSidebar && node.tagName === "a") sidebarLinks.add(attr("href"));
      if (
        node.tagName === "nav" &&
        (candidate === "vitepress"
          ? classes.includes("VPDocAsideOutline")
          : attr("aria-labelledby") === "starlight__on-this-page")
      )
        hasToc = true;
      if (node.tagName === "table") renderedTables++;
      if (inPre && node.tagName === "code") renderedCode.push(textContent(node));
    }
    if ("childNodes" in node) for (const child of node.childNodes) inspect(child, inSidebar, inPre);
  }
  inspect(parse(html));
  for (const link of expectedSidebarLinks) {
    if (!sidebarLinks.has(link)) throw new Error(`${candidate}: missing sidebar link ${link}`);
  }
  if (tocHeadings > 0 && !hasToc) throw new Error(`${candidate}: missing per-page TOC navigation`);
  const normalized = (text: string) => text.replaceAll("\r\n", "\n").trim();
  const unmatched = renderedCode.map(normalized);
  for (const code of sourceCode) {
    const index = unmatched.indexOf(normalized(code));
    if (index < 0)
      throw new Error(`${candidate}: source code block missing or changed: ${code.slice(0, 80)}`);
    unmatched.splice(index, 1);
  }
  if (renderedTables < sourceTables)
    throw new Error(`${candidate}: missing GFM tables (${renderedTables}/${sourceTables})`);
  return {
    sidebarLinks: expectedSidebarLinks.length,
    tocHeadings,
    codeBlocks: sourceCode.length,
    tables: sourceTables,
  };
}

function inspectHtml(content: string): HtmlInfo {
  const info: HtmlInfo = { ids: new Set(), h1Count: 0, references: [] };
  function visit(node: DefaultTreeAdapterMap["node"]): void {
    if ("tagName" in node) {
      if (node.tagName === "h1") info.h1Count++;
      for (const { name, value } of node.attrs) {
        if (name === "id" || (node.tagName === "a" && name === "name")) info.ids.add(value);
        if (name === "href" || name === "src") info.references.push({ attribute: name, value });
      }
    }
    if ("childNodes" in node) for (const child of node.childNodes) visit(child);
  }
  visit(parse(content));
  return info;
}

/** Validate static output at its intended mounted base, without fetching external URLs. */
export function validateOutput(
  siteRoot: string,
  base: string,
  expectedRoutes: string[],
): OutputStatistics {
  if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(base)) throw new Error(`Invalid site base: ${base}`);
  const root = resolve(siteRoot);
  const files = new Set<string>();
  const html = new Map<string, HtmlInfo>();
  let bytes = 0;
  function scan(directory: string, prefix = ""): void {
    const stat = lstatSync(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink())
      throw new Error(`Unsafe output directory: ${directory}`);
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = `${prefix}${entry.name}`;
      if (/(^|\/)(agents|handoff)(?:\.md|\.html)?(\/|$)/i.test(file)) {
        throw new Error(`Excluded content in published output: ${file}`);
      }
      const absolute = join(directory, entry.name);
      const entryStat = lstatSync(absolute);
      if (entryStat.isSymbolicLink()) throw new Error(`Symlink in published output: ${file}`);
      if (entryStat.isDirectory()) scan(absolute, `${file}/`);
      else if (entryStat.isFile()) {
        files.add(file);
        bytes += entryStat.size;
        if (extname(file).toLowerCase() === ".html")
          html.set(file, inspectHtml(readFileSync(absolute, "utf8")));
      } else throw new Error(`Non-regular published output: ${file}`);
    }
  }
  scan(root);

  const routes = new Set(["", ...expectedRoutes]);
  for (const route of routes) {
    if (route !== "" && !/^(?:[A-Za-z0-9_-]+\/)+$/.test(route))
      throw new Error(`Invalid expected route: ${route}`);
    const file = `${route}index.html`;
    const info = html.get(file);
    if (!info) throw new Error(`Missing expected page: ${file}`);
    if (info.h1Count !== 1)
      throw new Error(`Expected exactly one H1 in ${file}, found ${info.h1Count}`);
  }

  let localLinks = 0;
  for (const [file, info] of html) {
    const pagePath = file.endsWith("index.html") ? file.slice(0, -"index.html".length) : file;
    const pageUrl = new URL(`${base}${pagePath}`, "https://output.invalid");
    for (const reference of info.references) {
      const value = reference.value.trim();
      if (/^(https?:|mailto:|tel:|\/\/)/i.test(value)) continue;
      if (reference.attribute === "src" && /^data:image\//i.test(value)) continue;
      if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value))
        throw new Error(`Unsafe URL in ${file}: ${value}`);
      let target: URL;
      let pathname: string;
      let fragment: string;
      try {
        target = new URL(value, pageUrl);
        pathname = decodeURIComponent(target.pathname);
        fragment = decodeURIComponent(target.hash.slice(1));
      } catch {
        throw new Error(`Invalid local URL in ${file}: ${value}`);
      }
      if (
        pathname.includes("\\") ||
        pathname.includes("\0") ||
        pathname.split("/").some((part) => part === "." || part === "..")
      ) {
        throw new Error(`Unsafe local path in ${file}: ${value}`);
      }
      if (!pathname.startsWith(base))
        throw new Error(`Local URL escapes site base ${base} in ${file}: ${value}`);
      const relative = pathname.slice(base.length);
      const candidates =
        relative.endsWith("/") || relative === ""
          ? [`${relative}index.html`]
          : [relative, `${relative}/index.html`, `${relative}.html`];
      const destination = candidates.find((candidate) => files.has(candidate));
      if (!destination) throw new Error(`Missing local target in ${file}: ${value}`);
      localLinks++;
      if (fragment) {
        let targetInfo = html.get(destination);
        if (!targetInfo && posix.extname(destination).toLowerCase() === ".svg") {
          targetInfo = inspectHtml(readFileSync(join(root, destination), "utf8"));
        }
        if (targetInfo && !targetInfo.ids.has(fragment)) {
          throw new Error(`Missing fragment #${fragment} in ${destination}, linked from ${file}`);
        }
      }
    }
  }
  return { bytes, htmlFiles: html.size, localLinks, expectedPages: routes.size };
}
