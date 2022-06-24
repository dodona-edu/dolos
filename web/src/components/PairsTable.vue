<template>
  <v-card>
    <v-card-title>
      File pairs

      <v-spacer />

      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
        outlined
        dense
      />
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="items"
      :must-sort="true"
      :sort-by="'similarity'"
      :sort-desc="true"
      :items-per-page="15"
      :search="search"
      class="elevation-1"
      :footer-props="footerProps"
      @click:row="rowClicked"
    >
    </v-data-table>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from "@vue/composition-api";
import { useRouter, useRoute } from "@/composables";
import { Pair } from "@/api/models";

export default defineComponent({
  props: {
    pairs: {
      type: Array as PropType<Pair[]>,
      required: true,
    },
  },

  setup(props) {
    const router = useRouter();
    const route = useRoute();

    // Table headers
    const headers = [
      { text: "Left file", value: "left", sortable: false },
      { text: "Right file", value: "right", sortable: false },
      { text: "Similarity", value: "similarity" },
      { text: "Longest fragment", value: "longestFragment" },
      { text: "Total overlap", value: "totalOverlap" },
    ];

    // Footer props
    const footerProps = {
      itemsPerPageOptions: [15, 25, 50, 100, -1],
      showCurrentPage: true,
      showFirstLastPage: true,
    };

    // Search value.
    const search = ref("");

    // Items in the format for the the data-table.
    const items = computed(() => {
      const str = route.value.query.showIds as string | null;
      const params = (str?.split(",") || []).map((v: string) => +v);

      return Object.values(props.pairs)
        .filter((pair) => (params.length > 0 ? params.includes(pair.id) : true))
        .map((pair) => ({
          pair: pair,
          left: pair.leftFile.path,
          right: pair.rightFile.path,
          similarity: pair.similarity.toFixed(2),
          longestFragment: pair.longestFragment,
          totalOverlap: pair.totalOverlap,
        }));
    });

    // When a row is clicked.
    const rowClicked = (item: { pair: Pair }): void => {
      router.push({ name: "file", params: { id: item.pair.id } });
    };

    return {
      headers,
      footerProps,
      items,
      search,
      rowClicked,
    };
  },
});
</script>

<style scoped>
.v-data-table >>> tr:hover {
  cursor: pointer;
}
</style>
