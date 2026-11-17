import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfigWithTheme } from "vitepress-v2";

import type { PreviewSite, PreviewTheme } from "./site.ts";

const root = resolve(import.meta.dirname, "..");
const site = JSON.parse(readFileSync(resolve(root, "site.json"), "utf8")) as PreviewSite;
export default defineConfigWithTheme<PreviewTheme>({
  // Bundle the npm alias during SSR just as VitePress bundles its canonical package name.
  vite: { ssr: { noExternal: ["vitepress-v2"] } },
  themeConfig: {
    versionSite: { edition: site.edition, base: site.base, combined: site.combined },
    search: { provider: "local" },
  },
  title: "gitlode",
  description: `Documentation — ${site.edition} comparison preview`,
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
          versionSite: { edition: site.edition, base: site.base, combined: site.combined },
          outline: [2, 3],
          sidebar: site.navigation.map((group) => ({
            text: group.label,
            items: group.pages.map((page) => ({
              text: locale === "ja" ? page.jaTitle : page.title,
              link: `/${locale}/${page.route}`,
            })),
          })),
          nav: site.combined ? [] : [{ text: site.edition, link: `/${locale}/` }],
        },
      },
    ]),
  ),
});
