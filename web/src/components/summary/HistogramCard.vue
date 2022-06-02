<template>
  <div class="d-flex justify-center" v-if="files">
    <v-card class="center-card">
      <v-card-text class="center-card-element title d-flex align-center">
        <h4>Similarity of files</h4>
        <SimilarityHistogram class="full-width" :scored-files="fileScoring" />
      </v-card-text>
    </v-card>
  </div>
</template>
<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import PairStatHistogram from "./PairStatHistogram.vue";

import DataView from "@/views/DataView";
import { FileScoring } from "@/util/FileInterestingness";

@Component({ components: { SimilarityHistogram: PairStatHistogram } })
export default class HistogramCard extends DataView {
  @Prop() fileScoring!: FileScoring[];
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

.full-width {
  width: 100%
}
</style>
