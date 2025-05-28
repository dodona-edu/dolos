<template>
  <v-data-table
    v-model:search="searchValue"
    :headers="headers"
    :items="items"
    :items-per-page="props.itemsPerPage"
    :sort-by="sortBy"
    :footer-props="footerProps"
    density="compact"
    must-sort
    @click:row="rowClicked"
  >
    <template #item.similarity="{ item }">
      <similarity-display
        :similarity="+item.similarity"
        progress
      />
    </template>
  </v-data-table>
</template>

<script lang="ts" setup>
import { shallowRef, onMounted, watch } from "vue";
import { useVModel } from "@vueuse/core";
import { Pair } from "@/api/models";
import { useRoute, useRouter } from "vue-router";
import { computed } from "vue";

interface Props {
  pairs: Pair[];
  itemsPerPage?: number;
  search?: string;
  dense?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  itemsPerPage: 25,
});
const emit = defineEmits(["update:search", "update:page"]);
const router = useRouter();
const route = useRoute();
const searchValue = useVModel(props, "search", emit);

// Table sort
const sortBy = computed<any>(() => [{
  key: "similarity",
  order: "desc",
}]);

// Table headers
const headers = computed<any[]>(() => [
  { title: "Left file", key: "left", sortable: true },
  { title: "Right file", key: "right", sortable: true },
  { title: "Similarity", key: "similarity", filterable: false },
  { title: "Longest fragment", key: "longestFragment", filterable: false },
  { title: "Total overlap", key: "totalOverlap", filterable: false },
]);

// Footer props
const footerProps = computed<any>(() => { return {
  itemsPerPageOptions: [props.itemsPerPage, 25, 50, 100, -1],
  showCurrentPage: true,
  showFirstLastPage: true,
}});

// Items in the format for the the data-table.
const items = shallowRef<any[]>([]);

// Calculate the items for the table.
const calculateItems = (): void => {
  const str = route.query.showIds as string | null;

  items.value = props.pairs.map((pair) => ({
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
    items.value.filter((pair) =>
      params.length > 0 ? params.includes(pair.id) : true
    );
  }
};

// Calculate the items on mount.
onMounted(() => calculateItems());

// Calculate the items when the pairs change.
watch(
  () => props.pairs,
  () => calculateItems()
);

// When a row is clicked.
const rowClicked = (e: Event, value: any): void => {
  router.push({ name: "Pair", params: { pairId: String(value.item.pair.id) } });
};
</script>
