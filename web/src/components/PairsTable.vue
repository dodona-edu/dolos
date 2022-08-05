<template>
  <div>
    <v-row class="heading" align="center">
      <v-col cols="12" md="6">
        <h2 class="heading-title">
          File pairs
        </h2>
        <div class="heading-subtitle text--secondary">
          A pair is a set of 2 files that are compared for similarity and matching code fragments.
        </div>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Search"
          single-line
          hide-details
          outlined
          dense
        />
      </v-col>
    </v-row>

    <v-card>
      <v-data-table
        :headers="headers"
        :items="items"
        :must-sort="true"
        :sort-by="'similarity'"
        :sort-desc="true"
        :items-per-page="15"
        :search="search"
        :footer-props="footerProps"
        @click:row="rowClicked"
      />
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef, onMounted } from "vue";
import { useRouter, useRoute } from "@/composables";
import { Pair } from "@/api/models";
import { DataTableHeader } from "vuetify";

interface Props {
  pairs: Pair[];
}

const props = withDefaults(defineProps<Props>(), {});
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
  itemsPerPageOptions: [15, 25, 50, 100, -1],
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
