<template>
  <div class="breadcrumbs">
    <v-btn icon color="primary" small exact :to="backItem">
      <v-icon>mdi-chevron-left</v-icon>
    </v-btn>
    <v-breadcrumbs class="breadcrumbs-items" :items="items" />
  </div>
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
      to: previousPage.value,
      exact: true,
    });
  } else if (props.previousFallback) {
    items.push({
      text: props.previousFallback.name,
      to: props.previousFallback,
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

  &-items {
    padding: 0;
  }
}
</style>
