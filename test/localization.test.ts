import assert from "node:assert/strict";
import test from "node:test";

import { validateLocalization } from "../src/publishing/validate-localization.ts";

const notice = "このコンテンツはまだ日本語訳がありません。";
const changedNotice = "翻訳元の英語が更新されています。この翻訳は確認が必要です。";
const candidates = ["vitepress", "vitepress-v2", "starlight"] as const;

for (const candidate of candidates) {
  const base = `/docs/${candidate}/next/`;
  const target = `${base}en/profiling/`;
  const control =
    candidate !== "starlight"
      ? `<div class="VPNavBarTranslations"><a href="${target}">English</a></div>`
      : `<starlight-lang-select><select><option value="${target}">English</option></select></starlight-lang-select>`;
  const tag = candidate !== "starlight" ? "div" : "main";
  const page = (body: string, switcher = control, lang = "ja") =>
    `<html lang="${lang}"><body>${switcher}${body}</body></html>`;
  const fallback = `<p>${notice}</p><${tag} lang="en"><h1>Profiling</h1></${tag}>`;
  const validate = (html: string) =>
    validateLocalization(html, candidate, "ja", "profiling/", base, "missing");

  test(`${candidate}: validates Japanese fallback language and counterpart route`, () => {
    assert.deepEqual(validate(page(fallback)), {
      locale: "ja",
      status: "missing",
      languageSwitchTarget: target,
      fallbackNotice: true,
      contentLanguage: "en",
    });
  });

  test(`${candidate}: rejects wrong document language and locale-home switching`, () => {
    assert.throws(() => validate(page(fallback, control, "en")), /expected html lang=ja/);
    assert.throws(
      () => validate(page(fallback, control.replace(target, `${base}en/`))),
      /missing same-page language switch/,
    );
    assert.throws(
      () => validate(page(`${fallback}<a href="${target}">Body link</a>`, "")),
      /missing same-page language switch/,
    );
  });

  test(`${candidate}: requires visible notice and language on fallback content`, () => {
    assert.throws(
      () => validate(page(fallback.replace(notice, ""))),
      /missing Japanese fallback notice/,
    );
    assert.throws(
      () => validate(page(fallback.replace(`<p>${notice}</p>`, `<script>${notice}</script>`))),
      /missing Japanese fallback notice/,
    );
    assert.throws(
      () => validate(page(fallback.replace('lang="en"', 'lang="ja"'))),
      /missing English fallback body/,
    );
    assert.throws(
      () => validate(page(`<p>${notice}</p><${tag} lang="en"></${tag}><h1>Profiling</h1>`)),
      /missing English fallback body/,
    );
  });
  test(`${candidate}: language controls cannot cross into another SSG candidate`, () => {
    for (const otherCandidate of candidates) {
      if (otherCandidate === candidate) continue;
      assert.throws(
        () =>
          validate(
            page(fallback, control.replace(`/docs/${candidate}/`, `/docs/${otherCandidate}/`)),
          ),
        /missing same-page language switch/,
      );
    }
  });

  test(`${candidate}: distinguishes current and source-changed translations from missing ones`, () => {
    for (const status of ["current", "source-changed"] as const) {
      const translated = page(
        "<h1>プロファイリング</h1>" +
          (status === "source-changed" ? `<blockquote><p>${changedNotice}</p></blockquote>` : ""),
      );
      assert.equal(
        validateLocalization(translated, candidate, "ja", "profiling/", base, status)
          .fallbackNotice,
        false,
      );
      assert.throws(
        () => validateLocalization(page(fallback), candidate, "ja", "profiling/", base, status),
        /unexpected missing-translation notice/,
      );
    }
  });

  test(`${candidate}: requires the source-changed warning only for changed translations`, () => {
    for (const body of [
      "<h1>プロファイリング</h1>",
      `<h1>プロファイリング</h1><script>${changedNotice}</script>`,
    ]) {
      assert.throws(
        () =>
          validateLocalization(page(body), candidate, "ja", "profiling/", base, "source-changed"),
        /missing Japanese source-changed warning/,
      );
    }
    assert.throws(
      () =>
        validateLocalization(
          page(`<h1>プロファイリング</h1><p>${changedNotice}</p>`),
          candidate,
          "ja",
          "profiling/",
          base,
          "current",
        ),
      /unexpected source-changed warning/,
    );
    assert.throws(
      () => validate(page(`${fallback}<p>${changedNotice}</p>`)),
      /unexpected source-changed warning/,
    );
  });

  test(`${candidate}: validates English-to-Japanese switching including locale landing pages`, () => {
    for (const route of ["profiling/", ""]) {
      const switcher = control.replace(target, `${base}ja/${route}`);
      assert.equal(
        validateLocalization(
          page("<h1>English</h1>", switcher, "en"),
          candidate,
          "en",
          route,
          base,
          "canonical",
        ).languageSwitchTarget,
        `${base}ja/${route}`,
      );
    }
  });
}
