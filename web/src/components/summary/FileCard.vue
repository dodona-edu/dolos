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
      </v-tabs>

      <v-tabs-items v-model="tab">
        <v-tab-item value="tab-0" :key="0">
          <div class="graph-wrapper">
            <PairStatHistogram :numberOfTicks="25"
                               :extraLine="getLineSpot(file, 'similarity')"
                               :pair-field="'similarity'"
                               :scored-files="fileScorings"
            />
            <div class="more-info">
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon v-bind="attrs" v-on="on">
                    mdi-information
                  </v-icon>
                </template>
                <span class="tooltip-span">
                    This tab of the card shows a bar chart of all the pairs in this dataset. The similarity value
                  of the pair of files this card is about is marked by a line intersecting a bar with a red color.
                  This should help you see whether or not this pair of files is exceptionally similar or not.<br/>

                  The similarity metric is a global size-independent metric, and often used as the main metric to
                  measure how alike two files are.
                 </span>
              </v-tooltip>
            </div>
          </div>
        </v-tab-item >
        <v-tab-item value="tab-1" :key="1">
          <div class="graph-wrapper">
            <PairStatHistogram :numberOfTicks="25"
                               :extraLine="getLineSpot(file, 'longestFragment')"
                               :pair-field="'longestFragment'"
                               :scored-files="fileScorings"
            />
          </div>
          <div class="more-info">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-icon v-bind="attrs" v-on="on">
                  mdi-information
                </v-icon>
              </template>
              <span class="tooltip-span">
                This tab of the card shows a bar chart of all the pairs in this dataset. The longest fragment value
                  of the pair of files this card is about is marked by a line intersecting a bar with a red color.
                  This should help you see whether or not this pair of files is exceptionally similar or not.<br/>

                  The longest consecutive fragment is a local size-independent metric, and roughly correlates to the
                longest amount of lines in one block that are the same in both files. If this is very high, then it's
                likely (part of) these files was literally copied.

                 </span>
            </v-tooltip>
          </div>
          <div class="more-info">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-icon v-bind="attrs" v-on="on">
                  mdi-information
                </v-icon>
              </template>
              <span class="tooltip-span">
                This tab of the card shows a bar chart of all the pairs in this dataset. The longest fragment value
                  of the pair of files this card is about is marked by a line intersecting a bar with a red color.
                  This should help you see whether or not this pair of files is exceptionally similar or not.<br/>

                  The longest consecutive fragment is a local size-independent metric, and roughly correlates to the
                longest amount of lines in one block that are the same in both files. If this is very high, then it's
                likely (part of) these files was literally copied.

                 </span>
            </v-tooltip>
          </div>
        </v-tab-item>
        <v-tab-item value="tab-2" :key="2">
          <div class="graph-wrapper" >
            <PairStatHistogram :numberOfTicks="25"
                               :extraLine="getLineSpot(file, 'totalOverlap')"
                               :pair-field="'totalOverlap'"
                               :scored-files="fileScorings"
            />
          </div>
          <div class="more-info">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-icon v-bind="attrs" v-on="on">
                  mdi-information
                </v-icon>
              </template>
              <span class="tooltip-span">
                This tab of the card shows a bar chart of all the pairs in this dataset. The total overlap value
                  of the pair of files this card is about is marked by a line intersecting a bar with a red color.
                  This should help you see whether or not this pair of files is exceptionally similar or not. <br/>

                  The total overlap is a global size-dependent metric of equality in the files. It roughly counts
                how many lines of both files are similiar.
                 </span>
            </v-tooltip>
          </div>
          <div class="more-info">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-icon v-bind="attrs" v-on="on">
                  mdi-information
                </v-icon>
              </template>
              <span class="tooltip-span">
                This tab of the card shows a bar chart of all the pairs in this dataset. The total overlap value
                  of the pair of files this card is about is marked by a line intersecting a bar with a red color.
                  This should help you see whether or not this pair of files is exceptionally similar or not. <br/>

                  The total overlap is a global size-dependent metric of equality in the files. It roughly counts
                how many lines of both files are similiar.
                 </span>
            </v-tooltip>
          </div>
        </v-tab-item>
      </v-tabs-items>
    </div>
  </v-card>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { File } from "@/api/models";
import DataView from "@/views/DataView";
import FileSimilarityHistogram from "./FileSimilarityHistogram.vue";
import FileCardScore from "./FileCardScore.vue";
import PairStatHistogram from "./PairStatHistogram.vue";
import { FileScoring, getLargestFieldOfScore } from "@/util/FileInterestingness";

@Component({ components: { FileSimilarityHistogram, FileCardScore, PairStatHistogram } })
export default class FileCard extends DataView {
  @Prop() file!: FileScoring;
  @Prop() selectedValue!: number | null;
  @Prop({ required: true }) fileScorings!: FileScoring[];
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
    const tabOrder = ["similarity", "longestFragment", "totalOverlap"];
    const largestField = getLargestFieldOfScore(this.file);

    this.tab = `tab-${tabOrder.indexOf(largestField)}`;
  }

  @Watch("selectedValue")
  setThisTab(): void {
    if (this.selectedValue === null) { return this.setBestTab(); }

    this.tab = `tab-${this.selectedValue}`;
  }
}
</script>

<style scoped>
.graph-wrapper {
  padding: 10px;
  margin-top: 20px;
  max-height: 500px;
}
.score-container {
  padding: 10px;
  padding-top: 0px;
}
.reason-container {
  padding: 20px;
}

.more-info {
  position: absolute;
  right: 30px;
  top: 0;
}

.tooltip-span {
  display: block;
  max-width: 400px;
}

</style>
