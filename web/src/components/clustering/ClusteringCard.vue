<template>
  <v-expansion-panel class="clustering-card">
    <v-expansion-panel-header>
      <FileTagList :current-files="clusterFiles" />
    </v-expansion-panel-header>

    <v-expansion-panel-content>
      <v-tabs v-model="activeTab">
        <v-tab>
          Pair View
        </v-tab>

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

      <v-tabs-items v-model="activeTab" class="mt-4">
        <v-tab-item>
          <PairsTable :pairs="clusterPairs" />
        </v-tab-item>

        <v-tab-item v-if="cluster && showClusterTimeline">
          <TimeSeriesCard :cluster="cluster" />
        </v-tab-item>

        <v-tab-item>
          <HeatMap :cluster="props.cluster" />
        </v-tab-item>

        <v-tab-item>
          <GraphTab :cluster="props.cluster" />
        </v-tab-item>
      </v-tabs-items>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script lang="ts" setup>
import { shallowRef, computed, toRef } from "vue";
import { useCluster } from "@/composables";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { getClusterElementsArray } from "@/util/clustering-algorithms/ClusterFunctions";
import HeatMap from "./HeatMap.vue";
import GraphTab from "./GraphTab.vue";
import TimeSeriesCard from "./TimeSeriesCard.vue";
import FileTagList from "@/components/clustering/FileTagList.vue";
import PairsTable from "../PairsTable.vue";

interface Props {
  cluster: Cluster;
}
const props = withDefaults(defineProps<Props>(), {});

const activeTab = shallowRef(0);
const { clusterFiles, clusterPairs } = useCluster(toRef(props, "cluster"));

// If the timeline should be shown.
// Timeline will only be shown if every cluster element has a timestamp.
const showClusterTimeline = computed(() => {
  return getClusterElementsArray(props.cluster).every(
    (e) => e.extra?.timestamp
  );
});
</script>

<style lang="scss" scoped>

.clustering-card {
  &:before {
    box-shadow: none !important;
  }
}

.clustering-tag-container {
  width: 70%;
  display: flex;
  justify-content: flex-start;
  overflow: hidden;
}
</style>
