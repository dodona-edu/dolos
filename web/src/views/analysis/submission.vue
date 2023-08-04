<template>
  <div>
    <transition name="slide-y-transition" mode="out-in">
      <div v-if="file" :key="file.id">
        <breadcrumbs
          :current-text="file.extra.fullName ?? file.shortPath"
          :previous-fallback-text="`View by submission`"
          :previous-fallback-to="{ name: 'Submissions' }"
        />

        <div class="heading">
          <h2 class="heading-title">
            Submission by {{ file.extra.fullName ?? file.shortPath }}
          </h2>
          <div class="heading-subtitle text-medium-emphasis">
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

              <v-card-text v-else-if="!hasTimestamps">
                <div class="d-flex align-center info-text">
                  <v-icon color="info">mdi-information</v-icon>

                  <span class="ml-2">
                    The dataset you analyzed did not contain timestamps, so some
                    visualizations will not be available. Learn how to add
                    metadata
                    <a
                      href="https://dolos.ugent.be/guide/dodona.html"
                      target="_blank"
                      >here</a
                    >.
                  </span>
                </div>
              </v-card-text>

              <v-card-text v-else>
                <cluster-time-series
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
                  <label-text
                    :label="label.name"
                    :color="label.color"
                    colored
                  />
                </div>

                <div class="info-item">
                  <v-icon>mdi-file-document-outline</v-icon>
                  <span>{{ file.shortPath }}</span>
                </div>

                <div class="info-item" v-if="hasTimestamps">
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
                <div class="submission-graph">
                  <graph-canvas
                    :pairs="clusterPairs"
                    :files="clusterFiles"
                    :legend="legend"
                    :clustering="clustering"
                    :selected-node="file"
                    :node-size="8"
                    :show-singletons="false"
                    node-tooltip
                    node-clickable
                    @click:node="onNodeClick"
                  >
                    <graph-legend v-model:legend="legend" readonly />
                  </graph-canvas>
                </div>
              </v-card-text>
            </v-card>

            <v-card class="mt-4">
              <v-card-title>Similarity histogram</v-card-title>
              <v-card-subtitle>
                Highest similarity of this submission (red) compared to the
                highest similarity of other submissions.
              </v-card-subtitle>
              <v-card-text>
                <submission-histogram field="similarity" :file="file" />
              </v-card-text>
            </v-card>

            <v-card class="mt-4">
              <v-card-title>Longest fragment histogram</v-card-title>
              <v-card-subtitle>
                Longest fragment of this submission (red) compared to the
                longest fragment of other submissions.
              </v-card-subtitle>
              <v-card-text>
                <submission-histogram field="longestFragment" :file="file" />
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
              <v-card-text>This file was not found.</v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { File } from "@/api/models";
import { useFileStore, usePairStore } from "@/api/stores";
import { useCluster } from "@/composables";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const fileId = computed(() => route.params?.fileId);

const router = useRouter();
const fileStore = useFileStore();
const pairStore = usePairStore();
const { legend, hasTimestamps, hasLabels, filesById } = storeToRefs(fileStore);
const { clustering } = storeToRefs(pairStore);

// Get the file by id.
const file = computed(() => filesById.value[+fileId.value]);

// Get the label of the file.
const label = computed(() => file.value.label);

// Get the cluster of the file.
const cluster = computed(() => pairStore.getCluster(file.value));

// Cluster
const { clusterPairs, clusterFiles } = useCluster(cluster);
// Go to the submission when a node is clicked.
const onNodeClick = (file: File): void => {
  router.push({ name: "Submissions", params: { fileId: String(file.id) } });
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

  &-graph {
    height: 350px;
  }
}
</style>
