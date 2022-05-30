<template>
  <div class="main-container d-flex flex-column">
    <div class="d-flex flex-row flex-wrap justify-space-between">
      <v-card class="main-card center-card" :loading="!dataLoaded">
        <v-card-text class="center-card-element title"
                     :class="{invisible: !dataLoaded }">
          <h1>DOLOS</h1>
          <span class="subtitle">Source code plagiarism detection</span>
          <p>We analyzed <b>{{ getNumberOfFiles() }}</b> files for plagiarism, using
            the programming language <b>{{ metadata["language"] }}</b>. There are <b>{{Object.keys(legend).length}}
            </b>different label groups.</p>

          <p :set="similarityPair = getHighestSimilarityPair()">
            The average similarity of this dataset is <b>{{averageSimilarity()}}%</b>,
            the pair with the highest similarity
          of <b>{{((similarityPair || {}).similarity * 100).toFixed(0)}}%</b>
            can be found <a :href="`#/compare/${(similarityPair || {}).id}`">here</a>.
          </p>

          <p>Using the
            <v-tooltip top >
            <template v-slot:activator="{ attrs, on }">
              <span
                v-bind="attrs"
                v-on="on"
              class="tooltip-bearer">
                similarity cutoff value</span>
            </template>
            <span class="tooltip">
              Dolos uses the 'similarity cutoff value' to group different files into groups or clusters.
              It is likely that the files in a cluster have a common source or are plagiarized from each other.
              Though Dolos tries to interpolate a good default value, you can tweak this value using the slider on
              the right, or on the clustering page.
            </span>
          </v-tooltip> of {{(cutoff * 100).toFixed()}}%
            we found <b>{{clustering.length}}</b> different clusters,
            of which the biggest consists of <b>{{getLargestCluster()}}</b> files.
          </p>
        </v-card-text>

        <div class="progress-container" v-if="!dataLoaded">
          <v-progress-circular indeterminate ></v-progress-circular>
        </div>
      </v-card>
      <v-card class="second-card" :loading="!dataLoaded">
        <div class="d-flex flex-row flex-nowrap justify-space-between">
          <v-card-title>Similarity Distribution &nbsp;
            <v-tooltip top>
              <template v-slot:activator="{ attrs, on }">
                <v-icon
                  v-bind="attrs" v-on="on">
                  mdi-information
                </v-icon>
              </template>

              <span class="tooltip">
            This plot shows the distribution of the similarity for this dataset. This distribution looks different
            for every dataset, and shows you which degrees of similarity may be interesting to look at. You can also
            use it to tweak the interpolated cluster cutoff value.
            </span>
            </v-tooltip>
          </v-card-title>
        <div>
          <label>
            <span class="label-text">Similarity ≥ {{ cutoff.toFixed(2) }}<br /></span>

            <input
              type="range"
              min="0.25"
              max="1"
              step="0.01"
              v-model="cutoff"
            />
          </label>
        </div>
        </div>

        <OverviewBarchart :number-of-ticks="10" :extra-line="cutoff" :class="{invisible: !dataLoaded }">

        </OverviewBarchart>
        <div class="progress-container" v-if="!dataLoaded">
          <v-progress-circular indeterminate ></v-progress-circular>
        </div>

      </v-card>
  </div>
    <div>
    <v-card>
      <div class="d-flex flex-no-wrap justify-start">
      <v-avatar
        size="270"
        tile
      >
        <v-img src="https://dolos.ugent.be/images/soco-java-graph.png"></v-img>
      </v-avatar>
        <div>
          <v-card-title>
            Cluster Analysis
          </v-card-title>
          <v-card-text class="info-text">
            <p>
              When there is a lot of plagiarism in your dataset (such as during a regular exercise) you may want to
              look for larger groups of students who share their solutions. This allows you to intervene if the groups
              become too big, by finding the person who shares the solutions with the rest of the group.
            </p>
            <p>
              The clustering page of Dolos visualizes the graph, to give you general information about the different
              groups in the dataset. The groups are determined by the similarity cutoff value, which we automatically
              determine when the cluster is loaded in. You can see the results of tweaking this value on the clustering
              page.
            </p>
            <p>
              Once you've found an interesting group of exercises, you can click on them and press the
              'More information' button. This gives you further details on the cluster you picked, including
              a timeline of the files which
              may allow you to discover the source of plagiarism in the cluster.
            </p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="success" @click="toGraphView"> Go to graph view</v-btn>
          </v-card-actions>
        </div>
      </div>
    </v-card>
    </div>

    <div>
      <v-card>
        <div class="d-flex flex-no-wrap justify-start">
            <v-img contain max-width="270" src="../assets/file-comparison.png"></v-img>
          <div>
            <v-card-title>
              File Analysis
            </v-card-title>
            <v-card-text class="info-text">
              <p>
                In certain situations you want to be certain there is no plagiarism in your dataset. This is often the
                case on evaluations or exams, where each student needs to work entirely independently of each other.
                In this case, you need to be able to examine the most suspicious pairs in detail.
              </p>
              <p>
                Dolos' file analysis page uses different metrics to examine the different files, and return the most
                interesting file pairs to examine. You can use this indication to look at the files in further detail
                using the compare view.
              </p>
              <p>
                If you want to look at the exhaustive list of pairs, you can use the pair view. This allows you
                to see all comparisons Dolos made without extra filters.
              </p>

            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="success" @click="toPairView"> Go to pair view</v-btn>
              <v-btn color="success" @click="toFileAnalysisView"> Go to file analysis</v-btn>

            </v-card-actions>
          </div>
        </div>
      </v-card>
    </div>

  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import DataView, { Legend } from "@/views/DataView";
import { Pair } from "@/api/api";
import OverviewBarchart from "@/components/overview/OverviewBarchart.vue";
import { getClusterElements } from "@/util/clustering-algorithms/ClusterFunctions";

@Component({
  components: { OverviewBarchart }
})
export default class Overview extends DataView {
  private legend: Legend = {};
  private defaultCutoff = 0;

  async mounted(
  ): Promise<void> {
    await this.ensureData();
    this.legend = this.createLegend();
    this.defaultCutoff = this.cutoff;
  }

  getNumberOfFiles(): number {
    return Object.keys(this.files || {}).length;
  }

  averageSimilarity(): string {
    return (Object.values(this.pairs || {}).reduce((a, b) => a + b.similarity, 0) /
      Object.keys(this.pairs).length * 100).toFixed(0);
  }

  getHighestSimilarityPair(): Pair {
    const pairs = Object.values(this.pairs || {});
    return pairs.reduce(
      (a, b) => ((a?.similarity || 0) > b.similarity ? a : b),
      null
    );
  }

  getLargestCluster(): number {
    return this.clustering.reduce((a, b) => a > getClusterElements(b).size ? a : getClusterElements(b).size, 0);
  }

  toGraphView(): void {
    this.navigateTo("/graph/");
  }

  toPairView(): void {
    this.navigateTo("/pairs/");
  }

  toFileAnalysisView(): void {
    this.navigateTo("/fileanalysis/");
  }

  navigateTo(route: string): void {
    if (this.$router.currentRoute.path !== route) {
      this.$router.push(route);
    }
  }
}
</script>

<style scoped>
.main-card {
  min-width: 58%;
  margin-top: 40px;
}

.second-card {
  min-width: 40%;
  margin-top: 40px;
}

.center-card {
  max-width: 600px;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 25px;
}

.center-card-element {
  display: flex;
  justify-content: space-around;
  flex-direction: column;
  align-items: center;
  text-align: center;
  height: 100%;
}

.subtitle {
  color: #6e8eaf;
  margin-bottom: 20px;
}

.tooltip {
  max-width: 600px;
  display: inline-block;
}

.tooltip-bearer {
  text-decoration: underline;
  text-decoration-style: dotted;
}

.main-container {
  width: 85%;
}

.main-container>div {
  margin-bottom: 30px;
}

.info-text {
  font-family: "Roboto",sans-serif;
  font-weight: 400;
  font-size: 0.95rem;
}
.label-text {
  text-align: right;
  padding: 5px 15px;
  width: 100%;
  display: block;
}
label {
  margin: 5px 5px 0 0
;
}
.progress-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
}
.invisible {
  visibility: hidden;
}
</style>
