import assert from "node:assert/strict";
import test from "node:test";

import { validateVersionNavigation } from "../src/publishing/validate-version.ts";

for (const candidate of ["vitepress", "starlight"] as const) {
  const render = (edition: "stable" | "next", locale: "en" | "ja") => {
    const other = edition === "stable" ? "next" : "stable";
    const target = `/docs/${candidate}/${other}/${locale}/`;
    return `<header><nav data-version-navigation><strong aria-current="page">${edition}</strong><a href="${target}" target="_self" data-astro-reload>${other}</a></nav></header>`;
  };
  test(`${candidate}: links to the locale home from every document when changing either edition`, () => {
    for (const edition of ["stable", "next"] as const)
      for (const locale of ["en", "ja"] as const)
        for (const route of ["", "profiling/", "design/plugins/"]) {
          const result = validateVersionNavigation(
            render(edition, locale),
            candidate,
            edition,
            locale,
            route,
          );
          assert.equal(
            result.target,
            `/docs/${candidate}/${edition === "stable" ? "next" : "stable"}/${locale}/`,
          );
          assert.equal(result.edition, edition);
        }
  });
  test(`${candidate}: rejects document targets, wrong locale, fragments, body placement and wrong current edition`, () => {
    const html = render("next", "ja");
    for (const invalid of [
      html.replace("/ja/", "/ja/profiling/"),
      html.replace("/ja/", "/en/"),
      html.replace("/ja/", "/ja/#old-heading"),
      html.replaceAll("header", "main"),
      html.replace('aria-current="page">next', 'aria-current="page">stable'),
      html.replace('aria-current="page"', ""),
      html.replace("data-version-navigation", ""),
      html.replace('target="_self"', ""),
    ])
      assert.throws(
        () => validateVersionNavigation(invalid, candidate, "next", "ja", "profiling/"),
        /invalid version navigation/,
      );
  });
  test(`${candidate}: unrelated body links cannot repair an invalid control`, () => {
    const valid = render("next", "ja");
    const html =
      valid.replace("/ja/", "/ja/profiling/") +
      valid.replace("<nav data-version-navigation>", "<div>").replace("</nav>", "</div>");
    assert.throws(
      () => validateVersionNavigation(html, candidate, "next", "ja", "profiling/"),
      /invalid version navigation/,
    );
  });
  if (candidate === "starlight")
    test("starlight: requires explicit cross-build reload", () => {
      assert.throws(
        () =>
          validateVersionNavigation(
            render("stable", "en").replace("data-astro-reload", ""),
            candidate,
            "stable",
            "en",
            "",
          ),
        /invalid version navigation/,
      );
    });
}
