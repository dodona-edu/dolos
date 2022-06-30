<template>
  <div class="graph-container">
    <Graph
      :pairs="clusterPairs"
      :files="clusterFiles"
      :legend="legendValue"
      :polygon="false"
      :clustering="clustering"
      :selected-node="selectionManager.currentSelections()[0]"
      @selectedNodeInfo="setSelectedNodeInfo"
    >
      <GraphLegend
        :legend.sync="legendValue"
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
  watch,
  onMounted,
} from "@vue/composition-api";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { getClusterElementsArray } from "@/util/clustering-algorithms/ClusterFunctions";
import { Pair, File } from "@/api/models";
import { SelectionManager } from "@/util/FileSelectionManager";
import { storeToRefs } from "pinia";
import { useApiStore } from "@/api/stores";
import { useClustering, useLegend } from "@/composables";
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
    const clusterFiles = shallowRef<File[]>([]);
    const clusterPairs = shallowRef<Pair[]>([]);
    const selectedFiles = shallowRef<File[]>([]);
    const selectionManager = shallowRef(new SelectionManager(1));

    const legend = useLegend(clusterFiles);
    const legendValue = ref(legend.value);

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

    return {
      cutoff,
      legend,
      legendValue,
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
