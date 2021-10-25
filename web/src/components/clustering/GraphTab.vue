<template>
  <div class="graph-container">
    <Graph
      :pairs="clusterPairs"
      :files="clusterFiles"
      :cutoff="cutoff"
    ></Graph>
  </div>
</template>

<script lang='ts'>
import { Component, Prop, Watch } from "vue-property-decorator";
import Graph from "../Graph.vue";
import DataView from "@/views/DataView";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { getClusterElementsArray } from "@/util/clustering-algorithms/ClusterFunctions";
import { Pair, File } from "@/api/api";

@Component({
  components: { Graph: Graph as any },
})
export default class GraphTab extends DataView {
  @Prop() cluster!: Cluster;

  clusterFiles: File[] = [];
  clusterPairs: Pair[] = [];

  cutoff = 0;

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
