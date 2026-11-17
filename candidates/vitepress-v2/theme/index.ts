import type { Theme } from "vitepress-v2";
import DefaultTheme from "vitepress-v2/theme";
import { h } from "vue";

import VersionSwitch from "./VersionSwitch.vue";

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { "nav-bar-content-before": () => h(VersionSwitch) }),
} satisfies Theme;
