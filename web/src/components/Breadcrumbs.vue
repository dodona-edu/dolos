<template>
  <div class="breadcrumbs">
    <v-btn color="primary" variant="text" icon="mdi-chevron-left" size="x-small" exact :to="backItem" />
    <v-breadcrumbs class="breadcrumbs-items" :items="items" />
  </div>
</template>

<script lang="ts" setup>
import { useBreadcrumbStore } from "@/stores";
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { RouteLocationRaw, useRoute } from "vue-router";

interface Props {
  // Current page information (override)
  currentOverride?: {
    text: string;
    to?: RouteLocationRaw;
    params?: Record<string, string| string[]>;
  };
  // Previous page information (fallback)
  previousFallback?: {
    text: string;
    to: RouteLocationRaw;
    params?: Record<string, string| string[]>;
  };
}

const props = withDefaults(defineProps<Props>(), {});
const route = useRoute();
const breadcrumbs = useBreadcrumbStore();
const { previousPage } = storeToRefs(breadcrumbs);

// Breadcrumb items
const items = computed<any>(() => {
  const items = [];

  const prev = previousPage.value?.name ?? "";

  if (prev) {
    items.push({
      exact: true,
      text: prev,
      to: { name: prev },
    });
  } else if (props.previousFallback) {
    items.push({
      exact: true,
      ...props.previousFallback,
    });
  }


  if (route) {
    items.push({
      text: props.currentOverride?.text ?? route.name?.toString() ?? "#",
      to: props.currentOverride?.to,
      params: props.currentOverride?.params,
      disabled: true,
    });
  }
  
  return items;
});

// Back navigation
const backItem = computed(() => {
  return items.value[items.value.length - 2].to;
});
</script>

<style lang="scss" scoped>
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 0.25rem;

  :deep(a) {
    color: rgb(var(--v-theme-primary));
  }

  &-items {
    padding: 0;
  }
}
</style>
