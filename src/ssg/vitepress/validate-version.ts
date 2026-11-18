import { parse } from "parse5";
import type { DefaultTreeAdapterMap } from "parse5";

type Edition = "stable" | "next";

export interface VersionNavigationStatistics {
  edition: Edition;
  locale: "en" | "ja";
  target: string;
}

/** Assert cross-build navigation without treating ordinary body links as version controls. */
export function validateVersionNavigation(
  html: string,
  edition: Edition,
  locale: "en" | "ja",
  route: string,
): VersionNavigationStatistics {
  const other = edition === "stable" ? "next" : "stable";
  const target = `/docs/${other}/${locale}/`;
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
      let counterpart = false;
      function inspectControl(child: DefaultTreeAdapterMap["node"]): void {
        if ("tagName" in child) {
          const attr = (name: string) => child.attrs.find((a) => a.name === name)?.value;
          if (attr("aria-current") === "page" && text(child).trim() === edition) current = true;
          if (child.tagName === "a" && attr("href") === target && text(child).trim() === other) {
            // VitePress's router bypasses links with an explicit target attribute.
            counterpart = attr("target") === "_self";
          }
        }
        if ("childNodes" in child)
          for (const descendant of child.childNodes) inspectControl(descendant);
      }
      inspectControl(node);
      if (current && counterpart) validControls++;
    }
    if ("childNodes" in node) for (const child of node.childNodes) inspect(child, inHeader);
  }
  inspect(parse(html));
  if (headerControls === 0 || validControls !== controls)
    throw new Error(
      `VitePress: ${edition}/${locale}/${route}: invalid version navigation to ${target}`,
    );
  return { edition, locale, target };
}
