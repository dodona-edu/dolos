<template>
  <div class="submissions">
    <template v-if="cluster">
      <breadcrumbs
        :current-text="`Cluster ${clusterId}`"
        :current-to="{ name: 'Cluster', params: { clusterId: clusterId } }"
        :previous-fallback-text="`View by cluster`"
        :previous-fallback-to="{ name: 'Clusters' }"
      />

      <div class="heading">
        <h2 class="heading-title">Cluster {{ clusterId }}</h2>
        <div class="heading-subtitle text-medium-emphasis">
          Relevant information about the current cluster.
        </div>
      </div>

      <v-row>
        <v-col cols="12" md="8">
          <v-card>
            <v-tabs v-model="activeTab" color="primary">
              <v-tab>Submissions</v-tab>
              <v-tab>Pairs</v-tab>
            </v-tabs>

            <v-window v-model="activeTab" class="mt-2">
              <v-window-item>
                <submissions-table
                  :files="clusterFiles"
                  :items-per-page="15"
                  pagination
                  dense
                  order
                />
              </v-window-item>

              <v-window-item>
                <pairs-table :pairs="clusterPairs" :items-per-page="15" />
              </v-window-item>
            </v-window>
          </v-card>

          <v-card class="mt-4">
            <v-card-title>Cluster Timeline</v-card-title>
            <v-card-subtitle class="pb-2">
              Visual representation of which submission was submitted first.
            </v-card-subtitle>

            <v-card-text v-if="!hasTimestamps">
              <div class="d-flex align-center info-text">
                <v-icon color="info">mdi-information</v-icon>

                <span class="ml-2">
                  The dataset you analyzed did not contain timestamps, so some
                  visualizations will not be available. Learn how to add
                  metadata
                  <a
                    href="https://dolos.ugent.be/guide/dodona.html"
                    target="_blank"
                  >
                    here </a
                  >.
                </span>
              </div>
            </v-card-text>

            <v-card-text v-else>
              <cluster-time-series
                :cluster="cluster"
                :node-size="8"
                node-tooltip
                node-clickable
                @click:node="onNodeClick"
              />
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>Cluster Graph</v-card-title>
            <v-card-subtitle>
              Visual representation of submissions in the same cluster.
            </v-card-subtitle>
            <v-card-text class="cluster-graph">
              <graph-canvas
                :pairs="clusterPairs"
                :files="clusterFiles"
                :legend="legend"
                :clustering="clustering"
                :node-size="8"
                :show-singletons="false"
                node-tooltip
                node-clickable
                @click:node="onNodeClick"
              >
                <graph-legend v-model:legend="legend" readonly />
              </graph-canvas>
            </v-card-text>
          </v-card>

          <v-card v-if="showHeatmap" class="mt-4">
            <v-card-title>Cluster Heatmap</v-card-title>
            <v-card-subtitle>
              Visualization of the pairs within this cluster, darker is more
              similar.
            </v-card-subtitle>
            <v-card-text>
              <cluster-heat-map :cluster="cluster" :height="500" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <template v-else>
      <v-row>
        <v-col>
          <v-card>
            <v-card-title>Not found</v-card-title>
            <v-card-text>This cluster was not found.</v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { useFileStore, usePairStore } from "@/api/stores";
import { File } from "@/api/models";
import { useCluster, usePartialLegend } from "@/composables";
import { storeToRefs } from "pinia";
import { computed, shallowRef } from "vue";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();
const clusterId = computed(() => route.params?.clusterId);

const fileStore = useFileStore();
const pairStore = usePairStore();
const cluster = computed(() => pairStore.getClusterById(+clusterId.value));
const { hasTimestamps } = storeToRefs(fileStore);
const { clustering } = storeToRefs(pairStore);
const { clusterFiles, clusterPairs } = useCluster(cluster);
const legend = usePartialLegend(clusterFiles);

const activeTab = shallowRef(0);

// Go to the submission when a node is clicked.
const onNodeClick = (file: File): void => {
  router.push({ name: "Submission", params: { fileId: file.id } });
};

// Should the heatmap be shown.
// The heatmap is hidden when the submissions in the cluster are below 4 and bigger than 30.
const showHeatmap = computed(() => {
  const length = clusterFiles.value.length;
  return length >= 4 && length <= 20;
});
</script>

<style lang="scss" scoped>
.cluster {
  &-graph {
    height: 350px;
  }
}
</style>
