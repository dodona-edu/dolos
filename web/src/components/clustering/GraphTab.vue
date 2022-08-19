<template>
  <v-row>
    <v-col cols="12" md="4" order="2" order-md="1">
      <GraphElementListCard
        :cluster="cluster"
        :selected-files="selectedFiles"
        max-height="400px"
        scroll
        clickable
        @select-click="setSelectedNodeInfo"
      />
    </v-col>

    <v-col cols="12" md="8" order="1" order-md="2">
      <Graph
        :pairs="clusterPairs"
        :files="clusterFiles"
        :legend="legendValue"
        :polygon="false"
        :clustering="clustering"
        :selected-node="selectionManager.currentSelections()[0]"
        :height="400"
        @selectedNodeInfo="setSelectedNodeInfo"
      >
        <GraphLegend
          :legend.sync="legendValue"
        />
      </Graph>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { shallowRef, ref, watch, onMounted } from "vue";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { getClusterElementsArray } from "@/util/clustering-algorithms/ClusterFunctions";
import { Pair, File } from "@/api/models";
import { SelectionManager } from "@/util/FileSelectionManager";
import { useLegend } from "@/composables";
import { storeToRefs } from "pinia";
import { usePairStore } from "@/api/stores";
import GraphElementListCard from "@/d3-tools/GraphElementListCard.vue";
import Graph from "../graph/Graph.vue";
import GraphLegend from "../../d3-tools/GraphLegend.vue";

interface Props {
  cluster: Cluster;
}

const props = withDefaults(defineProps<Props>(), {});
const pairStore = usePairStore();
const clusterFiles = shallowRef<File[]>([]);
const clusterPairs = shallowRef<Pair[]>([]);
const selectedFiles = shallowRef<File[]>([]);
const selectionManager = shallowRef(new SelectionManager(1));

const legend = useLegend(clusterFiles);
const legendValue = ref(legend.value);

// Clustering.
const clustering = storeToRefs(pairStore);

const updateClusterValues = (): void => {
  if (props.cluster) {
    clusterFiles.value = getClusterElementsArray(props.cluster);
    clusterPairs.value = Array.from(props.cluster);
  } else {
    clusterFiles.value = [];
    clusterPairs.value = [];
  }
};

const setSelectedNodeInfo = (s: File): void => {
  selectionManager.value.select(s);
};

watch(
  () => legend.value,
  (legend) => {
    legendValue.value = legend;
  }
);

watch(
  () => props.cluster,
  () => {
    updateClusterValues();
  }
);

onMounted(() => {
  updateClusterValues();

  selectionManager.value = new SelectionManager(1, (v) => {
    selectedFiles.value = v;
  });
});
</script>
