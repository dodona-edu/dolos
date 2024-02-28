<script setup lang="ts">

const props = defineProps<{
  title: string;
  lead: string;
}>();

</script>

<template>
  <div class="hero">
    <h1 class="hero-title">Publications</h1>
    <p class="hero-lead">Dolos is developed by <a href="https://dodona.be/en/about/">Team Dodona</a> at Ghent University in Belgium. Our research is published in the following journals and conferences.</p>
  </div>
  <slot />
</template>

<style scoped>
.hero {
  padding: 48px 24px;
  margin: auto;
  max-width: 960px;
}

.hero a {
  color: var(--vp-c-brand);
}

.hero a:hover {
  text-decoration: underline;
}

.hero-title {
  line-height: 32px;
  font-size: 32px;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.hero-lead {
  padding-top: 8px;
  font-size: 16px;
  font-weight: 500;
  max-width: 512px;
  color: var(--vp-c-text-2);
}


</style>
