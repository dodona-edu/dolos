<template>
  <div class="breadcrumbs">
    <v-btn icon color="primary" small exact :to="backItem">
      <v-icon>mdi-chevron-left</v-icon>
    </v-btn>
    <v-breadcrumbs class="breadcrumbs-items" :items="items" />
  </div>
</template>

<script lang="ts" setup>
import { useBreadcrumbStore } from "@/stores";
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useRoute } from "vue-router";

interface Props {
  // Current page information (override)
  currentOverride?: {
    text: string;
    to?: Location;
  };
  // Previous page information (fallback)
  previousFallback?: {
    text: string;
    to: Location;
  };
}

interface BreadcrumbItem {
  text: string;
  to?: Location;
  disabled?: boolean;
  exact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {});
const route = useRoute();
const breadcrumbs = useBreadcrumbStore();
const { previousPage } = storeToRefs(breadcrumbs);

// Breadcrumb items
const items = computed(() => {
  const items: BreadcrumbItem[] = [];

  if (previousPage.value) {
    items.push({
      exact: true,
      ...previousPage.value,
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
      to: props.currentOverride?.to ?? route.path.toString() ?? "#",
      disabled: true,
    });
  }

  return items;
});

// Back navigation
const backItem = computed(() => {
  return items.value[items.value.length - 2].to ?? "/";
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
