<template>
  <v-card>
    <v-card-title>
      Clusters
      <v-spacer></v-spacer>
      <form>
        <label>
          <div class="title-slider">Similarity ≥ {{ cutoff }}</div>
          <input type="range" min="0.25" max="1" step="0.01" v-model="cutoff" />
        </label>
      </form>
    </v-card-title>
    <v-expansion-panels>
      <ClusteringCard
        v-for="(cluster, index) in sortedClustering()"
        :key="index"
        :cluster="cluster"
        :cutoff="cutoff"
      ></ClusteringCard>
    </v-expansion-panels>
  </v-card>
</template>

<style scoped>
.title-slider {
  font-weight: 400;
  font-size: 1rem;
}
</style>

<script lang="ts">
import ClusteringCard from "@/components/clustering/ClusteringCard.vue";
import {
  getAverageClusterSimilarity,
  getClusterElements
} from "@/util/clustering-algorithms/ClusterFunctions";
import { Clustering, Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { SortingFunction } from "@/util/Types";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";

@Component({
  components: { ClusteringCard },
})
export default class ClusteringTable extends Vue {
  @Prop() loaded!: boolean;
  @Prop() clustering!: Clustering;
  @Prop({ default: "" }) search!: string;
  public cutoff = 0.5;

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

  @Watch("cutoff")
  private emitCutoff(): void {
    this.$emit("cutoffChange", this.cutoff);
  }

  private sortedClustering(): Clustering {
    const sort: SortingFunction<Cluster> = (a, b) =>
      getClusterElements(a).size - getClusterElements(b).size;

    const toSort = [...this.clustering];
    toSort.sort(sort);
    return toSort;
  }
}
</script>

<style scoped>
.v-data-table >>> tr:hover {
  cursor: pointer;
}
</style>
