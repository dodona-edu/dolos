<template>
  <v-expansion-panel>
    <v-expansion-panel-header>
      Cluster
      <small></small>
      <small>Size: {{ getClusterElements(cluster).size }}</small>
      <small>Similarity: {{ averageSimilarity(cluster) }}</small>

      <v-spacer></v-spacer>
    </v-expansion-panel-header>
    <v-expansion-panel-content>
      <div class="d-flex justify-space-between">
        <div>
          <h3>Data</h3>
          <ul>
            <li><b>Size:</b> {{ getClusterElements(cluster).size }}</li>
            <li><b>Average Similarity:</b> {{ averageSimilarity(cluster) }}</li>
          </ul>

          <h3>Files</h3>
          <ul>
            <li v-for="item in getClusterElements(cluster)" :key="item.id">
              {{ item.path }}
            </li>
          </ul>
        </div>
        <div>
          <v-btn @click="graphView(cluster)">Graph view</v-btn>
        </div>
      </div>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script lang=ts>
import { Component, Vue, Prop } from "vue-property-decorator";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import {
  getAverageClusterSimilarity,
  getClusterElements,
  getClusterElementsArray,
} from "@/util/clustering-algorithms/ClusterFunctions";
import { File } from "@/api/api";

@Component
export default class ClusteringCard extends Vue {
  @Prop() cluster!: Cluster;
  @Prop() cutoff!: number;

  averageSimilarity(cluster: Cluster): string {
    return getAverageClusterSimilarity(cluster).toFixed(2);
  }

  getClusterElements(cluster: Cluster): Set<File> {
    return getClusterElements(cluster);
  }

  public graphView(cluster: Cluster): void {
    const items = getClusterElementsArray(cluster)
      .map(c => c.id)
      .join(",");

    this.$router.push(`/graph?cutoff=${this.cutoff}&red=${items}`);
  }
}
</script>
