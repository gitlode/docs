<script setup>
import { useData } from "vitepress";
import { computed } from "vue";

import site from "../../site.json";

const { page } = useData();
const locale = computed(() => page.value.relativePath.split("/")[0]);
const editions = ["stable", "next"];
const candidateBase = site.base.replace(/(?:stable|next)\/$/, "");
const label = computed(() => (locale.value === "ja" ? "バージョン" : "Version"));
</script>

<template>
  <nav
    v-if="site.combined && !page.isNotFound && ['en', 'ja'].includes(locale)"
    class="version-switch"
    data-version-navigation
    :aria-label="label"
    :lang="locale"
  >
    <span>{{ label }}:</span>
    <template v-for="edition in editions" :key="edition">
      <strong v-if="edition === site.edition" aria-current="page">{{ edition }}</strong>
      <!-- target=_self bypasses VitePress's SPA router for separately built editions. -->
      <a v-else :href="`${candidateBase}${edition}/${locale}/`" target="_self">{{ edition }}</a>
    </template>
  </nav>
</template>

<style scoped>
.version-switch {
  display: flex;
  white-space: nowrap;
  gap: 0.75rem;
  align-items: baseline;
  margin-inline: 0.75rem;
  font-size: 0.875rem;
}
a {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
</style>
