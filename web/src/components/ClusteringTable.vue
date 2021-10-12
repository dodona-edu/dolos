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
      :sort-by="'size'"
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
import { Clustering, Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import {
  getAverageClusterSimilarity,
  getClusterElements,
  getClusterElementsArray,
} from "@/util/clustering-algorithms/ClusterFunctions";

@Component
export default class ClusteringTable extends Vue {
  @Prop() loaded!: boolean;
  @Prop() clustering!: Clustering;
  @Prop({ default: "" }) search!: string;
  @Prop() cutoff!: number;

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

  get items(): Array<{ id: number; size: number; similarity: string }> {
    return Object.values(this.clustering).map((cluster, id) => ({
      id,
      size: getClusterElements(cluster).size,
      similarity: getAverageClusterSimilarity(cluster).toFixed(2),
      cluster,
    }));
  }

  public rowClicked(item: { cluster: Cluster }): void {
    const items = getClusterElementsArray(item.cluster)
      .map(c => c.id)
      .join(",");
    this.$router.push(`/graph?cutoff=${this.cutoff}&red=${items}`);
  }
}
</script>

<style scoped>
.v-data-table >>> tr:hover {
  cursor: pointer;
}
</style>
