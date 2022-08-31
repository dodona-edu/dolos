<template>
  <component :is="layout">
    <router-view />
  </component>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { uploadPathPrefix } from "@/router";
import { useRoute } from "@/composables";
import AnalysisLayout from "@/layouts/analysis.vue";
import UploadLayout from "@/layouts/upload.vue";

const route = useRoute();

// Which layout to use, depending on the current route.
// Paths starting with /upload are handled by the UploadLayout.
// All other paths are handled by the AnalysisLayout.
const layout = computed(() => {
  if (process.env.VUE_APP_MODE === "server" && route.value.path === uploadPathPrefix) {
    return UploadLayout;
  }

  return AnalysisLayout;
});
</script>

<style lang="scss">
.v-toolbar__title {
  a {
    color: inherit !important;
    text-decoration: none;
  }
}

.settings {
  &-labels {
    margin-left: 1px;
  }
}

.container {
  max-width: 1920px !important;
}

.fill-width {
  width: 100%;
}

.heading {
  padding-bottom: 1rem;
}

// Fix scrolling when overflowing with sticky header.
.v-data-table {
  overflow: auto !important;

  .v-data-table__wrapper {
    overflow: unset !important;
  }
}

// Cursor pointer on data table rows.
.row-pointer {
  tbody tr:hover {
    cursor: pointer;
  }
}

// Apply font family to D3 graphs.
text {
  font-family: "Roboto", sans-serif !important;
}

// D3 re-usable graph styles.
.d3 {
  &-ticks {
    font-size: 0.9rem;
  }

  &-label {
    font-size: 1rem;
    font-weight: 500;
    fill: rgba(0, 0, 0, 0.87);
  }
}
</style>