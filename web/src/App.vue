<template>
  <div>
    <router-view name="layout">
      <router-view />
      <snackbar />
    </router-view>
  </div>
</template>

<script lang="ts" setup>
import Snackbar from "./components/util/snackbar/Snackbar.vue";
import { watchEffect } from "vue";
import { storeToRefs } from "pinia";
import { useMetadataStore } from "@/api/stores";

const { metadata } = storeToRefs(useMetadataStore());

watchEffect(() => {
  const meta = metadata.value;
  document.title = meta.reportName || "Dolos - Source code plagiarism detection";
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
