<template>
  <div class="d-flex justify-center" v-if="files">
    <v-card class="center-card">
      <v-card-text class="center-card-element title d-flex align-center">
        <h4>Similarity of files</h4>
        <SimilarityHistogram class="full-width" />
      </v-card-text>
    </v-card>
  </div>
</template>
<script lang="ts">
import { Component } from "vue-property-decorator";
import SimilarityHistogram from "./SimilarityHistogram.vue";

import DataView from "@/views/DataView";

@Component({ components: { SimilarityHistogram } })
export default class HistogramCard extends DataView {}
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
