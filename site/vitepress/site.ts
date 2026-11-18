import type { DefaultTheme } from "vitepress";

/** Trusted site metadata produced by the publishing pipeline. */
export interface PreviewSite {
  edition: "stable" | "next";
  base: string;
  combined: boolean;
  navigation: {
    label: string;
    pages: { title: string; jaTitle: string; route: string }[];
  }[];
}

export interface PreviewTheme extends DefaultTheme.Config {
  versionSite: Pick<PreviewSite, "edition" | "base" | "combined">;
}
