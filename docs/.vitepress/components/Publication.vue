<script setup lang="ts">

import {withBase} from "vitepress";

const props = defineProps<{
  title: string;
  type: string;
  authors: string;
  year: string;
  journal: string;
  doi: string;
  abstract: string;
  image: string;
}>();

</script>

<template>
  <a :href="props.doi" class="publication-link">
    <article class="publication-item">
      <div class="publication-header">
        <h1 class="publication-title">{{ props.title }}<span class="publication-year"> — {{ props.year }}</span></h1>
        <div class="publication-authors">
          {{ props.authors }}
        </div>
        <div class="publication-journal">
          {{ props.journal }}
        </div>
      </div>
      <div class="publication-content">
        <div class="publication-abstract">
          <h3>Abstract</h3>
          <slot />
        </div>
        <div class="publication-image">
          <img :src="withBase(props.image)" :alt="`Image of the first page of the article with title ${ props.title }`" />
        </div>
      </div>
    </article>
  </a>
</template>

<style scoped>
.publication-link {
  display: block;
  font-weight: initial;
  text-decoration: none;
  color: var(--vp-c-text-1);
}

.publication-link:hover {
  text-decoration: none;
}

.publication-item {
  margin: 0 auto 24px auto;
  padding: 32px;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-bg-soft);
  border-radius: 12px;
  transition: background-color 0.25s, border-color 0.25s;
}

.publication-item:hover {
  border: 1px solid var(--vp-c-brand);
  background-color: var(--vp-c-bg-soft-up);
}

.publication-header {
  margin-bottom: 16px;
}

.publication-title {
  line-height: 28px;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.publication-year {
  color: var(--vp-c-text-2);
}

.publication-authors {
  font-size: 16px;
  font-weight: 400;
  margin: 0;
  color: var(--vp-c-text-2);
}

.publication-journal {
  font-style: italic;
}

.publication-content {
  display: flex;
  gap: 16px;
}

.publication-abstract {
  flex: 0 0 66%;
}

.publication-abstract h3 {
  align-self: start;
  font-size: 18px;
  font-weight: 600;
  margin-top: 24px;
  margin-bottom: 8px;
  color: var(--vp-c-text-3);
}

.publication-image {
  display: block;
  align-self: end;
  flex: 0 0 33%;
}

.publication-image img {
  border-radius: 8px;
}
</style>
