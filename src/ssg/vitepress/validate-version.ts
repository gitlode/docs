import { parse } from "parse5";
import type { DefaultTreeAdapterMap } from "parse5";

export interface VersionNavigationStatistics {
  edition: string;
  locale: "en" | "ja";
  targets: string[];
}

/** Assert cross-build navigation without treating ordinary body links as version controls. */
export function validateVersionNavigation(
  html: string,
  edition: string,
  locale: "en" | "ja",
  route: string,
  versions: Record<string, { path: string; label: string }>,
): VersionNavigationStatistics {
  const targets = new Map(
    Object.entries(versions)
      .filter(([id]) => id !== edition)
      .map(([, version]) => [`/docs/${version.path}/${locale}/`, version.label]),
  );
  let controls = 0;
  let validControls = 0;
  let headerControls = 0;

  function text(node: DefaultTreeAdapterMap["node"]): string {
    if ("value" in node) return node.value;
    if ("tagName" in node && ["script", "style", "template"].includes(node.tagName)) return "";
    return "childNodes" in node ? node.childNodes.map(text).join("") : "";
  }
  function inspect(node: DefaultTreeAdapterMap["node"], inHeader = false): void {
    if ("tagName" in node && node.tagName === "header") inHeader = true;
    if (
      "tagName" in node &&
      node.tagName === "nav" &&
      node.attrs.some((a) => a.name === "data-version-navigation")
    ) {
      controls++;
      if (inHeader) headerControls++;
      let current = false;
      const found = new Set<string>();
      function inspectControl(child: DefaultTreeAdapterMap["node"]): void {
        if ("tagName" in child) {
          const attr = (name: string) => child.attrs.find((a) => a.name === name)?.value;
          if (attr("aria-current") === "page" && text(child).trim() === versions[edition].label)
            current = true;
          const href = attr("href");
          if (
            child.tagName === "a" &&
            href &&
            attr("target") === "_self" &&
            targets.get(href) === text(child).trim()
          )
            found.add(href);
        }
        if ("childNodes" in child)
          for (const descendant of child.childNodes) inspectControl(descendant);
      }
      inspectControl(node);
      if (current && found.size === targets.size) validControls++;
    }
    if ("childNodes" in node) for (const child of node.childNodes) inspect(child, inHeader);
  }
  inspect(parse(html));
  if (headerControls === 0 || validControls !== controls)
    throw new Error(`VitePress: ${edition}/${locale}/${route}: invalid version navigation`);
  return { edition, locale, targets: [...targets.keys()] };
}
