<template>
  <v-card>
    <v-card-title>
      File pairs
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
      ></v-text-field>
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="items"
      :must-sort="true"
      :sort-by="'similarity'"
      :sort-desc="true"
      :items-per-page="15"
      :search="search"
      :loading="!loaded"
      class="elevation-1"
      :footer-props="footerprops"
      @click:row="rowClicked"
    >
    </v-data-table>
  </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Pair } from "@/api/api";
import { Clustering } from "@/util/Clustering";

@Component
export default class ClusteringTable extends Vue {
  @Prop() loaded!: boolean;
  @Prop() clustering!: Clustering;
  @Prop({ default: "" }) search!: string;

  headers = [
    { text: "Cluster Id", value: "id", sortable: true },
    { text: "Cluster Size", value: "size", sortable: true },
    { text: "Average Similarity", value: "similarity" },
  ];

  footerprops = {
    itemsPerPageOptions: [15, 25, 50, 100, -1],
    showCurrentPage: true,
    showFirstLastPage: true,
  };

  get items(): Array<{id: number, size:number, similarity: string}> {
    return Object.values(this.clustering).map((cluster, id) => ({
      id,
      size: cluster.getElementSize(),
      similarity: cluster.getAverageSimilarity().toFixed(2),
    }));
  }

  public rowClicked(item: {pair: Pair}): void {
    // this.$router.push(`/compare/${item.pair.id}`);
  }
}
</script>

<style scoped>
  .v-data-table >>> tr:hover {
    cursor: pointer;
  }
</style>
