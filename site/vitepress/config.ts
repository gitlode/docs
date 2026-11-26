import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig } from "vitepress";

import type { PreviewSite } from "./site.ts";

const root = resolve(import.meta.dirname, "..");
const site = JSON.parse(readFileSync(resolve(root, "site.json"), "utf8")) as PreviewSite;
const currentVersion = site.versions[site.edition];

export default defineConfig({
  themeConfig: {
    search: { provider: "local" },
  },
  title: "gitlode",
  description: `Documentation — ${site.versions[site.edition].label}`,
  base: site.base,
  srcDir: "content",
  outDir: resolve(root, "dist"),
  cleanUrls: true,
  markdown: {
    html: false,
    attrs: false,
    config(md) {
      md.disable("snippet");
      const render = md.renderer.render.bind(md.renderer);
      md.renderer.render = (tokens, options, env) => {
        const html = render(tokens, options, env);
        if (
          env.frontmatter?.translationFallback !== true ||
          (tokens.length === 1 && tokens[0].type === "inline")
        )
          return html;
        return (
          '<div class="custom-block warning" role="note" aria-label="未翻訳のドキュメント" lang="ja">' +
          '<p class="custom-block-title">未翻訳のドキュメント</p>' +
          "<p>このコンテンツはまだ日本語訳がありません。以下に英語の原文を表示しています。</p>" +
          '</div>\n<div lang="en">' +
          html +
          "</div>\n"
        );
      };
    },
  },
  locales: Object.fromEntries(
    ["en", "ja"].map((locale) => [
      locale,
      {
        label: locale === "en" ? "English" : "日本語",
        lang: locale,
        themeConfig: {
          outline: [2, 3],
          sidebar: site.navigation.map((group) => ({
            text: group.label,
            items: group.pages.map((page) => ({
              text: locale === "ja" ? page.jaTitle : page.title,
              link: `/${locale}/${page.route}`,
            })),
          })),
          nav: site.combined
            ? [
                {
                  text: currentVersion.label,
                  items: Object.entries(site.versions).map(([edition, version]) => ({
                    text: version.label,
                    // VitePress prepends the edition base. The browser resolves its sibling.
                    link:
                      edition === site.edition ? `/${locale}/` : `/../${version.path}/${locale}/`,
                    target: "_self",
                  })),
                },
              ]
            : [{ text: currentVersion.label, link: `/${locale}/` }],
        },
      },
    ]),
  ),
});
