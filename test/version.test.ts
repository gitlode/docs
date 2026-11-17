import assert from "node:assert/strict";
import test from "node:test";

import { validateVersionNavigation } from "../src/publishing/validate-version.ts";

for (const candidate of ["vitepress", "starlight"] as const) {
  const render = (edition: "stable" | "next", locale: "en" | "ja", route: string) => {
    const other = edition === "stable" ? "next" : "stable";
    const target = `/docs/${candidate}/${other}/${locale}/${route}`;
    return `<nav data-version-navigation><strong aria-current="page">${edition}</strong><a href="${target}" target="_self" data-astro-reload>${other}</a></nav>`;
  };
  test(`${candidate}: preserves route and locale when changing either edition`, () => {
    for (const edition of ["stable", "next"] as const)
      for (const locale of ["en", "ja"] as const)
        for (const route of ["", "profiling/", "design/plugins/"]) {
          const result = validateVersionNavigation(
            render(edition, locale, route),
            candidate,
            edition,
            locale,
            route,
          );
          assert.equal(
            result.target,
            `/docs/${candidate}/${edition === "stable" ? "next" : "stable"}/${locale}/${route}`,
          );
          assert.equal(result.edition, edition);
        }
  });
  test(`${candidate}: rejects home, wrong locale, fragments and wrong current edition`, () => {
    const html = render("next", "ja", "profiling/");
    for (const invalid of [
      html.replace("/ja/profiling/", "/ja/"),
      html.replace("/ja/profiling/", "/en/profiling/"),
      html.replace("/ja/profiling/", "/ja/profiling/#old-heading"),
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
    const valid = render("next", "ja", "profiling/");
    const html =
      valid.replace("/ja/profiling/", "/ja/") +
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
            render("stable", "en", "").replace("data-astro-reload", ""),
            candidate,
            "stable",
            "en",
            "",
          ),
        /invalid version navigation/,
      );
    });
}
