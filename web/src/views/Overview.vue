<template>
<div class="d-flex flex-row flex-wrap justify-space-around">
  <v-card class="main-card center-card">
    <v-card-text class="center-card-element title">
      <h1>DOLOS</h1>
      <span class="subtitle">Source code plagiarism detection</span>
      <p>We analyzed <b>{{ getNumberOfFiles() }}</b> files for plagiarism, using
        the programming language <b>{{ metadata["language"] }}</b>. There are <b>{{Object.keys(legend).length}}
        </b>different label groups.</p>

      <p :set="similarityPair = getHighestSimilarityPair()">
        The average similarity of this dataset is <b>{{averageSimilarity()}}%</b>, the pair with the highest similarity
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
  </v-card>
  <v-card class="second-card">
    <v-card-title>Similarity Distribution</v-card-title>
    <OverviewBarchart :number-of-ticks="10"></OverviewBarchart>
  </v-card>
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

  getLargestCluster():number {
    return this.clustering.reduce((a, b) => a > getClusterElements(b).size ? a : getClusterElements(b).size, 0);
  }
}
</script>

<style scoped>
.main-card {
  min-width: 50%;
  margin-top: 40px;
}

.second-card {
  min-width: 35%;
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
  justify-content: center;
  flex-direction: column;
  align-items: center;
  text-align: center;
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
</style>
