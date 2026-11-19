import { join, posix } from "node:path";

import type { Root } from "mdast";
import { toString } from "mdast-util-to-string";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";

import { git, validatePath } from "./pipeline.ts";

const processor = remark().use(remarkGfm);
export interface TreeEntry {
  mode: string;
  type: string;
}
export type SourceTree = Map<string, TreeEntry>;
export interface LinkContext {
  sourcePath: string;
  commit: string;
  routes: Map<string, string>;
  tree: SourceTree;
  base: string;
}

export function sourceTree(root: string, commit: string): SourceTree {
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

/** Pin references that exist only in the sending edition before copying a translation. */
export function prepareTransferLinks(
  source: string,
  context: LinkContext,
  destination: SourceTree,
) {
  const tree = parseSafeMarkdown(source);
  let changed = false;
  visit(tree, (node) => {
    if (node.type !== "link" && node.type !== "definition") return;
    if (/^(https?:|mailto:|#)/i.test(node.url)) return;
    const path = posix
      .normalize(
        posix.join(
          posix.dirname(context.sourcePath),
          decodeURIComponent(node.url.split(/[?#]/)[0]),
        ),
      )
      .replace(/\/$/, "");
    if (destination.has(path)) return;
    node.url = rewriteLink(node.url, context);
    changed = true;
  });
  return changed ? processor.stringify(tree) : source;
}

export function routeFor(sourcePath: string): string {
  validatePath(sourcePath);
  const packageReadme = /^packages\/(gitlode|plugin-[a-z0-9-]+)\/README\.md$/.exec(sourcePath);
  if (packageReadme) return `packages/${packageReadme[1]}/`;
  const prefix = "packages/gitlode/docs/";
  if (!sourcePath.startsWith(prefix) || !sourcePath.endsWith(".md"))
    throw new Error(`Unsupported page: ${sourcePath}`);
  const path = sourcePath.slice(prefix.length);
  return posix.basename(path) === "README.md"
    ? path.slice(0, -"README.md".length)
    : path.replace(/\.md$/, "/");
}

export function rewriteLink(url: string, context: LinkContext): string {
  if (/^(https?:|mailto:)/i.test(url)) return url;
  if (/^[a-z][a-z\d+.-]*:/i.test(url) || url.startsWith("//"))
    throw new Error(`Unsafe URL: ${url}`);
  if (url.startsWith("#")) return url;
  const match = /^([^?#]*)([?#].*)?$/.exec(url);
  if (!match) throw new Error(`Invalid URL: ${url}`);
  const rawPath = match[1];
  const suffix = match[2] ?? "";
  const decoded = decodeURIComponent(rawPath);
  if (!decoded || decoded.startsWith("/") || decoded.includes("\\") || /[\x00-\x1f]/.test(decoded))
    throw new Error(`Unsafe local URL: ${url}`);
  const path = posix.normalize(posix.join(posix.dirname(context.sourcePath), decoded));
  validatePath(path.replace(/\/$/, ""));
  const target = path.replace(/\/$/, "");
  const entry = context.tree.get(target);
  if (!entry || !["100644", "100755", "040000"].includes(entry.mode))
    throw new Error(`Missing or unsafe target in ${context.sourcePath}: ${url}`);
  const published =
    context.routes.get(target) ??
    (entry.type === "tree" ? context.routes.get(`${target}/README.md`) : undefined);
  if (published !== undefined) return `${context.base}${published}${suffix}`;
  return `https://github.com/gitlode/gitlode/${entry.type === "tree" ? "tree" : "blob"}/${context.commit}/${target}${suffix}`;
}

export function parseSafeMarkdown(source: string): Root {
  // VitePress expands includes before parsing, even when they appear in a code fence.
  if (/<!--\s*@include\s*:/i.test(source))
    throw new Error("Markdown file includes are forbidden, including inside code examples.");
  if (/^\uFEFF?---\s*\r?\n/.test(source))
    throw new Error("Upstream frontmatter requires explicit review.");
  const tree = processor.parse(source);
  visit(tree, (node) => {
    if (node.type === "html")
      throw new Error("Raw HTML/components are forbidden in imported Markdown.");
    if (node.type === "text" && /\{\{|<<<|:::/.test(node.value))
      throw new Error("Executable or SSG-specific Markdown directives are forbidden.");
    if (node.type === "image" || node.type === "imageReference")
      throw new Error("Images require an explicit asset allowlist; none is configured yet.");
    if (node.type === "code") {
      if (node.meta) throw new Error("Code-fence metadata requires explicit review.");
      if (node.lang && !/^[a-z\d_+-]+$/i.test(node.lang))
        throw new Error("Unsafe code-fence language.");
    }
  });
  return tree;
}

export function prepareMarkdown(source: string, context: LinkContext) {
  const tree = parseSafeMarkdown(source);
  const first = tree.children[0];
  if (first?.type !== "heading" || first.depth !== 1)
    throw new Error(`Expected leading H1: ${context.sourcePath}`);
  const title = toString(first);
  if (/\{\{|<<<|:::/.test(title)) throw new Error("Unsafe title for generated navigation.");
  visit(tree, (node) => {
    if (node.type === "link" || node.type === "definition")
      node.url = rewriteLink(node.url, context);
  });
  const markdown = processor.stringify(tree);
  const body = processor.stringify({ ...tree, children: tree.children.slice(1) });
  return { title, markdown, body };
}
