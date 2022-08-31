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
import { analysisPath } from "@/router";
import { computed } from "vue";
import { DataTableHeader } from "vuetify";
import { usePairStore } from "@/api/stores";
import { useRouter } from "@/composables";
import { getClusterElementsArray } from "@/util/clustering-algorithms/ClusterFunctions";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";

interface Props {
  clusters: Cluster[];
  concise?: boolean;
  disableSorting?: boolean;
}

const props = withDefaults(defineProps<Props>(), {});
const router = useRouter();
const pairStore = usePairStore();

// Table headers
const headers = computed<DataTableHeader[]>(() => {
  const h = [] as DataTableHeader[];
  h.push({
    text: "Submissions",
    value: "submissions",
    sortable: false,
  });

  if (!props.concise) {
    h.push({
      text: "Average similarity",
      value: "similarity",
      sortable: props.disableSorting ? false : true,
    });
    h.push({
      text: "Size",
      value: "size",
      sortable: props.disableSorting ? false : true,
    });
  }

  return h;
});


// Table items
// In the format for the Vuetify data-table.
const items = computed(() => {
  return props.clusters.map((cluster) => {
    const files = getClusterElementsArray(cluster);

    return {
      id: pairStore.getClusterIndex(cluster),
      submissions: files,
      size: files.length,
      similarity: [...cluster].reduce((acc, pair) => acc + pair.similarity, 0) / cluster.size,
      cluster,
    };
  });
});

// Max width of the submissions
const maxWidth = computed(() => {
  if (props.concise) {
    return "99%";
  }

  return "70%";
});

// When a row is clicked.
const rowClicked = (item: { id: string }): void => {
  router.push(`${analysisPath}/clusters/${item.id}`);
};
</script>

<style lang="scss" scoped>
.clusters {
  &-submissions {
    max-width: v-bind("maxWidth");
  }
}
</style>
