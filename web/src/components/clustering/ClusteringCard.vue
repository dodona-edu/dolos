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
      <v-tabs right v-model="activeTab">
        <v-tab @click="graphView(cluster)" :key="1">Graph view</v-tab>
        <v-tab-item></v-tab-item>
        <v-tab @click="pairView(cluster)" :key="2">Pair view</v-tab>
        <v-tab-item ></v-tab-item>

        <div class="empty-space"></div>

        <v-tab v-if="cluster && showClusterTimeline(cluster)" :key="3">Time Chart</v-tab>
        <v-tab-item v-if="cluster && showClusterTimeline(cluster)">
          <TimeSeriesCard :cluster="cluster"/>
        </v-tab-item>

        <v-tab :key="4">Similarity Data</v-tab>
        <v-tab-item>
          <DataTab :cluster="cluster" :cutoff="cutoff" />
        </v-tab-item>

        <v-tab :key="5"> Heatmap </v-tab>
        <v-tab-item> <HeatMap :cluster="cluster" /> </v-tab-item>

        <v-tab :key="6"> Cluster </v-tab>
        <v-tab-item> <GraphTab :cluster="cluster" /> </v-tab-item>
      </v-tabs>
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
import DataTab from "./DataTab.vue";
import GraphTab from "./GraphTab.vue";
import TimeSeriesCard from "./TimeSeriesCard.vue";

@Component({ components: { HeatMap, DataTab, GraphTab, TimeSeriesCard } })
export default class ClusteringCard extends Vue {
  @Prop() cluster!: Cluster;
  @Prop() cutoff!: number;
  private activeTab = 5;

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

  public pairView(cluster: Cluster): void {
    const items = Array.from(cluster)
      .map(v => v.id)
      .join(",");

    this.$router.push(`/?showIds=${items}`);
  }

  public showClusterTimeline(cluster: Cluster): boolean {
    return getClusterElementsArray(cluster).every(f => f.extra?.timestamp);
  }
}
</script>

<style scoped>
.empty-space {
  width: 50px
}
</style>
