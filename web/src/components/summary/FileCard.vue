<template>
  <v-card v-if="file">
    <v-card-title>
      {{ file.file.path.split("/").slice(-2).join("/") }}
    </v-card-title>
    <div class="d-flex justify-space-between reason-container">
      <!-- Main part of the card -->
      <!-- Similarity -->
      <div class="score-container">
        <FileCardScore :file="file" />
      </div>

      <!-- Aside with extra info -->
      <div>
        <v-alert border="left" color="blue-grey" dark>
          <span>Author: {{ file.file.extra.fullName }}</span>
          <br />
          <span>Handin Date: {{ getTimestampText(file.file) }}</span>
          <br />
          <span v-if="file.file.extra.labels"
            >Labels: {{ file.file.extra.labels }}</span
          >
        </v-alert>
      </div>
    </div>
    <div class="d-flex justify-center align-center">

      <div class="half-size" v-if="dataLoaded">
        <PairStatHistogram :numberOfTicks="25"
                           :extraLine="getLineSpot(file)"
                           :pair-field="getLargestFieldOfScore(file)" />
      </div>
    </div>
  </v-card>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { File } from "@/api/api";
import DataView from "@/views/DataView";
import FileSimilarityHistogram from "./FileSimilarityHistogram.vue";
import FileCardScore from "./FileCardScore.vue";
import PairStatHistogram from "./PairStatHistogram.vue";
import { FileScoring, getLargestFieldOfScore, getLargestPairOfScore } from "@/util/FileInterestingness";

@Component({ components: { FileSimilarityHistogram, FileCardScore, PairStatHistogram } })
export default class FileCard extends DataView {
  @Prop() file!: FileScoring;

  getTimestampText(file: File): string {
    return file.extra.timestamp?.toLocaleString() || "unknown";
  }

  getLargestFieldOfScore = getLargestFieldOfScore

  getLineSpot(file: FileScoring): number {
    const score = getLargestFieldOfScore(file);

    if (score === "totalOverlap") { return file.totalOverlapScore?.totalOverlapWrtSize || 0; }

    if (score === "longestFragment") { return file.longestFragmentScore?.longestFragmentWrtSize || 0; }

    if (score === "similarity") { return file.similarityScore?.similarity || 0; }

    return 0;
  }
}
</script>

<style scoped>
.v-card {
  width: 60%;
  min-width: 650px;
}

.half-size {
  width: 80%;
  margin: 15px;
}
.score-container {
  padding: 10px;
  padding-top: 0px;
}
.reason-container {
  padding: 20px;
}
</style>
