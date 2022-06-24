<template>
  <v-expansion-panel>
    <v-expansion-panel-header class="noflex">
      <div class="clustering-tag-container">
        <FileTagList :current-files="clusterFiles(cluster)"></FileTagList>
      </div>
    </v-expansion-panel-header>
    <v-expansion-panel-content>
      <v-tabs right v-model="activeTab">
        <v-tab :to="`/pairs/?showIds=${pairViewItems(cluster)}`">
          Pair view
        </v-tab>
        <v-tab-item ></v-tab-item>

        <div class="empty-space"></div>

        <v-tab v-if="cluster && showClusterTimeline(cluster)" :key="2">Time Chart</v-tab>
        <v-tab-item v-if="cluster && showClusterTimeline(cluster)">
          <TimeSeriesCard :cluster="cluster"/>
        </v-tab-item>

        <v-tab :key="4"> Heatmap </v-tab>
        <v-tab-item> <HeatMap :cluster="cluster" /> </v-tab-item>

        <v-tab :key="5"> Cluster </v-tab>
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
import ClusteringFileTag from "@/components/clustering/ClusteringFileTag.vue";
import FileTagList from "@/components/clustering/FileTagList.vue";

@Component({ components: { HeatMap, DataTab, GraphTab, TimeSeriesCard, ClusteringFileTag, FileTagList } })
export default class ClusteringCard extends Vue {
  @Prop() cluster!: Cluster;
  @Prop() cutoff!: number;
  private activeTab = 1;

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

  public pairViewItems(cluster: Cluster): string {
    const items = Array.from(cluster)
      .map(v => v.id)
      .join(",");

    return items;
  }

  public showClusterTimeline(cluster: Cluster): boolean {
    return getClusterElementsArray(cluster).every(f => f.extra?.timestamp);
  }

  public clusterFiles = getClusterElementsArray;
}
</script>

<style scoped>
.empty-space {
  width: 50px;
}

.noflex > * {
  flex: none;
}

.clustering-tag-container {
  width: 70%;
  display: flex;
  justify-content: flex-start;
  overflow: hidden;
}

.no-markup {
  color: inherit;
}
</style>
