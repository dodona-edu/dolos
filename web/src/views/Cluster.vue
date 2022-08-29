<template>
  <v-container class="submissions" fluid>
    <template v-if="cluster">
      <breadcrumbs
        :current-override="{ name: `Cluster ${clusterId}` }"
        :previous-fallback="{ name: 'View by clusters', path: '/clusters' }"
      />

      <div class="heading">
        <h2 class="heading-title">
          Cluster {{ clusterId }}
        </h2>
        <div class="heading-subtitle text--secondary">
          Relevant information about the current cluster.
        </div>
      </div>

      <v-row>
        <v-col cols="12" md="8">
          <v-card>
            <v-tabs v-model="activeTab">
              <v-tab>Submissions</v-tab>
              <v-tab>Pairs</v-tab>
            </v-tabs>

            <v-tabs-items v-model="activeTab" class="mt-2">
              <v-tab-item>
                <submissions-table :files="clusterFiles" :items-per-page="15" dense pagination order />
              </v-tab-item>

              <v-tab-item>
                <pairs-table :pairs="clusterPairs" :items-per-page="15" dense />
              </v-tab-item>
            </v-tabs-items>
          </v-card>

          <v-card class="mt-4">
            <v-card-title>Cluster Timeline</v-card-title>
            <v-card-subtitle class="pb-2">
              Visual representation of which submission was submitted first.
            </v-card-subtitle>

            <v-card-text v-if="!hasTimestamp">
              <div class="d-flex align-center info-text">
                <v-icon color="info">mdi-information</v-icon>

                <span class="ml-2">
                  The dataset you analyzed did not contain timestamps,
                  so some visualizations will not be available.
                  Learn how to add metadata
                  <a href="https://dolos.ugent.be/guide/dodona.html" target="_blank">here</a>.
                </span>
              </div>
            </v-card-text>

            <v-card-text v-else>
              <time-series 
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
            <v-card-text>
              <graph
                :pairs="clusterPairs"
                :files="clusterFiles"
                :legend="legend"
                :clustering="clustering"
                :height="350"
                :node-size="8"
                node-tooltip
                node-clickable
                @click:node="onNodeClick"
              >
                <graph-legend
                  :legend.sync="legend"
                />
              </graph>
            </v-card-text>
          </v-card>
          
          <v-card class="mt-4">
            <v-card-title>Cluster Heatmap</v-card-title>
            <v-card-subtitle>
              This is a description of this card.
            </v-card-subtitle>
            <v-card-text>
              <heat-map
                :cluster="cluster"
                :height="500"
              />
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
            <v-card-subtitle>This cluster was not found.</v-card-subtitle>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script lang="ts" setup>
import { useFileStore, usePairStore } from "@/api/stores";
import { File } from "@/api/models";
import { useCluster, usePartialLegend, useRouter } from "@/composables";
import { storeToRefs } from "pinia";
import { computed, shallowRef } from "vue";

interface Props {
  clusterId: string;
}

const props = withDefaults(defineProps<Props>(), {});
const router = useRouter();
const fileStore = useFileStore();
const pairStore = usePairStore();
const cluster = computed(() => pairStore.getClusterById(+props.clusterId));
const { hasTimestamp } = storeToRefs(fileStore);
const { clustering } = storeToRefs(pairStore);
const { clusterFiles, clusterPairs } = useCluster(cluster);
const legend = usePartialLegend(clusterFiles);

const activeTab = shallowRef(0);

// Go to the submission when a node is clicked.
const onNodeClick = (file: File): void => {
  router.push(`/submissions/${file.id}`);
};
</script>