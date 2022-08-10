<template>
  <v-container fluid>
    <div class="hero">
      <h2 class="hero-title">
        DOLOS
      </h2>
      <div class="hero-subtitle text--secondary">
        Source code plagiarism detection
      </div>
    </div>

    <v-row>
      <v-col cols="12" md="6" lg="4" class="info-cards">
        <v-card class="info-card">
          <v-card-title>Dataset</v-card-title>
          <v-card-subtitle class="pb-0">Information about the loaded dataset</v-card-subtitle>

          <v-list class="info-list" dense>
            <v-list-item class="info-list-item">
              <v-icon>mdi-file-outline</v-icon>
              <strong>Files:</strong>
              <span>{{ filesCount }}</span>
            </v-list-item>

            <v-list-item class="info-list-item">
              <v-icon>mdi-tag-outline</v-icon>
              <strong>Label groups:</strong>
              <span>{{ legendCount }}</span>
            </v-list-item>

            <v-list-item class="info-list-item">
              <v-icon>mdi-xml</v-icon>
              <strong>Programming Language:</strong>
              <span>{{ metadataStore.metadata.language }}</span>
            </v-list-item>
          </v-list>

          <v-card-actions class="info-card-actions">
            <v-spacer />

            <v-btn color="primary" text to="/fileanalysis">
              View Files
              <v-icon right>mdi-chevron-right</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-card class="info-card">
          <v-card-title>Dolos</v-card-title>
          <v-card-subtitle class="pb-0">Information about Dolos</v-card-subtitle>

          <v-list class="info-list" dense>
            <v-list-item class="info-list-item">
              <v-icon>mdi-tag-outline</v-icon>
              <strong>Version:</strong>
              <span>v{{ version }}</span>
            </v-list-item>
          </v-list>

          <v-card-actions class="info-card-actions">
            <v-spacer />

            <v-btn color="primary" text href="https://dolos.ugent.be" target="_blank">
              Documentation
              <v-icon right>mdi-open-in-new</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" lg="3" class="stat-cards">
        <v-card class="stat-card">
          <div class="stat-card-icon primary">
            <v-icon color="white" x-large>mdi-select-compare</v-icon>
          </div>

          <div class="stat-card-content">
            <h3 class="stat-card-title">
              Similarity Cut-off
              <v-tooltip top>
                <template v-slot:activator="{ attrs, on }">
                  <v-icon v-bind="attrs" v-on="on">mdi-information</v-icon>
                </template>

                <span class="tooltip">
                  Dolos uses the 'similarity cutoff value' to group different
                  files into groups or clusters. It is likely that the files in
                  a cluster have a common source or are plagiarized from each
                  other. Though Dolos tries to interpolate a good default value,
                  you can tweak this value using the slider on the right, or on
                  the clustering page.
                </span>
              </v-tooltip>
            </h3>
            <div class="stat-card-value">{{ averageSimilarity }}%</div>
            <div class="stat-card-subtitle text--secondary">Average similarity</div>
          </div>
        </v-card>

        <v-card class="stat-card">
          <div class="stat-card-icon primary">
            <v-icon color="white" x-large>mdi-chart-bell-curve</v-icon>
          </div>

          <div class="stat-card-content">
            <h3 class="stat-card-title">
              Highest similarity
              <v-tooltip top>
                <template v-slot:activator="{ attrs, on }">
                  <v-icon v-bind="attrs" v-on="on">mdi-information</v-icon>
                </template>

                <span class="tooltip">
                  Pair of files most similar to eachother.
                </span>
              </v-tooltip>
            </h3>
            <div class="stat-card-value">{{ (highestSimilarity * 100).toFixed(0) }}%</div>
            <RouterLink
              :to="`/compare/${highestSimilarityPair?.id}`"
              class="stat-card-subtitle text--secondary"
            >
              View pair
            </RouterLink>
          </div>
        </v-card>

        <v-card class="stat-card">
          <div class="stat-card-icon primary">
            <v-icon color="white" x-large>mdi-account-group-outline</v-icon>
          </div>

          <div class="stat-card-content">
            <h3 class="stat-card-title">
              Clusters
            </h3>
            <div class="stat-card-value">{{ clustering.length }}</div>
            <div class="stat-card-subtitle text--secondary">Largest cluster: {{ largestCluster }} files</div>
          </div>
        </v-card>
      </v-col>

      <!-- Similarity distribution -->
      <v-col cols="12" lg="5">
        <v-card class="graph-card">
          <v-row justify="space-between" align="center" no-wrap no-gutters>
            <v-col cols="auto">
              <v-card-title>
                Similarity Distribution &nbsp;
                <v-tooltip top>
                  <template v-slot:activator="{ attrs, on }">
                    <v-icon v-bind="attrs" v-on="on">mdi-information</v-icon>
                  </template>

                  <span class="tooltip">
                    This plot shows the distribution of the similarity for this
                    dataset. This distribution looks different for every
                    dataset, and shows you which degrees of similarity may be
                    interesting to look at. You can also use it to tweak the
                    interpolated cluster cutoff value.
                  </span>
                </v-tooltip>
              </v-card-title>
            </v-col>

            <v-col cols="auto">
              <SimilaritySetting class="px-4 pt-4" />
            </v-col>
          </v-row>

          <OverviewBarchart
            :number-of-ticks="10"
            :extra-line="apiStore.cutoff"
          />
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-card>
          <div class="d-flex flex-column flex-md-row flex-no-wrap justify-center">
            <div class="ma-4 d-flex align-center justify-center">
              <v-img
                src="../assets/soco-java-graph.png"
                :max-width="270"
                contain
              />
            </div>
            <div>
              <v-card-title> Cluster Analysis </v-card-title>
              <v-card-text class="info-text">
                <p>
                  When there is a lot of plagiarism in your dataset (such as
                  during a regular exercise) you may want to look for larger
                  groups of students who share their solutions. This allows you
                  to intervene if the groups become too big, by finding the
                  person who shares the solutions with the rest of the group.
                </p>
                <p>
                  The clustering page of Dolos visualizes the graph, to give you
                  general information about the different groups in the dataset.
                  The groups are determined by the similarity cutoff value,
                  which we automatically determine when the cluster is loaded
                  in. You can see the results of tweaking this value on the
                  clustering page.
                </p>
                <p>
                  Once you've found an interesting group of exercises, you can
                  click on them and press the 'More information' button. This
                  gives you further details on the cluster you picked, including
                  a timeline of the files which may allow you to discover the
                  source of plagiarism in the cluster.
                </p>
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn color="primary" depressed to="/graph">
                  Go to graph view
                  <v-icon right>mdi-chevron-right</v-icon>
                </v-btn>
              </v-card-actions>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-card>
          <div class="d-flex flex-column flex-md-row flex-no-wrap justify-start">
            <div class="ma-4 d-flex align-center justify-center">
              <v-img
                src="../assets/file-comparison.png"
                :max-width="270"
                contain
              />
            </div>
            <div>
              <v-card-title> File Analysis </v-card-title>
              <v-card-text class="info-text">
                <p>
                  In certain situations you want to be certain there is no
                  plagiarism in your dataset. This is often the case on
                  evaluations or exams, where each student needs to work
                  entirely independently of each other. In this case, you need
                  to be able to examine the most suspicious pairs in detail.
                </p>
                <p>
                  Dolos' file analysis page uses different metrics to examine
                  the different files, and return the most interesting file
                  pairs to examine. You can use this indication to look at the
                  files in further detail using the compare view.
                </p>
                <p>
                  If you want to look at the exhaustive list of pairs, you can
                  use the pair view. This allows you to see all comparisons
                  Dolos made without extra filters.
                </p>
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn color="primary" text to="/pairs">
                  Go to pair view
                  <v-icon right>mdi-chevron-right</v-icon>
                </v-btn>
                <v-btn color="primary" depressed to="/fileanalysis">
                  Go to file analysis
                  <v-icon right>mdi-chevron-right</v-icon>
                </v-btn>
              </v-card-actions>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useBreakpoints, useClustering } from "@/composables";
import { Pair } from "@/api/models";
import {
  useApiStore,
  useFileStore,
  usePairStore,
  useMetadataStore,
} from "@/api/stores";
import { getClusterElements } from "@/util/clustering-algorithms/ClusterFunctions";
import OverviewBarchart from "@/components/overview/OverviewBarchart.vue";
import SimilaritySetting from "@/components/settings/SimilaritySetting.vue";
import packageJson from "../../package.json";

const breakpoints = useBreakpoints();
const apiStore = useApiStore();
const fileStore = useFileStore();
const pairStore = usePairStore();
const metadataStore = useMetadataStore();
const { legend } = storeToRefs(fileStore);

// File legend.
const legendCount = computed(() => Object.keys(legend.value).length);

// Amount of files.
const filesCount = computed(() => Object.keys(fileStore.files).length);

// Highest similarity pair.
const highestSimilarityPair = computed<Pair | null>(() => {
  const pairs = Object.values(pairStore.pairs);
  return pairs.reduce(
    (a: Pair | null, b: Pair) =>
      (a?.similarity ?? 0) > b.similarity ? a : b,
    null
  );
});

// Highest similarity.
const highestSimilarity = computed(() => {
  const pair = highestSimilarityPair.value;
  return pair?.similarity ?? 0;
});

// Average similarity.
const averageSimilarity = computed(() => {
  const divident = pairStore.pairsList.reduce(
    (a, b) => a + b.similarity,
    0
  );
  const divisor = Object.keys(pairStore.pairs).length;

  return (divident / divisor * 100).toFixed(0);
});

// Clustering.
const clustering = useClustering();

// Largest cluster
const largestCluster = computed(() =>
  clustering.value.reduce(
    (a, b) =>
      a > getClusterElements(b).size ? a : getClusterElements(b).size,
    0
  )
);

// Current version of the application.
const version = computed(() => packageJson.version);
</script>

<style lang="scss" scoped>
.hero {
  padding-bottom: 1rem;

  &-title {
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
    width: 110px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px !important;
  }

  &-title {
    font-size: 1rem;
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

  &-actions {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
  }
}

.info-list {
  &-item {
    display: flex;
    gap: 0.5rem;
    width: 100%;
  }
}

.graph-card {
  height: 100%;
}

.tooltip {
  max-width: 600px;
  display: inline-block;
}

.tooltip-bearer {
  text-decoration: underline;
  text-decoration-style: dotted;
}

.label-text {
  text-align: right;
  padding: 5px 15px;
  width: 100%;
  display: block;
}
</style>
