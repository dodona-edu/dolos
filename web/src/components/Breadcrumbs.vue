<template>
  <v-breadcrumbs class="breadcrumbs" :items="items"></v-breadcrumbs>
</template>

<script lang="ts" setup>
import { useRoute } from "@/composables";
import { useBreadcrumbStore } from "@/stores";
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { Route } from "vue-router";

interface Props {
  // Current page information (override)
  currentOverride?: Partial<Route>;
  // Previous page information (fallback)
  previousFallback?: Partial<Route>;
}

const props = withDefaults(defineProps<Props>(), {});
const route = useRoute();
const breadcrumbs = useBreadcrumbStore();
const { previousPage } = storeToRefs(breadcrumbs);

// Breadcrumb items
const items = computed(() => {
  const items = [];

  if (previousPage.value) {
    items.push({
      text: previousPage.value.name,
      to: previousPage.value.path,
      exact: true,
    });
  } else if (props.previousFallback) {
    items.push({
      text: props.previousFallback.name,
      to: props.previousFallback.path,
      exact: true,
    });
  }

  if (route.value) {
    items.push({
      text: props.currentOverride?.name ?? route.value.name,
      to: props.currentOverride?.path ?? route.value.path,
      disabled: true,
    });
  }

  return items;
});
</script>

<style lang="scss" scoped>
.breadcrumbs {
  padding: 0;
}
</style>
