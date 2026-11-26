import { parse } from "parse5";
import type { DefaultTreeAdapterMap } from "parse5";

export interface VersionNavigationStatistics {
  edition: string;
  locale: "en" | "ja";
  targets: string[];
}

type HtmlNode = DefaultTreeAdapterMap["node"];
type HtmlElement = DefaultTreeAdapterMap["element"];

function elements(node: HtmlNode, matches: (element: HtmlElement) => boolean): HtmlElement[] {
  return [
    ...("tagName" in node && matches(node) ? [node] : []),
    ...("childNodes" in node ? node.childNodes.flatMap((child) => elements(child, matches)) : []),
  ];
}

function attr(element: HtmlElement, name: string): string | undefined {
  return element.attrs.find((attribute) => attribute.name === name)?.value;
}

function text(node: HtmlNode): string {
  if ("value" in node) return node.value;
  if ("tagName" in node && ["script", "style", "template"].includes(node.tagName)) return "";
  return "childNodes" in node ? node.childNodes.map(text).join("") : "";
}

/** Check the standard theme's server-rendered header menu on each locale page. */
export function validateVersionNavigation(
  html: string,
  edition: string,
  locale: "en" | "ja",
  route: string,
  versions: Record<string, { path: string; label: string }>,
): VersionNavigationStatistics {
  const current = versions[edition];
  const currentHome = `/docs/${current.path}/${locale}/`;
  const pageUrl = new URL(currentHome + route, "https://output.invalid");
  const expected = Object.values(versions).map(
    ({ path, label }) => [`/docs/${path}/${locale}/`, label] as const,
  );
  const menus = elements(parse(html), (element) => element.tagName === "header")
    .flatMap((header) =>
      elements(
        header,
        (element) => attr(element, "class")?.split(/\s+/).includes("VPNavBarMenuGroup") === true,
      ),
    )
    .filter((group) =>
      elements(group, (element) => element.tagName === "button").some(
        (button) => text(button).trim() === current.label,
      ),
    );
  const links = menus.flatMap((menu) => elements(menu, (element) => element.tagName === "a"));
  if (
    menus.length !== 1 ||
    links.length !== expected.length ||
    !links.every((link, index) => {
      const [path, label] = expected[index];
      const href = attr(link, "href");
      return (
        href?.startsWith("/") &&
        !href.startsWith("//") &&
        URL.parse(href, pageUrl)?.href === pageUrl.origin + path &&
        attr(link, "target") === "_self" &&
        text(link).trim() === label
      );
    })
  )
    throw new Error(`VitePress: ${edition}/${locale}/${route}: invalid version navigation`);
  return {
    edition,
    locale,
    targets: expected.map(([path]) => path).filter((path) => path !== currentHome),
  };
}
