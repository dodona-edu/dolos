<template>
  <v-expansion-panel class="clustering-card" ref="element">
    <v-expansion-panel-header>
      <FileTagList :current-files="clusterFiles" />
    </v-expansion-panel-header>

    <v-expansion-panel-content>
      <v-tabs v-model="activeTab">
        <v-tab>
          Pair View
        </v-tab>

        <v-tab v-show="cluster && showClusterTimeline">
          Timeseries
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
          <PairsTable v-if="showPairs" :pairs="clusterPairs" :items-per-page="10" />
        </v-tab-item>

        <v-tab-item v-show="cluster && showClusterTimeline">
          <TimeSeriesCard v-if="showTimeseries" :cluster="cluster" />
        </v-tab-item>

        <v-tab-item>
          <HeatMap v-if="showHeatmap" :cluster="props.cluster" />
        </v-tab-item>

        <v-tab-item>
          <GraphTab v-if="showGraph" :cluster="props.cluster" />
        </v-tab-item>
      </v-tabs-items>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script lang="ts" setup>
import { shallowRef, computed, toRef, watch, ref, onMounted } from "vue";
import { useCluster, useVuetify } from "@/composables";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { getClusterElementsArray } from "@/util/clustering-algorithms/ClusterFunctions";

interface Props {
  cluster: Cluster;
  active?: boolean;
}
const props = withDefaults(defineProps<Props>(), {});
const vuetify = useVuetify();

const activeTab = shallowRef(0);
const element = ref();
const { clusterFiles, clusterPairs } = useCluster(toRef(props, "cluster"));

// If the timeline should be shown.
// Timeline will only be shown if every cluster element has a timestamp.
const showClusterTimeline = computed(() => {
  return getClusterElementsArray(props.cluster).every(
    (e) => e.extra?.timestamp
  );
});

// If the tabs should be shown.
// This is for lazy loading the tabs.
const showPairs = shallowRef(false);
const showTimeseries = shallowRef(false);
const showHeatmap = shallowRef(false);
const showGraph = shallowRef(false);
// When the correct tab is selected, show the correct view.
watch(
  () => activeTab.value,
  () => {
    if (activeTab.value === 0) showPairs.value = true;
    if (activeTab.value === 1) showTimeseries.value = true;
    if (activeTab.value === 2) showHeatmap.value = true;
    if (activeTab.value === 3) showGraph.value = true;
  },
  { immediate: true }
);

// Scroll to the element when it becomes active.
watch(
  () => props.active,
  () => {
    vuetify.goTo(element.value);
  },
);

// Go to the element when it is active on mounted.
onMounted(() => {
  if (props.active) {
    vuetify.goTo(element.value);
  }
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
