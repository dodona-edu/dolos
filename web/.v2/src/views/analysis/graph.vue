<template>
  <v-container fluid fill-height>
    <v-row class="graph-container">
      <v-col cols="12" class="no-y-padding">
        <graph
          :showSingletons="showSingletons"
          :legend="legend"
          :clustering="clustering"
          :files="filesActiveList"
          :pairs="pairsActiveList"
          :selected-node.sync="selectedNode"
          :selected-cluster.sync="selectedCluster"
          polygon
        >
          <!-- Extra UI elements to be added as overlay over the graph -->
          <v-form class="graph-settings">
            <similarity-setting />

            <v-checkbox
              v-model="showSingletons"
              label="Display singletons"
              dense
            />
          </v-form>

          <graph-legend
            v-if="showLegend"
            :legend.sync="legend"
          />

          <graph-selected-info
            :current-clustering="clustering"
            :selected-node="selectedNode"
            :selected-cluster="selectedCluster"
            :legend="legend"
          />
        </graph>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { shallowRef, computed } from "vue";
import { storeToRefs } from "pinia";
import { File } from "@/api/models";
import { Cluster } from "@/util/Cluster";
import { useFileStore, usePairStore } from "@/api/stores";
import { useRoute } from "@/composables";

const route = useRoute();
const { filesActiveList, legend } = storeToRefs(useFileStore());
const { pairsActiveList, clustering } = storeToRefs(usePairStore());

// Show singletons in the graph.
const showSingletons = shallowRef(false);

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
    height: calc(100vh - 85px);
  }

  &-settings {
    position: absolute;
    right: 0;
    bottom: 1rem;
    z-index: 2;
  }
}
</style>
