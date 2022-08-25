<template>
  <v-container fluid fill-height>
    <v-row class="graph-container">
      <v-col cols="12" class="no-y-padding">
        <Graph
          :showSingletons="showSingletons"
          :legend="legendValue"
          :clustering="clustering"
          :files="filesList"
          :pairs="pairsList"
          :zoomTo="'#clustering-table'"
          :selected-node.sync="selectedNode"
          :selected-cluster.sync="selectedCluster"
          polygon
        >
          <!-- Extra UI elements to be added as overlay over the graph -->
          <v-form class="graph-settings">
            <SimilaritySetting />

            <v-checkbox
              v-model="showSingletons"
              label="Display singletons"
              dense
            />
          </v-form>

          <GraphLegend
            v-if="showLegend"
            :legend.sync="legendValue"
          />

          <GraphSelectedInfo
            :current-clustering="clustering"
            :selected-node="selectedNode"
            :selected-cluster="selectedCluster"
            :legend="legendValue"
          />
        </Graph>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <clustering-table />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, shallowRef, computed } from "vue";
import { storeToRefs } from "pinia";
import { File, Legend } from "@/api/models";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { useFileStore, usePairStore } from "@/api/stores";
import { useRoute } from "@/composables";
import GraphSelectedInfo from "@/d3-tools/GraphSelectedInfo.vue";
import ClusteringTable from "@/components/ClusteringTable.vue";
import Graph from "@/components/graph/Graph.vue";
import GraphLegend from "@/d3-tools/GraphLegend.vue";
import SimilaritySetting from "@/components/settings/SimilaritySetting.vue";

const route = useRoute();
const { filesList, legend } = storeToRefs(useFileStore());
const { pairsList, clustering } = storeToRefs(usePairStore());

// Show singletons in the graph.
const showSingletons = shallowRef(false);

// Legend.
const legendValue = ref<Legend>(legend.value);

// Node in the graph that is currently selected (file).
const selectedNode = shallowRef<File>();

// Cluster that is currently selected.
const selectedCluster = shallowRef<Cluster>();

// Should the legend be displayed.
const showLegend = computed(() => {
  const { ...colors } = route.value.query;
  return Array.from(Object.values(colors)).length === 0;
});
</script>

<style lang="scss" scoped>
.graph {
  &-container {
    height: calc(100vh - 75px);
  }

  &-settings {
    position: absolute;
    right: 0;
    bottom: 1rem;
    z-index: 2;
  }
}
</style>
