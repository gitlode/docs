import assert from "node:assert/strict";
import test from "node:test";

import { validateVersionNavigation } from "../src/ssg/vitepress/validate-version.ts";

const versions = {
  stable: { path: "latest", label: "Released" },
  next: { path: "dev", label: "Develop" },
};
const render = (edition: "stable" | "next", locale: "en" | "ja") => {
  const current = versions[edition];
  const links = Object.values(versions).map((version) => {
    const sibling = version === current ? "" : `../${version.path}/`;
    return `<a href="/docs/${current.path}/${sibling}${locale}/" target="_self">${version.label}</a>`;
  });
  return `<header><nav><div class="VPNavMenuGroup VPNavBarMenuGroup"><button>${current.label}</button>${links.join("")}</div></nav></header>`;
};
test(`VitePress: links to the locale home from every document when changing either edition`, () => {
  for (const edition of ["stable", "next"] as const)
    for (const locale of ["en", "ja"] as const)
      for (const route of ["", "profiling/", "design/plugins/"]) {
        const result = validateVersionNavigation(
          render(edition, locale),
          edition,
          locale,
          route,
          versions,
        );
        assert.equal(
          result.targets[0],
          `/docs/${edition === "stable" ? "dev" : "latest"}/${locale}/`,
        );
        assert.equal(result.edition, edition);
      }
});
test(`VitePress: rejects document targets, wrong locale, fragments, body placement and wrong current edition`, () => {
  const html = render("next", "ja");
  for (const invalid of [
    html.replace("/ja/", "/ja/profiling/"),
    html.replace("/ja/", "/en/"),
    html.replace("/ja/", "/ja/#old-heading"),
    html.replaceAll("header", "main"),
    html.replace("<button>Develop</button>", "<button>stable</button>"),
    html.replace("VPNavBarMenuGroup", ""),
    html.replace(/<a [^>]+>Develop<\/a>/, ""),
    html.replace("/docs/dev/../latest/ja/", "//output.invalid/docs/latest/ja/"),
    html.replace('target="_self"', ""),
  ])
    assert.throws(
      () => validateVersionNavigation(invalid, "next", "ja", "profiling/", versions),
      /invalid version navigation/,
    );
});
test(`VitePress: unrelated body links cannot repair an invalid control`, () => {
  const valid = render("next", "ja");
  const html = valid.replace("/ja/", "/ja/profiling/") + valid.replaceAll("header", "main");
  assert.throws(
    () => validateVersionNavigation(html, "next", "ja", "profiling/", versions),
    /invalid version navigation/,
  );
});
test("version controls reject obsolete candidate routes", () => {
  const html = render("next", "ja");
  for (const prefix of ["/docs/vitepress/", "/docs/vitepress-v2/", "/docs/starlight/"]) {
    assert.throws(
      () =>
        validateVersionNavigation(
          html.replace("/docs/", prefix),
          "next",
          "ja",
          "profiling/",
          versions,
        ),
      /invalid version navigation/,
    );
  }
});
