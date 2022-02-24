<template>
  <v-container fluid fill-height>
    <v-row style="height: 100%">
      <v-col cols="12" class="no-y-padding">
        <Graph
          :files="files"
          :pairs="pairs"
          :cutoff="cutoff"
          :showSingletons="showSingletons"
          :legend="legend"
          @selectedInfo="setSelectedInfo"
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
          <div class="node-selected">
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
  </v-container>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { File } from "@/api/api";
import DataView from "@/views/DataView";
import Graph from "../components/graph/Graph.vue";
import GraphLegend from "../d3-tools/GraphLegend.vue";

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
  components: { Graph: Graph as any, GraphLegend },
})
export default class PlagarismGraph extends DataView {
  public showSingletons = false;
  public legend = [];
  public selectedInfo: SelectedInfo = { info: undefined, path: "" };
  public fileArray: File[];

  constructor() {
    super();
    this.fileArray = Array.from(Object.values(this.files));
  }

  mounted(): void {
    this.ensureData();
  }

  private setSelectedInfo(v: SelectedInfo): void {
    this.selectedInfo = v;
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

  @Watch("$route")
  private onRouteChange(): void {
    this.cutoff = +this.$route.query.cutoff || 0.25;
  }

  showLegend(): boolean {
    const { cutoff, ...colors } = this.$route.query;

    return Array.from(Object.values(colors)).length === 0;
  }
}
</script>
