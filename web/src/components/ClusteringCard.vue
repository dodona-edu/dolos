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
          <div class="d-flex">
            <v-icon>mdi-chevron-right</v-icon>
            <h3>Statistics</h3>
          </div>
          <ul>
            <v-list-item>
              <v-list-item-title>
                <v-icon>mdi-menu-right</v-icon>

                <b>Size: </b>
                {{ getClusterElements(cluster).size }}
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>
                <v-icon>mdi-menu-right</v-icon>

                <b>Average Similarity: </b>
                {{ averageSimilarity(cluster) }}
              </v-list-item-title>
            </v-list-item>
          </ul>

          <div class="d-flex">
            <v-icon>mdi-chevron-right</v-icon>
            <h3>Files</h3>
          </div>
          <ul>
            <v-list-item
              v-for="item in getClusterElements(cluster)"
              :key="item.id"
            >
              <v-icon>mdi-menu-right</v-icon>

              <v-list-item-title>{{ item.path }}</v-list-item-title>
            </v-list-item>
          </ul>

          <HeatMap :cluster="cluster"></HeatMap>
        </div>
        <div>
          <v-btn @click="graphView(cluster)">Graph view</v-btn>
          <v-btn @click="pairView(cluster)">Pair view</v-btn>
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
import HeatMap from "./HeatMap.vue";

@Component({ components: { HeatMap } })
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
      .map((c) => c.id)
      .join(",");

    this.$router.push(`/graph?cutoff=${this.cutoff}&red=${items}`);
  }

  public pairView(cluster: Cluster): void {
    const items = Array.from(cluster)
      .map((v) => v.id)
      .join(",");

    this.$router.push(`/?showIds=${items}`);
  }
}
</script>
