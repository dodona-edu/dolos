<template>
  <div class="main-container">
    <v-row>
      <!-- Information -->
      <v-col cols="12" lg="7">
        <v-card class="fill-height">
          <v-card-text class="info-card">
            <h1 class="info-card-title">Dolos</h1>
            <span class="info-card-subtitle">
              Source code plagiarism detection
            </span>

            <p>
              We analyzed <b>{{ filesCount }}</b> files for plagiarism, using
              the programming language
              <b>{{ metadataStore.metadata.language }}</b
              >. There are <b>{{ legendCount }} </b>different label groups.
            </p>

            <p v-if="highestSimilarityPair">
              The average similarity of this dataset is
              <b>{{ averageSimilarity }}%</b>, the pair with the highest
              similarity of
              <b>{{ (highestSimilarity * 100).toFixed(0) }}%</b>
              can be found
              <a :href="`#/compare/${highestSimilarityPair.id}`">here</a>.
            </p>

            <p>
              Using the
              <v-tooltip top>
                <template v-slot:activator="{ attrs, on }">
                  <span v-bind="attrs" v-on="on" class="tooltip-bearer">
                    similarity cutoff value</span
                  >
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
              of {{ (apiStore.cutoff * 100).toFixed() }}% we found
              <b>{{ clustering.length }}</b> different clusters, of which the
              biggest consists of <b>{{ largestCluster }}</b> files.
            </p>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Similarity distribution -->
      <v-col cols="12" lg="5">
        <v-card>
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
              <label>
                <span class="label-text">
                  Similarity ≥ {{ apiStore.cutoff.toFixed(2) }}<br />
                </span>

                <input
                  type="range"
                  min="0.25"
                  max="1"
                  step="0.01"
                  v-model.number="apiStore.cutoff"
                />
              </label>
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
          <div class="d-flex flex-column flex-sm-row flex-no-wrap justify-center">
            <div class="ma-4 d-flex align-center justify-center">
              <v-img
                src="../assets/soco-java-graph.png"
                :max-width="breakpoints.desktop ? 270 : '60%'"
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
                <v-btn color="success" depressed to="/graph">
                  Go to graph view
                </v-btn>
              </v-card-actions>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-card>
          <div class="d-flex flex-column flex-sm-row flex-no-wrap justify-start">
            <div class="ma-4 d-flex align-center justify-center">
              <v-img
                src="../assets/file-comparison.png"
                :max-width="breakpoints.desktop ? 270 : '70%'"
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
                <v-spacer></v-spacer>
                <v-btn color="success" depressed to="/pairs">
                  Go to pair view
                </v-btn>
                <v-btn color="success" depressed to="/fileanalysis">
                  Go to file analysis
                </v-btn>
              </v-card-actions>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "@vue/composition-api";
import { useBreakpoints, useLegend, useClustering } from "@/composables";
import { Pair } from "@/api/models";
import {
  useApiStore,
  useFileStore,
  usePairStore,
  useMetadataStore,
} from "@/api/stores";
import { getClusterElements } from "@/util/clustering-algorithms/ClusterFunctions";
import OverviewBarchart from "@/components/overview/OverviewBarchart.vue";

export default defineComponent({
  setup() {
    const breakpoints = useBreakpoints();
    const apiStore = useApiStore();
    const fileStore = useFileStore();
    const pairStore = usePairStore();
    const metadataStore = useMetadataStore();

    // File legend.
    const legend = useLegend();
    const legendCount = computed(() => Object.keys(legend).length);

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
      const divident = Object.values(pairStore.pairs).reduce(
        (a, b) => a + b.similarity,
        0
      );
      const divisor = Object.keys(pairStore.pairs).length * 100;

      return (divident / divisor).toFixed(0);
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

    return {
      breakpoints,
      apiStore,
      metadataStore,
      legend,
      legendCount,
      filesCount,
      highestSimilarityPair,
      highestSimilarity,
      averageSimilarity,
      clustering,
      largestCluster,
    };
  },
  components: {
    OverviewBarchart,
  },
});
</script>

<style lang="scss" scoped>
.main-container {
  margin-top: 1rem;
}

.info-card {
  text-align: center;
  font-size: 1.25rem !important;
  font-weight: 500;
  line-height: 2rem;

  display: flex;
  justify-content: center;
  flex-direction: column;
  height: 100%;

  &-title {
    text-transform: uppercase;
    margin-bottom: 0.5rem;
  }

  &-subtitle {
    color: #6e8eaf;
    margin-bottom: 1rem;
  }
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

.info-text {
  font-weight: 400;
  font-size: 0.95rem;
}
</style>
