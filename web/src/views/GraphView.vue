<template>
  <v-container fluid fill-height>
<<<<<<< HEAD
    <v-row style="height: 100vh">
=======
    <v-row style="height: 100%">
>>>>>>> 05cfdeb (Refactoring the Graph.vue component to be more abstract, which should enable reuse on the cluster screen)
      <v-col cols="12" class="no-y-padding">
        <Graph
          :files="files"
          :pairs="pairs"
          :cutoff="cutoff"
          :showSingletons="showSingletons"
<<<<<<< HEAD
          :legend="legend"
          :clustering="currentCluster"
          :zoomTo="'#clustering-table'"
          :selected-node="selectedNodeInfo"
          @selectedNodeInfo="setSelectedNodeInfo"
          @selectedClusterInfo="setClusterInfo"
=======
          @selectedInfo="setSelectedInfo"
>>>>>>> 05cfdeb (Refactoring the Graph.vue component to be more abstract, which should enable reuse on the cluster screen)
        >
          <!-- Extra UI elements to be added as overlay over the graph -->
          <form class="settings">
            <p>
              <label>
<<<<<<< HEAD
                Similarity ≥ {{ getCutoff() }}<br />
=======
                Similarity ≥ {{ cutoff }}<br />
>>>>>>> 05cfdeb (Refactoring the Graph.vue component to be more abstract, which should enable reuse on the cluster screen)
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
<<<<<<< HEAD
                singletons</label>
            </p>
          </form>

          <GraphLegend v-if="showLegend()" :current-files="fileArray" @legend="updateLegend"></GraphLegend>

          <GraphSelectedInfo :current-clustering="currentCluster" :selected-node-info="selectedNodeInfo"
                             :selected-cluster="selectedCluster">

          </GraphSelectedInfo>
        </Graph>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="11">
        <ClusteringTable
          id="clustering-table"
          :current-clustering="currentCluster"
          :loaded="dataLoaded"
        />
      </v-col>
    </v-row>
=======
                singletons</label
              >
            </p>
          </form>
          <div class="node-selected">
            <ul v-if="Object.values(legend).length > 1" class="legend">
              <li
                v-for="legendDatum of Object.values(legend).sort()"
                :key="legendDatum.label"
              >
                <label
                  ><input
                    type="checkbox"
                    v-model="legendDatum.selected"
                    class="legend-checkbox"
                    @change="updateGraph"
                  />
                  <span class="legend-label"
                    ><span
                      class="legend-color"
                      :style="{
                        'background-color': legendDatum.color,
                      }"
                    ></span>
                    {{ legendDatum.label }}
                  </span></label
                >
              </li>
            </ul>

            <!-- <span class="path">{{ selectedInfo.path }}</span> -->
            <ul v-if="selectedInfo.info !== undefined">
              <li v-if="selectedInfo.info.name !== undefined">
                Name: {{ selectedInfo.info.name }}
              </li>
              <li>Timestamp: {{ selectedInfo.info.timestamp }}</li>
              <li>Label: {{ selectedInfo.info.label }}</li>
            </ul>
          </div>
        </Graph>
      </v-col>
    </v-row>
>>>>>>> 05cfdeb (Refactoring the Graph.vue component to be more abstract, which should enable reuse on the cluster screen)
  </v-container>
</template>

<script lang="ts">
<<<<<<< HEAD
import { Component, Watch } from "vue-property-decorator";
import { File } from "@/api/api";
import DataView from "@/views/DataView";
import Graph from "../components/graph/Graph.vue";
import GraphLegend from "../d3-tools/GraphLegend.vue";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import GraphSelectedInfo from "@/d3-tools/GraphSelectedInfo.vue";
import ClusteringTable from "@/components/ClusteringTable.vue";

@Component({
  components: { Graph: Graph as any, GraphLegend, GraphSelectedInfo, ClusteringTable },
})
export default class PlagarismGraph extends DataView {
  public showSingletons = false;
  public legend = [];
  public selectedNodeInfo: File | null = null;
  public selectedCluster: Cluster | null = null;
  public fileArray: File[];
  public currentCluster;

  constructor() {
    super();
    this.fileArray = Array.from(Object.values(this.files));
    this.currentCluster = this.clustering;
  }

  mounted(): void {
    this.ensureData().then(() => { this.currentCluster = this.clustering; });
  }

  private setSelectedNodeInfo(v: File): void {
    this.selectedNodeInfo = v;
  }

  private setClusterInfo(c: Cluster | null): void {
    this.selectedCluster = c;
  }

  @Watch("cutoff")
  refreshClustering(): void {
    this.currentCluster = this.clustering;
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
=======
import { Component } from "vue-property-decorator";
import DataView from "@/views/DataView";
import Graph from "../components/Graph.vue";

type EmptySelectedInfo = {
  path: string;
  info: undefined;
};

type FullSelectedInfo = {
  path: string;
  info: {
    file: string;
    name: string;
    timestamp: string;
    label: string;
  };
};

type SelectedInfo = EmptySelectedInfo | FullSelectedInfo;

@Component({
  components: { Graph: Graph as any },
})
export default class PlagarismGraph extends DataView {
  public cutoff = 0.25;
  public showSingletons = false;
  public legend = [];
  public selectedInfo: SelectedInfo = { info: undefined, path: "" };

  mounted(): void {
    this.ensureData();
  }

  private setSelectedInfo(v: SelectedInfo): void {
    this.selectedInfo = v;
>>>>>>> 05cfdeb (Refactoring the Graph.vue component to be more abstract, which should enable reuse on the cluster screen)
  }
}
</script>
