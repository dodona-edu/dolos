<template>
  <v-container fluid fill-height>
    <v-row style="height: 100vh">
      <v-col cols="12" class="no-y-padding">
        <Graph
          :files="files"
          :pairs="pairs"
          :cutoff="cutoff"
          :showSingletons="showSingletons"
          :legend="legend"
          @selectedNodeInfo="setSelectedNodeInfo"
          @selectedClusterInfo="setClusterInfo"
        >
          <!-- Extra UI elements to be added as overlay over the graph -->
          <form class="settings">
            <p>
              <label>
                Similarity ≥ {{ getCutoff() }}<br />
                <input
                  type="range"
                  min="0.25"
                  max="1"
                  step="0.01"
                  v-model="cutoff"
                />
              </label>
            </p>
            <p>
              <label
                ><input type="checkbox" v-model="showSingletons" /> Display
                singletons</label
              >
            </p>
          </form>

          <GraphLegend v-if="showLegend()" :files="fileArray" @legend="updateLegend"></GraphLegend>

          <GraphSelectedInfo :selected-node-info="selectedNodeInfo" :selected-cluster="selectedCluster">

          </GraphSelectedInfo>
        </Graph>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="11">
        <ClusteringTable
          :current-clustering="clustering"
          :loaded="dataLoaded"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { File } from "@/api/api";
import DataView from "@/views/DataView";
import Graph from "../components/graph/Graph.vue";
import GraphLegend from "../d3-tools/GraphLegend.vue";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import GraphSelectedInfo from "@/d3-tools/GraphSelectedInfo.vue";
import ClusteringTable from "@/components/ClusteringTable.vue";

type EmptySelectedNodeInfo = {
  path: string;
  info: undefined;
};

type FullSelectedNodeInfo = {
  path: string;
  info: {
    file: string;
    name: string;
    timestamp: string;
    label: string;
  };
};

export type SelectedNodeInfo = EmptySelectedNodeInfo | FullSelectedNodeInfo;

@Component({
  components: { Graph: Graph as any, GraphLegend, GraphSelectedInfo, ClusteringTable },
})
export default class PlagarismGraph extends DataView {
  public showSingletons = false;
  public legend = [];
  public selectedNodeInfo: SelectedNodeInfo = { info: undefined, path: "" };
  public selectedCluster: Cluster | null = null;
  public fileArray: File[];

  constructor() {
    super();
    this.fileArray = Array.from(Object.values(this.files));
  }

  mounted(): void {
    this.ensureData();
  }

  private setSelectedNodeInfo(v: SelectedNodeInfo): void {
    console.log("setting");
    this.selectedNodeInfo = v;
  }

  private setClusterInfo(c: Cluster | null): void {
    this.selectedCluster = c;
  }

  getCutoff(): number {
    return this.cutoff;
  }

  updateLegend(l: never[]): void {
    this.legend = l;
  }

  @Watch("files")
  initFileArray(): void {
    this.fileArray = Array.from(Object.values(this.files));
  }

  showLegend(): boolean {
    const { cutoff, ...colors } = this.$route.query;

    return Array.from(Object.values(colors)).length === 0;
  }
}
</script>
