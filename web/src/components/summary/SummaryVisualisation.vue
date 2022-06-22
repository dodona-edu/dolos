<template>
  <div style="width: 100%">
    <div v-if=" this.currentFiles !== null" class="compare-containers">
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
          :end-row="getMatchSpan(currentFiles.leftFile, match.leftMatch).endRow + 1"
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
        :end-row="getMatchSpan(currentFiles.rightFile, match.rightMatch).endRow + 1"
      />
      </div>
    </div>
  </div>

</template>
<script lang="ts">
import { Component, Watch, Prop } from "vue-property-decorator";
import PairStatHistogram from "@/components/summary/PairStatHistogram.vue";
import { FileScoring } from "@/util/FileInterestingness";
import CompareSide from "../CompareSide.vue";
import { DecodedSemanticResult, PairedSemanticGroups, Region, SemanticAnalyzer } from "@dodona/dolos-lib";
import { File } from "@/api/models";
import { fileToTokenizedFile } from "@/api/utils";
import DataView from "@/views/DataView";

@Component({
  components: { PairStatHistogram, CompareSide }
})
export default class SummaryVisualisation extends DataView {
  @Prop({ required: true }) file!: FileScoring;
  private match?: PairedSemanticGroups<DecodedSemanticResult>;
  private currentFiles: { leftFile: File; rightFile: File } | null = null;

  constructor() {
    super();
    this.init();
  }

  async init(): Promise<void> {
    await this.ensureData();
    this.getPairedMatch();
  }

  getMatchSpan(file: File, match: DecodedSemanticResult): Region {
    const tokenized = fileToTokenizedFile(file);
    const r = SemanticAnalyzer.getFullRange(
      tokenized, match
    );
    return this.normalizeRegion(r);
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

  /**
   * This function serves to change detected regions so that they are neat in display for the summary cards
   */
  normalizeRegion(region: Region): Region {
    region.endRow = Math.min(region.endRow, region.startRow + 20);

    if (region.endRow === region.startRow) { region.endRow += 1; }

    return region;
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
