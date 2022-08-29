<template>
  <v-data-table
    class="row-pointer"
    :headers="headers"
    :items="items"
    sort-by="size"
    sort-desc
    hide-default-footer
    disable-pagination
    must-sort
    fixed-header
    @click:row="rowClicked"
  >
    <template #item.submissions="{ item }">
      <cluster-tags class="clusters-submissions" :current-files="item.submissions" />
    </template>

    <template #item.size="{ item }">
      {{ item.size }} submissions
    </template>

    <template #item.similarity="{ item }">
      <span class="submission-similarity">
        <similarity-display
          :similarity="item.similarity"
          progress
          dim-below-cutoff
        />
      </span>
    </template>
  </v-data-table>
</template>

<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { DataTableHeader } from "vuetify";
import { usePairStore } from "@/api/stores"; 
import { useRouter } from "@/composables";
import { getClusterElementsArray } from "@/util/clustering-algorithms/ClusterFunctions";

const router = useRouter();
const pairStore = usePairStore();
const { sortedClustering } = storeToRefs(pairStore);

// Table headers
const headers = computed<DataTableHeader[]>(() => {
  const h = [];
  h.push({ text: "Submissions", value: "submissions", sortable: false });
  h.push({ text: "Size", value: "size", sortable: true });
  h.push({ text: "Average similarity", value: "similarity", sortable: true });

  return h;
});

// Table items
// In the format for the Vuetify data-table.
const items = computed(() => {
  return sortedClustering.value.map((cluster) => {
    const files = getClusterElementsArray(cluster);

    return {
      id: pairStore.getClusterIndex(cluster ),
      submissions: files,
      size: files.length,
      similarity: [...cluster].reduce((acc, pair) => acc + pair.similarity, 0) / cluster.size,
      cluster,
    };
  });
});

// When a row is clicked.
const rowClicked = (item: { id: string }): void => {
  router.push(`/clusters/${item.id}`);
};
</script>

<style lang="scss" scoped>
.clusters {
  &-submissions {
    max-width: 70%;
  }
}
</style>