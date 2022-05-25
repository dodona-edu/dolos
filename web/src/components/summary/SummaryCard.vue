<template>
  <div class="d-flex justify-center" :set="similarityPair = getHighestSimilarityPair()">
    <v-card class="center-card" :set="highestOverlapPair = getHighestOverlapPair()">
      <v-card-text class="center-card-element title">
        <h1>File analysis</h1>
        <div>
          <p class="text">
            This page lists the most relevant pairs of files in your dataset. This is useful in particular when you
            are looking for any plagiarism that may exist. </p><p class="text">

            By default, a mix of different metrics is suggested. You can change the metrics of interest by selecting
            a specific metric from the dropdown box.

            </p><p class="text">
          If you found a pair that looks interesting metric-wise, you can use the compare view to examine the files
          in more detail.
          </p>
        </div>
      </v-card-text>
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

.text {
  color: rgba(0,0,0,0.8);
  font-size: 16px;
  line-height: 24px;
  font-family: "Roboto", sans-serif;
}

.title h1 {
  margin-bottom: 2rem;
}
</style>
