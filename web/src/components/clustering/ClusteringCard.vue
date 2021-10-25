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
      <v-tabs right>
        <v-tab>Similarity Data</v-tab>
        <v-tab-item> <DataTab :cluster="cluster" :cutoff="cutoff"/> </v-tab-item>

        <v-tab> Heatmap </v-tab>
        <v-tab-item> <HeatMap :cluster="cluster"/> </v-tab-item>

        <v-tab> Cluster </v-tab>
        <v-tab-item> <GraphTab :cluster="cluster"/> </v-tab-item>
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
} from "@/util/clustering-algorithms/ClusterFunctions";
import { File } from "@/api/api";
import HeatMap from "./HeatMap.vue";
import DataTab from "./DataTab.vue";
import GraphTab from "./GraphTab.vue";

@Component({ components: { HeatMap, DataTab, GraphTab } })
export default class ClusteringCard extends Vue {
  @Prop() cluster!: Cluster;
  @Prop() cutoff!: number;

  averageSimilarity(cluster: Cluster): string {
    return getAverageClusterSimilarity(cluster).toFixed(2);
  }

  getClusterElements(cluster: Cluster): Set<File> {
    return getClusterElements(cluster);
  }
}
</script>

<style scoped>
.file-element {
  flex: 0 1 calc(33% - 20px);
}
</style>
