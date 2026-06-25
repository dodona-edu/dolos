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
  currentText?: string;
  currentTo?: RouteLocationRaw;
  previousFallbackText?: string;
  previousFallbackTo?: RouteLocationRaw;
}

const props = withDefaults(defineProps<Props>(), {});
const route = useRoute();
const breadcrumbs = useBreadcrumbStore();
const { previousPage } = storeToRefs(breadcrumbs);

// Breadcrumb items
const items = computed<any>(() => {
  const items = [];

  if (previousPage.value) {
    items.push({
      exact: true,
      title: previousPage.value.name,
      to: previousPage.value,
    });
  } else if (props.previousFallbackText && props.previousFallbackTo) {
    items.push({
      exact: true,
      title: props.previousFallbackText,
      to: props.previousFallbackTo,
    });
  }


  if (route) {
    items.push({
      exact: true,
      title: props.currentText ?? route.name?.toString() ?? "#",
      to: props.currentTo ?? route,
      disabled: true,
    });
  }

  return items;
});

// Back navigation
const backItem = computed(() => {
  return items?.value?.[items.value.length - 2]?.to;
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
