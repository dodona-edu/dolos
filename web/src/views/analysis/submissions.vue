<template>
  <div class="submissions">
    <v-row class="heading" align="center">
      <v-col cols="12" md="6">
        <h2 class="heading-title">Submissions</h2>
        <div class="heading-subtitle text-medium-emphasis">
          All analyzed submissions with their highest similarity.
        </div>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search"
          single-line
          hide-details
          variant="outlined"
          density="compact"
        />
      </v-col>
    </v-row>

    <v-alert v-if="isSimilarityFilterApplied" class="mb-4" type="info" variant="tonal" density="compact">
      <div class="d-flex justify-space-between align-center">
        <div>
          Showing submissions with highest similarity between
          {{ (startSimilarity * 100).toFixed(0) }}% and
          {{ (endSimilarity * 100).toFixed(0) }}%.
        </div>

        <v-btn variant="text" @click.prevent="clearSimilarityFilter" append-icon="mdi-close"> Clear filter </v-btn>
      </div>
    </v-alert>

    <v-card>
      <submissions-table
        v-model:search="search"
        class="submissions-table"
        :files="filesActiveListFiltered"
        pagination
      />
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useFileStore } from "@/api/stores";
import { useRouteQuery } from "@vueuse/router";

const fileStore = useFileStore();
const { filesActiveList } = storeToRefs(fileStore);
const search = useRouteQuery("search", "");
const startSimilarity = useRouteQuery("startSimilarity", 0.0, { transform: Number });
const endSimilarity = useRouteQuery("endSimilarity", 1.0, { transform: Number });

// If the similarity filter is applied.
const isSimilarityFilterApplied = computed(
  () => startSimilarity.value !== 0 || endSimilarity.value !== 1
);

// Clear the similarity filter.
const clearSimilarityFilter = (): void => {
  startSimilarity.value = 0;
  endSimilarity.value = 1;
};

// Filter the active files on similarity between start and end similarity.
const filesActiveListFiltered = computed(() => {
  return filesActiveList.value.filter((file) => {
    const similarity = fileStore.similarities.get(file)?.similarity ?? 0;
    return (
      similarity >= startSimilarity.value && similarity <= endSimilarity.value
    );
  });
});

// Table height.
const tableHeight = computed(() => {
  if (isSimilarityFilterApplied.value) {
    return "max(500px, calc(100vh - 230px))";
  } else {
    return "max(500px, calc(100vh - 180px))";
  }
});
</script>

<style lang="scss" scoped>
.submissions {
  &-table {
    max-height: v-bind("tableHeight");
  }
}
</style>
