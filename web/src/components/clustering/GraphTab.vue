<template>
  <v-row>
    <v-col cols="12" md="4" order="2" order-md="1">
      <GraphElementListCard
        :cluster="cluster"
        :selected-files="selectedFiles"
        max-height="400px"
        scroll
        clickable
      />
    </v-col>

    <v-col cols="12" md="8" order="1" order-md="2">
      <graph
        :pairs="clusterPairs"
        :files="clusterFiles"
        :legend="legend"
        :polygon="false"
        :clustering="clustering"
        :selected-node.sync="selectedNode"
        :height="400"
      >
        <graph-legend
          :legend.sync="legend"
        />
      </graph>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { shallowRef, watch, onMounted } from "vue";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { getClusterElementsArray } from "@/util/clustering-algorithms/ClusterFunctions";
import { Pair, File } from "@/api/models";
import { usePartialLegend } from "@/composables";
import { storeToRefs } from "pinia";
import { usePairStore } from "@/api/stores";

interface Props {
  cluster: Cluster;
}

const props = withDefaults(defineProps<Props>(), {});
const pairStore = usePairStore();
const clusterFiles = shallowRef<File[]>([]);
const clusterPairs = shallowRef<Pair[]>([]);
const selectedFiles = shallowRef<File[]>([]);

const legend = usePartialLegend(clusterFiles);

// Clustering.
const { clustering } = storeToRefs(pairStore);

// Selected node.
const selectedNode = shallowRef<File>();

const updateClusterValues = (): void => {
  if (props.cluster) {
    clusterFiles.value = getClusterElementsArray(props.cluster);
    clusterPairs.value = Array.from(props.cluster);
  } else {
    clusterFiles.value = [];
    clusterPairs.value = [];
  }
};
watch(
  () => props.cluster,
  () => {
    updateClusterValues();
  }
);

watch(selectedNode, (selectedNode) => {
  selectedFiles.value = selectedNode ? [selectedNode] : [];
});

onMounted(() => {
  updateClusterValues();
});
</script>
