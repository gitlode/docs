import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig } from "vitepress";

const root = resolve(import.meta.dirname, "..");
const site = JSON.parse(readFileSync(resolve(root, "site.json"), "utf8"));
export default defineConfig({
  title: "gitlode",
  description: `Documentation — ${site.edition} comparison preview`,
  base: site.base,
  srcDir: "content",
  outDir: resolve(root, "dist"),
  cleanUrls: true,
  markdown: {
    html: false,
    attrs: { disable: true },
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
          '<p lang="ja">このコンテンツはまだ日本語訳がありません。</p>\n<div lang="en">' +
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
          nav: [{ text: site.edition, link: `/${locale}/` }],
        },
      },
    ]),
  ),
});
