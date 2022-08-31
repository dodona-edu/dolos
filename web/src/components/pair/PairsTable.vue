<template>
  <v-data-table
    class="row-pointer"
    :headers="headers"
    :items="items"
    :must-sort="true"
    :sort-by="'similarity'"
    :sort-desc="true"
    :items-per-page="15"
    :search.sync="searchValue"
    :footer-props="footerProps"
    :dense="props.dense"
    @click:row="rowClicked"
  >
    <template #item.similarity="{ item }">
      <similarity-display :similarity="+item.similarity" progress :dense="props.dense" />
    </template>
  </v-data-table>
</template>

<script lang="ts" setup>
import { shallowRef, onMounted, watch } from "vue";
import { analysisPath } from "@/router";
import { useRouter, useRoute } from "@/composables";
import { useVModel } from "@vueuse/core";
import { Pair } from "@/api/models";
import { DataTableHeader } from "vuetify";

interface Props {
  pairs: Pair[];
  itemsPerPage?: number;
  search?: string;
  dense?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  itemsPerPage: 15,
});
const emit = defineEmits(["update:search", "update:page"]);
const router = useRouter();
const route = useRoute();
const searchValue = useVModel(props, "search", emit);

// Table headers
const headers: DataTableHeader[] = [
  { text: "Left file", value: "left", sortable: true },
  { text: "Right file", value: "right", sortable: true },
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

// Items in the format for the the data-table.
const items = shallowRef<any[]>([]);

// Calculate the items for the table.
const calculateItems = (): void => {
  const str = route.value.query.showIds as string | null;

  items.value = props.pairs
    .map((pair) => ({
      pair,
      left: pair.leftFile.extra.fullName ?? pair.leftFile.shortPath,
      right: pair.rightFile.extra.fullName ?? pair.rightFile.shortPath,
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

// Calculate the items when the pairs change.
watch(() => props.pairs, () => calculateItems());

// When a row is clicked.
const rowClicked = (item: { pair: Pair }): void => {
  router.push(`${analysisPath}/pairs/${item.pair.id}`);
};
</script>

<style scoped>
.v-data-table >>> tr:hover {
  cursor: pointer;
}
</style>
