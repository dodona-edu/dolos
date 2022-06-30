<template>
  <div class="graph-container">
    <Graph
      :pairs="clusterPairs"
      :files="clusterFiles"
      :legend="legend"
      :polygon="false"
      :clustering="clustering"
      :selected-node="selectionManager.currentSelections()[0]"
      @selectedNodeInfo="setSelectedNodeInfo"
    >
      <GraphLegend
        :current-files="clusterFiles"
        @legend="(l) => (legend = l)"
      />
      <div class="d-flex gel-items">
        <GraphElementList
          :cluster="cluster"
          :selected-files="selectedFiles"
          :scroll="true"
          @select-click="setSelectedNodeInfo"
        />
      </div>
    </Graph>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  shallowRef,
  onMounted,
} from "@vue/composition-api";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { getClusterElementsArray } from "@/util/clustering-algorithms/ClusterFunctions";
import { Pair, File } from "@/api/models";
import { SelectionManager } from "@/util/FileSelectionManager";
import { storeToRefs } from "pinia";
import { useApiStore } from "@/api/stores";
import { useClustering } from "@/composables";
import GraphElementList from "@/d3-tools/GraphElementList.vue";
import Graph from "../graph/Graph.vue";
import GraphLegend from "../../d3-tools/GraphLegend.vue";

export default defineComponent({
  props: {
    cluster: {
      type: Object as PropType<Cluster>,
      required: true,
    },
  },

  setup(props) {
    const { cutoff } = storeToRefs(useApiStore());
    const legend = shallowRef([]);
    const clusterFiles = shallowRef<File[]>([]);
    const clusterPairs = shallowRef<Pair[]>([]);
    const selectedFiles = shallowRef<File[]>([]);
    const selectionManager = shallowRef(new SelectionManager(1));

    // Clustering.
    const clustering = useClustering();

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

    onMounted(() => {
      updateClusterValues();

      selectionManager.value = new SelectionManager(1, (v) => {
        selectedFiles.value = v;
      });
    });

    return {
      cutoff,
      legend,
      clusterFiles,
      clusterPairs,
      selectedFiles,
      selectionManager,
      clustering,
      setSelectedNodeInfo,
    };
  },

  components: {
    GraphElementList,
    Graph: Graph as any,
    GraphLegend,
  },
});
</script>

<style scoped>
.graph-container {
  min-height: 400px;
}
.gel-items {
  max-height: 375px;
}
</style>
