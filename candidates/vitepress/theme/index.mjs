import DefaultTheme from "vitepress/theme";
import { h } from "vue";

import VersionSwitch from "./VersionSwitch.vue";

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { "nav-bar-content-before": () => h(VersionSwitch) }),
};
