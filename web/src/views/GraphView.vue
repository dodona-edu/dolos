<template>
  <v-container fluid fill-height>
    <v-row style="height: 100%">
      <v-col cols="12" class="no-y-padding">
        <Graph
          :files="files"
          :pairs="pairs"
          :cutoff="cutoff"
          :showSingletons="showSingletons"
          @selectedInfo="setSelectedInfo"
        >
          <!-- Extra UI elements to be added as overlay over the graph -->
          <form class="settings">
            <p>
              <label>
                Similarity ≥ {{ cutoff }}<br />
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
  </v-container>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
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
  }

  @Watch("$route")
  private onRouteChange(): void {
    this.cutoff = +this.$route.query.cutoff || 0.25;
  }
}
</script>
