<template>
  <v-card v-if="file">
    <v-card-title>
      {{ file.file.path.split("/").slice(-2).join("/") }}
    </v-card-title>
    <div class="d-flex">
      <!-- Main part of the card -->
      <div class="half-size" v-if="dataLoaded">
        <SimilarityHistogram :numberOfTicks="30" :extraLine="file.similarityScore.similarity" />
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
        <FileCardScore :file="file" />
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
import SimilarityHistogram from "./SimilarityHistogram.vue";
import { FileScoring } from "@/util/FileInterestingness";

@Component({ components: { FileSimilarityHistogram, FileCardScore, SimilarityHistogram } })
export default class FileCard extends DataView {
  @Prop() file!: FileScoring;

  getTimestampText(file: File): string {
    return file.extra.timestamp?.toLocaleString() || "unknown";
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
