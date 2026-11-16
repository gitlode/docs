import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig } from "vitepress";

const root = resolve(import.meta.dirname, "..");
const site = JSON.parse(readFileSync(resolve(root, "site.json"), "utf8"));
export default defineConfig({
  title: "gitlode",
  description: `English documentation — ${site.edition} comparison preview`,
  base: site.base,
  srcDir: "content",
  outDir: resolve(root, "dist"),
  cleanUrls: true,
  markdown: {
    html: false,
    attrs: { disable: true },
    config(md) {
      md.disable("snippet");
    },
  },
  themeConfig: {
    outline: [2, 3],
    sidebar: site.navigation.map((group) => ({
      text: group.label,
      items: group.pages.map((page) => ({ text: page.title, link: "/" + page.route })),
    })),
    nav: [{ text: `${site.edition} · English`, link: "/" }],
  },
});
