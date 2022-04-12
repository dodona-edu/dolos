<template>
  <div class="graph-container">
    <h2>Graph</h2>
    <Graph
      :pairs="clusterPairs"
      :files="clusterFiles"
      :cutoff="cutoff"
      :legend="legend"
      :polygon="false"
      :clustering="clustering"
      @selectedNodeInfo="setSelectedNodeInfo"
    >
    <GraphLegend :files="clusterFiles" @legend="l => legend = l"></GraphLegend>
    <GraphElementList :cluster="cluster"
                      :hovering-file="(selectedNode && selectedNode.info) ?
              selectedNode.info.file : null"></GraphElementList>
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
import GraphElementList from "@/d3-tools/GraphElementList.vue";
import { SelectedNodeInfo } from "@/views/GraphView.vue";

@Component({
  components: { GraphElementList, Graph: Graph as any, GraphLegend },
})
export default class GraphTab extends DataView {
  @Prop() cluster!: Cluster;

  clusterFiles: File[] = [];
  clusterPairs: Pair[] = [];

  selectedNode: SelectedNodeInfo | null = null;

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

  setSelectedNodeInfo(s: SelectedNodeInfo): void {
    console.log(s);
    this.selectedNode = s;
  }
}
</script>

<style scoped>
.graph-container {
  min-height: 400px;
}
</style>
