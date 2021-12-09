<template>
  <div class="graph-container">
    <h2>Graph</h2>
    <Graph
      :pairs="clusterPairs"
      :files="clusterFiles"
      :cutoff="cutoff"
      :legend="legend"
    >
    <GraphLegend :files="clusterFiles" @legend="l => legend = l"></GraphLegend>

    </Graph>
  </div>
</template>

<script lang='ts'>
import { Component, Prop, Watch } from "vue-property-decorator";
import Graph from "../graph/Graph.vue";
import GraphLegend from "../../d3-tools/GraphLegend.vue";

import DataView from "@/views/DataView";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { getClusterElementsArray } from "@/util/clustering-algorithms/ClusterFunctions";
import { Pair, File } from "@/api/api";

@Component({
  components: { Graph: Graph as any, GraphLegend },
})
export default class GraphTab extends DataView {
  @Prop() cluster!: Cluster;

  clusterFiles: File[] = [];
  clusterPairs: Pair[] = [];

  cutoff = 0;
  legend = [];

  mounted(): void {
    this.ensureData();
    this.updateClusterValues();
  }

  @Watch("cluster")
  updateClusterValues(): void {
    if (this.cluster) {
      this.clusterFiles = getClusterElementsArray(this.cluster);
      this.clusterPairs = Array.from(this.cluster);
    } else {
      this.clusterFiles = [];
      this.clusterPairs = [];
    }
  }
}
</script>

<style scoped>
.graph-container {
  min-height: 400px;
}
</style>
