<template>
  <div>
    <SurveyAlert></SurveyAlert>
    <div class="hero">
      <h2 v-if="reportName" class="hero-title">
        {{ reportName }}
      </h2>
      <h2 v-else class="hero-title">Dolos</h2>
      <div class="hero-subtitle text-medium-emphasis">
        Source code plagiarism detection report
      </div>
    </div>

    <v-row>
      <v-col cols="12" md="6" lg="3" class="info-cards">
        <v-card class="info-card">
          <v-card-title class="pb-0">Report info</v-card-title>

          <v-list class="info-list" density="compact">

            <v-list-item v-if="createdAt">
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-icon v-bind="props" start>mdi-clock-outline</v-icon>
                  <span>
                    {{ DateTime.fromISO(createdAt).toLocaleString(DateTime.DATETIME_FULL) }}
                  </span>
                </template>
                <span>Report creation date</span>
              </v-tooltip>
            </v-list-item>

            <v-list-item>
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-icon v-bind="props" start>mdi-file-outline</v-icon>
                  <span>{{ filesCount }} submissions</span>
                </template>
                <span>Total count of analyzed submissions</span>
              </v-tooltip>
            </v-list-item>

            <v-list-item>
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-icon v-bind="props" start>mdi-xml</v-icon>
                  <span>{{ language }}</span>
                </template>
                <span>Programming language</span>
              </v-tooltip>
            </v-list-item>
          </v-list>

          <v-card-title class="info-card-subtitle pt-0 pb-0">
            {{ hasLabels ? legendCount : "No" }} labels detected
          </v-card-title>

          <div class="info-card-labels">
            <labels-table show-submissions />
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" lg="3" class="stat-cards">
        <v-card class="stat-card">
          <div class="stat-card-icon">
            <div class="stat-card-icon-background"></div>
            <v-icon color="primary" size="48">mdi-chart-bell-curve</v-icon>
          </div>

          <div class="stat-card-content">
            <h3 class="stat-card-title">
              Highest similarity

              <info-dot>
                The highest similarity we've found between two submissions is
                {{ (highestSimilarity * 100).toFixed(0) }}%
              </info-dot>
            </h3>
            <div class="stat-card-value">
              <similarity-display :similarity="highestSimilarity" text />
            </div>
            <router-link
              class="stat-card-subtitle text-medium-emphasis"
              :to="{ name: 'Submissions' }"
            >
              View submissions
            </router-link>
          </div>
        </v-card>

        <v-card class="stat-card">
          <div class="stat-card-icon">
            <div class="stat-card-icon-background"></div>
            <v-icon color="primary" size="64">mdi-approximately-equal</v-icon>
          </div>

          <div class="stat-card-content">
            <h3 class="stat-card-title">
              Average similarity

              <info-dot>
                Average of the highest similarity for each submission.
              </info-dot>
            </h3>
            <div class="stat-card-value">
              <similarity-display :similarity="averageSimilarity" text />
            </div>
            <div class="stat-card-subtitle text-medium-emphasis">
              Median similarity: {{ (medianSimilarity * 100).toFixed(0) }}%
            </div>
          </div>
        </v-card>

        <v-card class="stat-card">
          <div class="stat-card-icon">
            <div class="stat-card-icon-background"></div>
            <v-icon color="primary" size="48">mdi-account-group-outline</v-icon>
          </div>

          <div class="stat-card-content">
            <h3 class="stat-card-title">
              Clusters

              <info-dot>
                Submissions are grouped into clusters based on their similarity.
                If a submission pair has a similarity above the threshold, they
                will belong to the same cluster.
              </info-dot>
            </h3>
            <div class="stat-card-value">{{ clustering.length }}</div>
            <div class="stat-card-subtitle text-medium-emphasis">
              Based on the current threshold ({{
                (apiStore.cutoff * 100).toFixed(0)
              }}%)
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Similarity distribution -->
      <v-col cols="12" lg="6">
        <v-card class="graph-card">
          <v-row justify="space-between" align="center" no-wrap no-gutters>
            <v-col cols="auto">
              <v-card-title>
                Similarity distribution

                <info-dot>
                  This plot shows the distribution of the similarity for the
                  analysed submissions. This distribution looks different for
                  every dataset, and shows you which degrees of similarity may
                  be interesting to look at. You can also use it to tweak the
                  interpolated cluster cutoff value.
                </info-dot>
              </v-card-title>
            </v-col>

            <v-col cols="auto">
              <similarity-setting class="px-4 pt-4" />
            </v-col>
          </v-row>

          <v-card-text>
            <similarity-histogram
              field="similarity"
              :ticks="20"
              :calculate-bin-color="calculateBinColor"
              :line-value="apiStore.cutoff"
              line-text="Threshold"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Submissions</v-card-title>
          <v-card-subtitle>
            Highlights the most suspicious individual submissions, useful for
            exams.
          </v-card-subtitle>

          <submissions-table
            :files="submissionsOverview"
            :limit="10"
            concise
            disable-sorting
          />

          <v-card-actions>
            <v-spacer />
            <v-btn color="primary" variant="text" block :to="{ name: 'Submissions' }">
              <span v-if="filesCount > 1">
                View all {{ filesCount }} submissions
              </span>
              <span v-else>View all submissions</span>
              <v-icon end>mdi-chevron-right</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Clusters</v-card-title>
          <v-card-subtitle>
            Aggregates submissions in groups, useful for exercises.
          </v-card-subtitle>

          <clusters-table
            :clusters="clustersOverview"
            :limit="10"
            :pagination="false"
            concise
            disable-sorting
          />

          <v-card-actions>
            <v-spacer />
            <v-btn color="primary" variant="text" block :to="{ name: 'Clusters' }">
              <span v-if="clustersCount > 1">
                View all {{ clustersCount }} clusters
              </span>
              <span v-else>View all clusters</span>
              <v-icon end>mdi-chevron-right</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { Pair } from "@/api/models";
import { DateTime } from "luxon";
import {
  useApiStore,
  useFileStore,
  usePairStore,
  useMetadataStore,
} from "@/api/stores";

const apiStore = useApiStore();
const fileStore = useFileStore();
const pairStore = usePairStore();
const metadataStore = useMetadataStore();
const { labels, similaritiesList, hasLabels } = storeToRefs(fileStore);
const { clustering, sortedClustering } = storeToRefs(pairStore);

const reportName = computed(() => metadataStore.metadata?.reportName);
const createdAt = computed(() => metadataStore.metadata?.createdAt);

// File legend.
const legendCount = computed(() => labels.value.length);

// Amount of files.
const filesCount = computed(() => fileStore.filesActiveList.length);

// Highest similarity pair.
const highestSimilarityPair = computed<Pair | null>(() => {
  const pairs = Object.values(pairStore.pairsActive as Pair[]);
  return pairs.reduce(
    (a: Pair | null, b: Pair) => ((a?.similarity ?? 0) > b.similarity ? a : b),
    null
  );
});

// Highest similarity.
const highestSimilarity = computed(() => {
  const pair = highestSimilarityPair.value;
  return pair?.similarity ?? 0;
});

// Similarities map for every file
// Contains the max similarity for each file.
const similarities = computed(() =>
  similaritiesList.value.map((f) => f?.similarity || 0)
);

// Average maximum similarity.
const averageSimilarity = computed(() => {
  const mean = similarities.value.reduce((a, b) => a + b, 0) / similarities.value.length;
  return isNaN(mean) ? 0 : mean;
});

// Median maximum similarity.
const medianSimilarity = computed(() => {
  const sorted = [...similarities.value].sort();
  const middle = Math.floor(sorted.length / 2);
  const median = sorted[middle];
  return isNaN(median) ? 0 : median;
});

// Programming language, capitalized.
const language = computed(() => {
  const lang = metadataStore.metadata.language;
  return lang?.charAt(0)?.toUpperCase() + lang?.slice(1);
});

// First x amount of submissions to display.
// Sorted by highest similarity
const submissionsOverview = computed(() => {
  return fileStore.filesActiveList;
});

// First x amount of clusters to display.
const clustersOverview = computed(() => {
  return sortedClustering.value;
});

// Total amount of clusters
const clustersCount = computed(() => sortedClustering.value.length);

// Calculate the bin color for the histogram.
const calculateBinColor = (x0: number, x1: number): string => {
  // If the x1 coordinate is below the threshold return an greyed out color.
  // x1 represents the end value of the bin.
  return x1 <= apiStore.cutoff ? "rgba(25, 118, 210, 0.25)" : "#1976D2";
};

</script>

<style lang="scss" scoped>
.hero {
  padding-bottom: 1rem;

  &-title {
    text-transform: capitalize;
    font-size: 2.5rem;
  }

  &-subtitle {
    font-size: 1.25rem;
  }
}

.stat-cards {
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  gap: 1rem;
}

.stat-card {
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-grow: 1;

  &-icon {
    height: 110px;
    min-height: 110px;
    width: 110px;
    min-width: 110px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px !important;
    position: relative;
    overflow: hidden;
    z-index: 1;

    &:before {
      content: " ";
      position: absolute;
      z-index: 1;
      width: 100%;
      height: 100%;
      inset: 0;
      z-index: -1;
      background-color: rgb(var(--v-theme-primary));
      opacity: 0.15;
    }
  }

  &-title {
    font-size: 1.25rem;
    font-weight: 500;
  }

  &-value {
    font-size: 2.25rem;
    font-weight: 700;
  }
}

.info-cards {
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  gap: 1rem;
}

.info-card {
  display: flex;
  flex-direction: column;
  flex-grow: 1;

  &-subtitle {
    font-size: 1rem;
    font-weight: 500;
  }

  &-actions {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
  }
}

.graph-card {
  height: 100%;
}

.label-text {
  text-align: right;
  padding: 5px 15px;
  width: 100%;
  display: block;
}
</style>
