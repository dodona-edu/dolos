<template>
  <v-container fluid>
    <transition name="slide-y-transition" mode="out-in">
      <div v-if="file" :key="file.id">
        <div class="heading">
          <h2 class="heading-title">
            Submission by {{ file.extra.fullName ?? file.shortPath }}
          </h2>
          <div class="heading-subtitle text--secondary">
            Relevant information about the current submission.
          </div>
        </div>

        <v-row>
          <v-col cols="12" md="8">
            <v-card>
              <v-card-title>Compare</v-card-title>
              <v-card-subtitle class="pb-2">
                Compare this submission with other submissions
              </v-card-subtitle>

              <submissions-pairs-table :file="file" />
            </v-card>

            <v-card class="mt-4">
              <v-card-title>Cluster Timeline</v-card-title>
              <v-card-subtitle class="pb-2">
                Visual representation of which submission was submitted first.
              </v-card-subtitle>

              <v-card-text v-if="!cluster">
                Submission is not part of any cluster.
              </v-card-text>

              <v-card-text v-else-if="!hasTimestamp">
                Timestamps are not available in this dataset.
              </v-card-text>

              <v-card-text v-else>
                <time-series
                  :cluster="cluster"
                  :node-size="8"
                  :selected-files="[file]"
                  node-tooltip
                  node-clickable
                  @click:node="onNodeClick"
                />
              </v-card-text>
            </v-card>

            <v-card class="mt-4">
              <v-card-title>Code viewer</v-card-title>
              <v-card-subtitle class="pb-2">
                View the code of this submission.
              </v-card-subtitle>

              <submission-code class="submission-code" :file="file" />
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card>
              <v-card-title>Information</v-card-title>
              <v-card-text>
                <div class="info-item" v-if="hasLabels">
                  <v-icon :color="label.color">mdi-label-outline</v-icon>
                  <label-text :label="label.label" :color="label.color" colored />
                </div>

                <div class="info-item">
                  <v-icon>mdi-file-document-outline</v-icon>
                  <span>{{ file.shortPath }}</span>
                </div>

                <div class="info-item" v-if="hasTimestamp">
                  <v-icon>mdi-clock-outline</v-icon>
                  <file-timestamp :file="file" long />
                </div>
              </v-card-text>
            </v-card>

            <v-card class="mt-4">
              <v-card-title>Cluster Graph</v-card-title>
              <v-card-subtitle>
                Visual representation of submissions in the same cluster.
              </v-card-subtitle>
              <v-card-text v-if="!cluster">
                Submission is not part of any cluster.
              </v-card-text>
              <v-card-text v-else>
                <graph
                  :pairs="clusterPairs"
                  :files="clusterFiles"
                  :legend="legendValue"
                  :clustering="clustering"
                  :height="350"
                  :selected-node="file"
                  :node-size="8"
                  node-tooltip
                  node-clickable
                  @click:node="onNodeClick"
                >
                  <graph-legend
                    :legend.sync="legendValue"
                  />
                </graph>
              </v-card-text>
            </v-card>

            <v-card class="mt-4">
              <v-card-title>Similarity histogram</v-card-title>
              <v-card-subtitle>
                Highest similarity of this submission (red) compared to the highest similarity of other submissions.
              </v-card-subtitle>
              <v-card-text>
                <pair-stat-histogram
                  field="similarity"
                  :file="file"
                  :ticks="25"
                  :height="315"
                />
              </v-card-text>
            </v-card>

            <v-card class="mt-4">
              <v-card-title>Longest fragment histogram</v-card-title>
              <v-card-subtitle>
                Longest fragment of this submission (red) compared to the longest fragment of other submissions.
              </v-card-subtitle>
              <v-card-text>
                <pair-stat-histogram
                  field="longestFragment"
                  :file="file"
                  :ticks="25"
                  :height="315"
                />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <template v-else>
        <v-row>
          <v-col>
            <v-card>
              <v-card-title>Not found</v-card-title>
              <v-card-subtitle>This file was not found.</v-card-subtitle>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </transition>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { File } from "@/api/models";
import { useFileStore, usePairStore } from "@/api/stores";
import { useCluster, useRouter } from "@/composables";
import { storeToRefs } from "pinia";
import LabelText from "@/components/LabelText.vue";
import FileTimestamp from "@/components/FileTimestamp.vue";
import SubmissionsPairsTable from "@/components/SubmissionsPairsTable.vue";
import Graph from "@/components/graph/Graph.vue";
import GraphLegend from "@/d3-tools/GraphLegend.vue";
import TimeSeries from "@/components/clustering/TimeSeries.vue";
import SubmissionCode from "@/components/SubmissionCode.vue";
import PairStatHistogram from "@/components/summary/PairStatHistogram.vue";
import { useLegend } from "../composables";

interface Props {
  fileId: string;
}

const props = withDefaults(defineProps<Props>(), {});
const router = useRouter();
const fileStore = useFileStore();
const pairStore = usePairStore();
const { hasTimestamp, hasLabels } = storeToRefs(fileStore);
const { clustering } = storeToRefs(pairStore);

// Get the file by id.
const file = computed(() => fileStore.getFile(+props.fileId));

// Get the label of the file.
const label = computed(() => fileStore.getLabel(file.value));

// Get the cluster of the file.
const cluster = computed(() => pairStore.getCluster(file.value));

// Cluster
const { clusterPairs, clusterFiles } = useCluster(cluster);

// Legend
const legend = useLegend(clusterFiles);
const legendValue = ref(legend.value);

// Go to the submission when a node is clicked.
const onNodeClick = (file: File): void => {
  router.push(`/submissions/${file.id}`);
};
</script>

<style lang="scss" scoped>
.info {
  &-item {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
}

.submission {
  &-code {
    height: 500px;
  }
}
</style>
