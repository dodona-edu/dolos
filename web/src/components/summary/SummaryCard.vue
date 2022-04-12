<template>
  <div class="d-flex justify-center" :set="similarityPair = getHighestSimilarityPair()">
    <v-card class="center-card" :set="highestOverlapPair = getHighestOverlapPair()">
      <v-card-text class="center-card-element title">
        <h1>DOLOS</h1>
        <span>Source code plagiarism detection</span>
        <p>We analyzed {{ getNumberOfFiles() }} files for plagiarism.</p>
        <p  >
          The <a :href="`#/compare/${(similarityPair || {}).id}`">highest similarity we found</a> is
          {{ (similarityOfPair(similarityPair).toFixed(2) * 100 ) }}% and
          <a :href="`#/compare/${(highestOverlapPair || {}).id}`">the longest common
          part</a> is {{ highestOverlapOfPair(highestOverlapPair) }} tokens long.
        </p>
        <small>
          You can find more details on these files in the list below, or you can
          explore the pair list and investigate the graph view.
        </small>
      </v-card-text>
      <v-card-actions class="d-flex justify-space-around flex-wrap halfspan">
        <router-link to="/"
          ><v-btn color="success"> Pair View </v-btn></router-link
        >
        <router-link to="/graph"
          ><v-btn color="success"> Graph View </v-btn></router-link
        >
        <v-btn color="success"> Cluster View </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { Pair } from "@/api/api";

import DataView from "@/views/DataView";

@Component({})
export default class SummaryCard extends DataView {
  mounted(): void {
    super.ensureData();
  }

  getNumberOfFiles(): number {
    return Object.keys(this.files || {}).length;
  }

  getHighestSimilarityPair(): Pair {
    const pairs = Object.values(this.pairs || {});
    return pairs.reduce(
      (a, b) => ((a?.similarity || 0) > b.similarity ? a : b),
      null
    );
  }

  getHighestOverlapPair(): Pair {
    const pairs = Object.values(this.pairs || {});

    return pairs.reduce(
      (a, b) => ((a?.longestFragment || 0) > b.longestFragment ? a : b),
      null
    );
  }

  similarityOfPair(p: Pair | null): number {
    return p?.similarity || 0;
  }

  highestOverlapOfPair(p: Pair | null): number {
    return p?.longestFragment || 0;
  }
}
</script>

<style scoped>
.center-card {
  max-width: 600px;
  min-width: 60%;
  margin-top: 40px;
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
}

.center-card-element span {
  color: #6e8eaf;
  margin-bottom: 20px;
}

.halfspan {
  width: 60%;
  min-width: 192px;
}

.title h1 {
  margin-bottom: 0.6rem;
}
</style>
