<template>
  <v-card v-if="file" class="file-card">
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
        <v-alert border="left" color="blue-grey" dark v-if="file.file.extra && file.file.extra.fullName">
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
    <div >

      <v-tabs v-model="tab" grow>
        <v-tab href="#tab-0">Similarity</v-tab>
        <v-tab href="#tab-1">Longest Fragment</v-tab>
        <v-tab href="#tab-2">Total overlap</v-tab>
        <v-tab href="#tab-3">Semantic Match</v-tab>

      </v-tabs>

      <v-tabs-items v-model="tab">
        <v-tab-item value="tab-0" :key="0">
          <div class="graph-wrapper">
            <PairStatHistogram :numberOfTicks="25"
                               :extraLine="getLineSpot(file, 'similarity')"
                               :pair-field="'similarity'"
                               :scored-files="scoredFiles"
            />
          </div>
        </v-tab-item >
        <v-tab-item value="tab-1" :key="1">
          <div class="graph-wrapper">
            <PairStatHistogram :numberOfTicks="25"
                               :extraLine="getLineSpot(file, 'longestFragment')"
                               :pair-field="'longestFragment'"
                               :scored-files="scoredFiles"
            />
          </div>
        </v-tab-item>
        <v-tab-item value="tab-2" :key="2">
          <div class="graph-wrapper" >
            <PairStatHistogram :numberOfTicks="25"
                               :extraLine="getLineSpot(file, 'totalOverlap')"
                               :pair-field="'totalOverlap'"
                               :scored-files="scoredFiles"
            />
          </div>
        </v-tab-item>
        <v-tab-item value="tab-3" :key="3">
          <div v-if="dataLoaded" style="width: 100%">
            <SummaryVisualisation
              :file="file" />
          </div>
        </v-tab-item>
      </v-tabs-items>
    </div>
  </v-card>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { File } from "@/api/api";
import DataView from "@/views/DataView";
import FileSimilarityHistogram from "./FileSimilarityHistogram.vue";
import FileCardScore from "./FileCardScore.vue";
import PairStatHistogram from "./PairStatHistogram.vue";
import { FileScoring, getLargestFieldOfScore, getLargestPairOfScore } from "@/util/FileInterestingness";
import SummaryVisualisation from "@/components/summary/SummaryVisualisation.vue";

@Component({ components: { SummaryVisualisation, FileSimilarityHistogram, FileCardScore, PairStatHistogram } })
export default class FileCard extends DataView {
  @Prop() file!: FileScoring;
  @Prop({ required: true }) scoredFiles!: FileScoring[];
  tab = "";

  created(): void {
    this.setBestTab();
  }

  getTimestampText(file: File): string {
    return file.extra.timestamp?.toLocaleString() || "unknown";
  }

  getLargestFieldOfScore = getLargestFieldOfScore

  getLineSpot(file: FileScoring, score = "totalOverlap"): number {
    const largestField = getLargestFieldOfScore(file);

    const pair = largestField === "similarity"
      ? file.similarityScore?.pair
      : (largestField === "totalOverlap" ? file.totalOverlapScore?.pair : file.longestFragmentScore?.pair);

    if (score === "totalOverlap") {
      const covered = file.file.id === pair?.leftFile.id ? pair.leftCovered : pair?.rightCovered;
      return (covered || 0) / file.file.amountOfKgrams;
    }

    if (score === "longestFragment") { return (pair?.longestFragment || 0) / file.file.amountOfKgrams; }

    if (score === "similarity") { return pair?.similarity || 0; }

    return 0;
  }

  @Watch("dataLoaded")
  @Watch("file")
  setBestTab(): void {
    const tabOrder = ["similarity", "longestFragment", "totalOverlap", "semanticMatching"];
    const largestField = getLargestFieldOfScore(this.file);

    this.tab = `tab-${tabOrder.indexOf(largestField)}`;
  }
}
</script>

<style scoped>
.graph-wrapper {
  padding: 10px;
  margin-top: 20px;
}
.score-container {
  padding: 10px;
  padding-top: 0px;
}
.reason-container {
  padding: 20px;
}

.file-card {
  width: 60%;
}
</style>
