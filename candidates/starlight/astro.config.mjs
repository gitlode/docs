import { readFileSync } from "node:fs";

import { unified } from "@astrojs/markdown-remark";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

const site = JSON.parse(readFileSync(new URL("./site.json", import.meta.url), "utf8"));
export default defineConfig({
  site: "https://gitlode.github.io",
  base: site.base,
  output: "static",
  trailingSlash: "always",
  markdown: { processor: unified({ smartypants: false }) },
  integrations: [
    starlight({
      title: "gitlode",
      components: site.combined
        ? { LanguageSelect: "./components/VersionedLanguageSelect.astro" }
        : {},
      defaultLocale: "en",
      locales: { en: { label: "English", lang: "en" }, ja: { label: "日本語", lang: "ja" } },
      description: `Documentation — ${site.edition} comparison preview`,
      sidebar: site.navigation.map((group) => ({
        label: group.label,
        items: group.pages.map((page) => ({ slug: page.route.replace(/\/$/, "") })),
      })),
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      expressiveCode: {
        frames: { extractFileNameFromCode: false, removeCommentsWhenCopyingTerminalFrames: false },
      },
      pagefind: false,
    }),
  ],
});
