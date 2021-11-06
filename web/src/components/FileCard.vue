<template>
  <v-card v-if="file">
    <v-card-title>
      {{ file.file.path.split("/").slice(-2).join("/") }}
    </v-card-title>
    <div class="d-flex">
      <!-- Main part of the card -->
      <div class="half-size" v-if="dataLoaded">
        <FileSimilarityHistogram :file="file.file" />
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
    <div>
      <!-- Similarity -->
      <div class="score-container">
        <div class="similarity-score-container">
          <h5>
            Biggest similarity:
            {{
              getOtherFile(file.similarityScore.pair)
                .path.split("/")
                .slice(-2)
                .join("/")
            }}
          </h5>
          <span>
            The similarity of these files is
            <b>{{ convertToPercentageString(file.similarityScore.score) }}%</b>.
            <router-link :to="getPairLink(file.similarityScore.pair)">
              <a>Compare these pairs</a>
            </router-link>
          </span>
        </div>
        <div class="largest-overlap-score-container">
          <h5>
            Total overlap:
            {{
              getOtherFile(file.totalOverlapScore.pair)
                .path.split("/")
                .slice(-2)
                .join("/")
            }}
          </h5>
          <span>
            These files have
            <b>{{ file.totalOverlapScore.totalOverlapTokens }}</b> tokens in
            common. That is
            <b>
              {{
                convertToPercentageString(
                  file.totalOverlapScore.totalOverlapWrtSize
                )
              }}%</b
            >
            of this file's total size.
            <router-link :to="getPairLink(file.totalOverlapScore.pair)">
              <a>Compare these pairs</a>
            </router-link>
          </span>
        </div>
                <div class="longest-fragment-score-container">
          <h5>
            Longest Fragment:
            {{
              getOtherFile(file.longestFragmentScore.pair)
                .path.split("/")
                .slice(-2)
                .join("/")
            }}
          </h5>
          <span>
            These files have
            <b>{{ file.longestFragmentScore.longestFragmentTokens }}</b> tokens in
            common. That is
            <b>
              {{
                convertToPercentageString(
                  file.longestFragmentScore.longestFragmentWrtSize
                )
              }}%</b
            >
            of this file's total size.
            <router-link :to="getPairLink(file.longestFragmentScore.pair)">
              <a>Compare these pairs</a>
            </router-link>
          </span>
        </div>

      </div>
    </div>
  </v-card>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { File, Pair } from "@/api/api";
import DataView from "@/views/DataView";
import FileSimilarityHistogram from "./FileSimilarityHistogram.vue";
import { FileScoring } from "@/util/FileInterestingness";

@Component({ components: { FileSimilarityHistogram } })
export default class FileCard extends DataView {
  @Prop() file!: FileScoring;

  getTimestampText(file: File): string {
    return file.extra.timestamp?.toLocaleString() || "unknown";
  }

  getOtherFile(pair: Pair): File {
    return pair.leftFile.id === this.file.file.id
      ? pair.rightFile
      : pair.leftFile;
  }

  getPairLink(pair: Pair): string {
    return `/compare/${pair.id}`;
  }

  convertToPercentageString(number: number): string {
    return (number * 100).toFixed(2);
  }
}
</script>

<style scoped>
.v-card {
  width: 60%;
  min-width: 650px;
}

.half-size {
  width: 70%;
}
.score-container {
  padding: 20px;
}
</style>
