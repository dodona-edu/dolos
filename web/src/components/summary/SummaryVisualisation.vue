<template>
  <div style="width: 100%">
    <PairStatHistogram
      class="half-size"
      v-if="showBarChart()"
      :number-of-ticks="25"
      :pair-field="getLargestFieldOfScore(file)"
      :extra-line="getLineSpot(file)"></PairStatHistogram>

    <div v-if="!showBarChart() && this.currentFiles !== null" class="compare-containers">
      <div class="side-container">
        <h3 class="fileTitle">{{currentFiles.leftFile.path}}</h3>
        <CompareSide
          :identifier="'left'"
          :file="currentFiles.leftFile"
          :language="'python'"
          :selections="[]"
          :hovering-selections="[]"
          :active-selections="[]"
          :selected-selections="[]"
          :semantic-matches="[]"
          :start-row="getMatchSpan(currentFiles.leftFile, match.leftMatch).startRow"
          :end-row="getMatchSpan(currentFiles.leftFile, match.leftMatch).endRow"
        />

      </div>

      <div class="side-container">
        <h3 class="fileTitle">{{currentFiles.rightFile.path}}</h3>
        <CompareSide
        :identifier="'right'"
        :file="currentFiles.rightFile"
        :language="'python'"
        :selections="[]"
        :hovering-selections="[]"
        :active-selections="[]"
        :selected-selections="[]"
        :semantic-matches="[]"
        :start-row="getMatchSpan(currentFiles.rightFile, match.rightMatch).startRow"
        :end-row="getMatchSpan(currentFiles.rightFile, match.rightMatch).endRow"
      />
      </div>
    </div>
  </div>

</template>
<script lang="ts">
import { Component, Watch, Prop } from "vue-property-decorator";
import PairStatHistogram from "@/components/summary/PairStatHistogram.vue";
import { FileScoring, getLargestFieldOfScore } from "@/util/FileInterestingness";
import CompareSide from "../CompareSide.vue";
import { Region, PairedNodeStats, SemanticAnalyzer, NodeStats } from "@dodona/dolos-lib";
import { fileToTokenizedFile, File } from "@/api/api";
import DataView from "@/views/DataView";

@Component({
  components: { PairStatHistogram, CompareSide }
})
export default class SummaryVisualisation extends DataView {
  @Prop({ required: true }) file!: FileScoring;
  private match?: PairedNodeStats;
  private currentFiles: { leftFile: File; rightFile: File } | null = null;

  constructor() {
    super();
    this.init();
  }

  async init(): Promise<void> {
    await this.ensureData();
    this.getPairedMatch();
  }

  getLineSpot(file: FileScoring): number {
    const score = getLargestFieldOfScore(file);

    if (score === "totalOverlap") { return file.totalOverlapScore?.totalOverlapWrtSize || 0; }

    if (score === "longestFragment") { return file.longestFragmentScore?.longestFragmentWrtSize || 0; }

    if (score === "similarity") { return file.similarityScore?.similarity || 0; }

    return 0;
  }

  getLargestFieldOfScore = getLargestFieldOfScore;

  showBarChart(): boolean {
    return getLargestFieldOfScore(this.file) !== "semanticMatching";
  }

  getMatchSpan(file: File, match: NodeStats): Region {
    const tokenized = fileToTokenizedFile(file);
    return SemanticAnalyzer.getFullRange(
      tokenized, match
    );
  }

  @Watch("file")
  getPairedMatch(): void {
    const node = this.file.semanticMatchScore;

    if (node) {
      this.match =
        node.pair.pairedMatches.reduce((a, b) => a.leftMatch.childrenTotal > b.leftMatch.childrenTotal ? a : b);
      this.currentFiles = {
        leftFile: node.pair.leftFile,
        rightFile: node.pair.rightFile
      };
    }
  }
}
</script>
<style>
.compare-containers {
  display: flex;
  font-size: 0.875rem;
  height: 100%;
}
.half-size {
  width: 80%;
  margin: 15px;
}

.side-container {
  width: 50%;
  height: 100%;
}

.fileTitle {
  text-align: center;
}
</style>
