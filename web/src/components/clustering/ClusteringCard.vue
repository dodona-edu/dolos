<template>
  <v-expansion-panel>
    <v-expansion-panel-header class="noflex">
      <div class="clustering-tag-container">
        <FileTagList :current-files="clusterFiles" />
      </div>
    </v-expansion-panel-header>

    <v-expansion-panel-content>
      <v-tabs v-model="activeTab" right>
        <v-tab :to="`/pairs/?showIds=${pairViewItems}`">
          Pair View
        </v-tab>

        <div class="empty-space" />

        <v-tab v-if="cluster && showClusterTimeline">
          Time Chart
        </v-tab>

        <v-tab>
          Heatmap
        </v-tab>

        <v-tab>
          Cluster
        </v-tab>
      </v-tabs>

      <v-tabs-items v-model="activeTab">
        <v-tab-item>
          <!-- TODO: place pairs view here -->
        </v-tab-item>

        <v-tab-item v-if="cluster && showClusterTimeline">
          <TimeSeriesCard :cluster="cluster" />
        </v-tab-item>

        <v-tab-item>
          <HeatMap :cluster="cluster" />
        </v-tab-item>

        <v-tab-item>
          <GraphTab :cluster="cluster" />
        </v-tab-item>
      </v-tabs-items>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  computed,
  toRef,
} from "@vue/composition-api";
import { useCluster } from "@/composables";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { getClusterElementsArray } from "@/util/clustering-algorithms/ClusterFunctions";
import HeatMap from "./HeatMap.vue";
import GraphTab from "./GraphTab.vue";
import TimeSeriesCard from "./TimeSeriesCard.vue";
import FileTagList from "@/components/clustering/FileTagList.vue";

export default defineComponent({
  props: {
    cluster: {
      type: Set as PropType<Cluster>,
      required: true,
    },
  },

  setup(props) {
    const activeTab = ref(1);
    const { clusterFiles } = useCluster(toRef(props, "cluster"));

    // If the timeline should be shown.
    // Timeline will only be shown if every cluster element has a timestamp.
    const showClusterTimeline = computed(() => {
      return getClusterElementsArray(props.cluster).every(
        (e) => e.extra?.timestamp
      );
    });

    // String of ids to show in the pair view.
    // TODO: it may be better to inline the pair-table in the future for better UX.
    const pairViewItems = computed(() => {
      return Array.from(props.cluster)
        .map((element) => element.id)
        .join(",");
    });

    return {
      clusterFiles,
      activeTab,
      showClusterTimeline,
      pairViewItems,
    };
  },

  components: {
    HeatMap,
    GraphTab,
    TimeSeriesCard,
    FileTagList,
  },
});
</script>

<style scoped>
.empty-space {
  width: 50px;
}

.noflex > * {
  flex: none;
}

.clustering-tag-container {
  width: 70%;
  display: flex;
  justify-content: flex-start;
  overflow: hidden;
}

.no-markup {
  color: inherit;
  text-decoration: none;
}
</style>
