/** Trusted site metadata produced by the publishing pipeline. */
export interface PreviewSite {
  edition: string;
  versions: Record<string, { path: string; label: string }>;
  base: string;
  combined: boolean;
  navigation: {
    label: string;
    pages: { title: string; jaTitle: string; route: string }[];
  }[];
}
