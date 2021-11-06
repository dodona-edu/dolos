<template>
  <v-card v-if="file">
    <v-card-title>
      {{ file.path.split("/").slice(-2).join("/") }}
    </v-card-title>
    <div class="d-flex">
      <!-- Main part of the card -->
      <div class="half-size" v-if="dataLoaded">
        <FileSimilarityHistogram :file="file" />
      </div>
      <!-- Aside with extra info -->
      <div>
        <v-alert border="left" color="blue-grey" dark>
          <span>Author: {{ file.extra.fullName }}</span>
          <br />
          <span>Handin Date: {{ getTimestampText(file) }}</span>
          <br />
          <span v-if="file.extra.labels">Labels: {{ file.extra.labels }}</span>
        </v-alert>
      </div>
    </div>
    <h5>Largest overlap:</h5>
    <span v-if="getLargestOverlapPair(file)">
      The file
      {{
        getLargestOverlapPair(file).leftFile.path.split("/").slice(-2).join("/")
      }}
      has a total overlap of
      <b>{{ getLargestOverlapPair(file).totalOverlap }}</b> tokens with this
      file.
    </span>
    <h5>Biggest similarity:</h5>
    <span v-if="getBiggestSimilarity(file)">
      The file
      {{
        getBiggestSimilarity(file).leftFile.path.split("/").slice(-2).join("/")
      }}
      has a total similarity of
      <b>{{ (getBiggestSimilarity(file).similarity * 100).toFixed(2) }}%</b>
      with this file.
    </span>
    <h5>Largest overlap:</h5>
    <span v-if="getLargestFragment(file)">
      The file
      {{
        getLargestFragment(file).leftFile.path.split("/").slice(-2).join("/")
      }}
      has a largest common fragment of
      <b>{{ getLargestFragment(file).longestFragment }}</b> tokens with this
      file.
    </span>
  </v-card>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { File, Pair } from "@/api/api";
import { pairsAsNestedMapCached } from "@/util/PairAsNestedMap";
import DataView from "@/views/DataView";
import FileSimilarityHistogram from "./FileSimilarityHistogram.vue";

@Component({ components: { FileSimilarityHistogram } })
export default class FileCard extends DataView {
  @Prop() file!: File;
  getTimestampText(file: File): string {
    return file.extra.timestamp?.toLocaleString() || "unknown";
  }

  getLargestOverlapPair(file: File): Pair | null {
    if (!this.dataLoaded) return null;

    const pairMap = pairsAsNestedMapCached(() => Object.values(this.pairs)).get(
      file.id
    );

    if (!pairMap) return null;

    return Array.from(pairMap.values()).reduce((p, p2) =>
      p.totalOverlap > p2.totalOverlap ? p : p2
    );
  }

  getBiggestSimilarity(file: File): Pair | null {
    if (!this.dataLoaded) return null;

    const pairMap = pairsAsNestedMapCached(() => Object.values(this.pairs)).get(
      file.id
    );

    if (!pairMap) return null;

    return Array.from(pairMap.values()).reduce((p, p2) =>
      p.similarity > p2.similarity ? p : p2
    );
  }

  getLargestFragment(file: File): Pair | null {
    if (!this.dataLoaded) return null;

    const pairMap = pairsAsNestedMapCached(() => Object.values(this.pairs)).get(
      file.id
    );

    if (!pairMap) return null;

    return Array.from(pairMap.values()).reduce((p, p2) =>
      p.longestFragment > p2.longestFragment ? p : p2
    );
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
</style>
