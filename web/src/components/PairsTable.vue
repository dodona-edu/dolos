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

<script lang="ts">
import { defineComponent, PropType, computed, shallowRef } from "vue";
import { useRouter, useRoute } from "@/composables";
import { Pair, ObjMap } from "@/api/models";

export default defineComponent({
  props: {
    pairs: {
      type: Object as PropType<ObjMap<Pair>>,
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
    const search = shallowRef("");

    // Items in the format for the the data-table.
    const items = computed(() => {
      const str = route.value.query.showIds as string | null;
      const params = (str?.split(",") || []).map((v: string) => +v);

      return Object.values(props.pairs)
        .filter((pair) => (params.length > 0 ? params.includes(pair.id) : true))
        .map((pair) => ({
          pair: pair,
          left: pair.leftFile.shortPath,
          right: pair.rightFile.shortPath,
          similarity: pair.similarity.toFixed(2),
          longestFragment: pair.longestFragment,
          totalOverlap: pair.totalOverlap,
        }));
    });

    // When a row is clicked.
    const rowClicked = (item: { pair: Pair }): void => {
      router.push(`/compare/${item.pair.id}`);
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
