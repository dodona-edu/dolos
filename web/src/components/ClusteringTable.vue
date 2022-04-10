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
    <v-expansion-panels v-model="panel">
      <ClusteringCard
        v-for="(cluster, index) in sortedClustering()"
        :key="index"
        :cluster="cluster"
        :cutoff="cutoff"
        :id="`clustering-card-${index}`"
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
import { Component, Prop, Watch } from "vue-property-decorator";
import DataView from "@/views/DataView";

@Component({
  components: { ClusteringCard },
})
export default class ClusteringTable extends DataView {
  @Prop() loaded!: boolean;
  @Prop() currentClustering!: Clustering;
  @Prop({ default: "" }) search!: string;

  public panel = -1;

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
    return Object.values(this.currentClustering).map((cluster, id) => ({
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
      getClusterElements(b).size - getClusterElements(a).size;

    const toSort = [...this.currentClustering];
    toSort.sort(sort);
    return toSort;
  }

  @Watch("$route")
  private onRouteChange(): void {
    if (this.$route.hash) {
      const hit = /[0-9]+/.exec(this.$route.hash)?.[0];
      if (hit !== undefined) {
        this.panel = +hit;
        setTimeout(() => {
          this.$vuetify.goTo(`#clustering-card-${this.panel}`);
        }, 500);
      }
    }
  }
}
</script>

<style scoped>
.v-data-table >>> tr:hover {
  cursor: pointer;
}
</style>
