import assert from "node:assert/strict";
import test from "node:test";

import { validateLocalization } from "../src/ssg/vitepress/validate-localization.ts";

const notice = "このコンテンツはまだ日本語訳がありません。";
const changedNotice = "翻訳元の英語が更新されています。この翻訳は確認が必要です。";
const base = "/docs/next/";
const target = `${base}en/profiling/`;
const control = `<div class="VPNavBarTranslations"><a href="${target}">English</a></div>`;
const tag = "div";
const page = (body: string, switcher = control, lang = "ja") =>
  `<html lang="${lang}"><body>${switcher}${body}</body></html>`;
const fallback = `<p>${notice}</p><${tag} lang="en"><h1>Profiling</h1></${tag}>`;
const validate = (html: string) => validateLocalization(html, "ja", "profiling/", base, "missing");

test(`VitePress: validates Japanese fallback language and counterpart route`, () => {
  assert.deepEqual(validate(page(fallback)), {
    locale: "ja",
    status: "missing",
    languageSwitchTarget: target,
    fallbackNotice: true,
    contentLanguage: "en",
  });
});

test(`VitePress: rejects wrong document language and locale-home switching`, () => {
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

test(`VitePress: requires visible notice and language on fallback content`, () => {
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
test("language controls reject wrong-edition and obsolete candidate routes", () => {
  for (const wrong of [
    "/docs/stable/en/profiling/",
    "/docs/vitepress-v2/next/en/profiling/",
    "/docs/starlight/next/en/profiling/",
  ]) {
    assert.throws(
      () => validate(page(fallback, control.replace(target, wrong))),
      /missing same-page language switch/,
    );
  }
});

test(`VitePress: distinguishes current and source-changed translations from missing ones`, () => {
  for (const status of ["current", "source-changed"] as const) {
    const translated = page(
      "<h1>プロファイリング</h1>" +
        (status === "source-changed" ? `<blockquote><p>${changedNotice}</p></blockquote>` : ""),
    );
    assert.equal(
      validateLocalization(translated, "ja", "profiling/", base, status).fallbackNotice,
      false,
    );
    assert.throws(
      () => validateLocalization(page(fallback), "ja", "profiling/", base, status),
      /unexpected missing-translation notice/,
    );
  }
});

test(`VitePress: requires the source-changed warning only for changed translations`, () => {
  for (const body of [
    "<h1>プロファイリング</h1>",
    `<h1>プロファイリング</h1><script>${changedNotice}</script>`,
  ]) {
    assert.throws(
      () => validateLocalization(page(body), "ja", "profiling/", base, "source-changed"),
      /missing Japanese source-changed warning/,
    );
  }
  assert.throws(
    () =>
      validateLocalization(
        page(`<h1>プロファイリング</h1><p>${changedNotice}</p>`),
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

test(`VitePress: validates English-to-Japanese switching including locale landing pages`, () => {
  for (const route of ["profiling/", ""]) {
    const switcher = control.replace(target, `${base}ja/${route}`);
    assert.equal(
      validateLocalization(page("<h1>English</h1>", switcher, "en"), "en", route, base, "canonical")
        .languageSwitchTarget,
      `${base}ja/${route}`,
    );
  }
});
