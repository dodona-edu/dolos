<template>
<div class="d-flex flex-row flex-wrap justify-space-around">
  <v-card class="main-card center-card">
    <v-card-text class="center-card-element title">
      <h1>DOLOS</h1>
      <span>Source code plagiarism detection</span>
      <p>We analyzed <b>{{ getNumberOfFiles() }}</b> files for plagiarism, using
        the programming language <b>{{ metadata["language"] }}</b>.</p>

      <p :set="similarityPair = getHighestSimilarityPair()">
        The average similarity of this dataset is <b>{{averageSimilarity()}}%</b>, the pair with the highest similarity
      of <b>{{((similarityPair || {}).similarity * 100).toFixed(0)}}%</b>
        can be found <a :href="`#/compare/${(similarityPair || {}).id}`">here</a>.
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
import DataView from "@/views/DataView";
import { Pair } from "@/api/api";
import OverviewBarchart from "@/components/overview/OverviewBarchart.vue";

@Component({
  components: { OverviewBarchart }
})
export default class Overview extends DataView {
  async mounted(
  ): Promise<void> {
    await this.ensureData();
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

.center-card-element span {
  color: #6e8eaf;
  margin-bottom: 20px;
}
</style>
