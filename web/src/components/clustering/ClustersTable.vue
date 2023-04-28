<template>
  <v-data-table
    class="row-pointer"
    :headers="headers"
    :items="items"
    x-sort-by="size"
    sort-desc
    hide-default-footer
    disable-pagination
    must-sort
    fixed-header
    @click:row="rowClicked"
  >
    <template #item.submissions="{ item }">
      <cluster-tags
        class="clusters-submissions"
        :current-files="item.submissions"
      />
    </template>

    <template #item.size="{ item }"> {{ item.size }} submissions </template>

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
import { computed } from "vue";
import { usePairStore } from "@/api/stores";
import { getClusterElementsArray } from "@/util/clustering-algorithms/ClusterFunctions";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { useRouter } from "vue-router";

interface Props {
  clusters: Cluster[];
  concise?: boolean;
  disableSorting?: boolean;
  limit?: number;
}

const props = withDefaults(defineProps<Props>(), {});
const router = useRouter();
const pairStore = usePairStore();

// Table headers
const headers = computed(() => {
  const h = [];
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
  const clusters = props.clusters.map((cluster) => {
    const files = getClusterElementsArray(cluster);

    return {
      id: pairStore.getClusterIndex(cluster),
      submissions: files,
      size: files.length,
      similarity:
        [...cluster].reduce((acc, pair) => acc + pair.similarity, 0) /
        cluster.size,
      cluster,
    };
  });

  // Sort clusters by size by default.
  // This is necessary for the 'limit' prop to work properly.
  clusters.sort((a, b) => b.size - a.size);

  return props.limit ? clusters.slice(0, props.limit) : clusters;
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
  router.push({ name: "Cluster", params: { clusterId: item.id } });
};
</script>

<style lang="scss" scoped>
.clusters {
  &-submissions {
    max-width: v-bind("maxWidth");
  }
}
</style>
