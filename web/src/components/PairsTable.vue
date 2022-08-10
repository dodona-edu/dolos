<template>
  <v-data-table
    :headers="headers"
    :items="items"
    :must-sort="true"
    :sort-by="'similarity'"
    :sort-desc="true"
    :items-per-page="15"
    :search="search"
    :footer-props="footerProps"
    :hide-default-footer="props.pairs.length <= props.itemsPerPage"
    @click:row="rowClicked"
  >
    <template #item.similarity="{ item }">
      <similarity-display :similarity="+item.similarity" />
    </template>
  </v-data-table>
</template>

<script lang="ts" setup>
import { shallowRef, onMounted } from "vue";
import { useRouter, useRoute } from "@/composables";
import { Pair } from "@/api/models";
import { DataTableHeader } from "vuetify";
import SimilarityDisplay from "@/components/pair/SimilarityDisplay.vue";

interface Props {
  pairs: Pair[];
  itemsPerPage: number;
}

const props = withDefaults(defineProps<Props>(), {
  itemsPerPage: 15,
});
const router = useRouter();
const route = useRoute();

// Table headers
const headers: DataTableHeader[] = [
  { text: "Left file", value: "left", sortable: false },
  { text: "Right file", value: "right", sortable: false },
  { text: "Similarity", value: "similarity", filterable: false },
  { text: "Longest fragment", value: "longestFragment", filterable: false },
  { text: "Total overlap", value: "totalOverlap", filterable: false },
];

// Footer props
const footerProps = {
  itemsPerPageOptions: [props.itemsPerPage, 25, 50, 100, -1],
  showCurrentPage: true,
  showFirstLastPage: true,
};

// Search value.
const search = shallowRef("");

// Items in the format for the the data-table.
const items = shallowRef<any[]>([]);

// Calculate the items for the table.
const calculateItems = (): void => {
  const str = route.value.query.showIds as string | null;

  items.value = Object.values(props.pairs)
    .map((pair) => ({
      pair,
      left: pair.leftFile.shortPath,
      right: pair.rightFile.shortPath,
      similarity: pair.similarity.toFixed(2),
      longestFragment: pair.longestFragment,
      totalOverlap: pair.totalOverlap,
    }));

  // Filter the items by param value.
  const params = (str?.split(",") || []).map((v: string) => +v);
  if (params) {
    items.value.filter((pair) => (params.length > 0 ? params.includes(pair.id) : true));
  }
};

// Calculate the items on mount.
onMounted(() => calculateItems());

// When a row is clicked.
const rowClicked = (item: { pair: Pair }): void => {
  router.push(`/compare/${item.pair.id}`);
};
</script>

<style scoped>
.v-data-table >>> tr:hover {
  cursor: pointer;
}
</style>
