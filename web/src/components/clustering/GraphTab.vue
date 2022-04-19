<template>
  <div class="graph-container">
    <Graph
      :pairs="clusterPairs"
      :files="clusterFiles"
      :cutoff="cutoff"
      :legend="legend"
      :polygon="false"
      :clustering="clustering"
      :selected-node="selectionManager.currentSelections()[0]"
      @selectedNodeInfo="setSelectedNodeInfo"
    >
    <GraphLegend :current-files="clusterFiles" @legend="l => legend = l"></GraphLegend>
    <GraphElementList :cluster="cluster"
                      :selected-files="selectedFiles"
                      @select-file="setSelectedNodeInfo"
                      :scroll="true"
    ></GraphElementList>
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
import { SelectionManager } from "@/util/FileSelectionManager";

@Component({
  components: { GraphElementList, Graph: Graph as any, GraphLegend },
})
export default class GraphTab extends DataView {
  @Prop() cluster!: Cluster;

  clusterFiles: File[] = [];
  clusterPairs: Pair[] = [];

  private selectionManager = new SelectionManager(1);
  selectedFiles: File[] = [];

  legend = [];

  mounted(): void {
    this.ensureData();
    this.updateClusterValues();

    this.selectionManager = new SelectionManager(1, v => {
      this.selectedFiles = v;
    });
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

  setSelectedNodeInfo(s: File): void {
    this.selectionManager.select(s);
  }
}
</script>

<style scoped>
.graph-container {
  min-height: 400px;
}
</style>
