import { parse } from "parse5";
import type { DefaultTreeAdapterMap } from "parse5";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";

export interface RenderingStatistics {
  sidebarLinks: number;
  tocHeadings: number;
  codeBlocks: number;
  tables: number;
}

/** Assert VitePress theme rendering against the source publication contract. */
export function validateRendering(
  html: string,
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
    return "childNodes" in node ? node.childNodes.map(textContent).join("") : "";
  }
  function inspect(node: DefaultTreeAdapterMap["node"], inSidebar = false, inPre = false): void {
    if ("tagName" in node) {
      const attr = (name: string) => node.attrs.find((item) => item.name === name)?.value ?? "";
      const classes = attr("class").split(/\s+/);
      inSidebar ||= node.tagName === "aside" && classes.includes("VPSidebar");
      inPre ||= node.tagName === "pre";
      if (inSidebar && node.tagName === "a") sidebarLinks.add(attr("href"));
      if (node.tagName === "nav" && classes.includes("VPDocAsideOutline")) hasToc = true;
      if (node.tagName === "table") renderedTables++;
      if (inPre && node.tagName === "code") renderedCode.push(textContent(node));
    }
    if ("childNodes" in node) for (const child of node.childNodes) inspect(child, inSidebar, inPre);
  }
  inspect(parse(html));
  for (const link of expectedSidebarLinks) {
    if (!sidebarLinks.has(link)) throw new Error(`VitePress: missing sidebar link ${link}`);
  }
  if (tocHeadings > 0 && !hasToc) throw new Error(`VitePress: missing per-page TOC navigation`);
  const normalized = (text: string) => text.replaceAll("\r\n", "\n").trim();
  const unmatched = renderedCode.map(normalized);
  for (const code of sourceCode) {
    const index = unmatched.indexOf(normalized(code));
    if (index < 0)
      throw new Error(`VitePress: source code block missing or changed: ${code.slice(0, 80)}`);
    unmatched.splice(index, 1);
  }
  if (renderedTables < sourceTables)
    throw new Error(`VitePress: missing GFM tables (${renderedTables}/${sourceTables})`);
  return {
    sidebarLinks: expectedSidebarLinks.length,
    tocHeadings,
    codeBlocks: sourceCode.length,
    tables: sourceTables,
  };
}
