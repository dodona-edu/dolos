<script setup lang="ts">
const props = defineProps<{
  title: string;
  lead?: string;
}>();
</script>

<template>
  <section class="publication-list">
    <div class="list-header">
      <h2 class="list-header-title">{{ props.title }}</h2>
      <p class="list-header-lead" v-if="props.lead">{{ props.lead }}</p>
    </div>
    <slot />
  </section>
</template>

<style scoped>

.publication-list {
  border-top: 1px solid var(--vp-c-divider);
  padding: 24px 0;
  margin: 0 auto;
  max-width: 960px;
}

.list-header {
  padding: 24px;
  max-width: 512px;
}

.list-header-title {
  font-size: 20px;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.list-header-lead {
  padding-top: 8px;
  line-height: 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

</style>
