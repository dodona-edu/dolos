<template>
  <div class="d-flex justify-center">
    <v-card class="center-card">
      <v-card-text class="center-card-element title">
        <h1>DOLOS</h1>
        <span>Source code plagiarism detection</span>
      </v-card-text>
      <v-card-text>
        <p>We analyzed {{ getNumberOfFiles() }} files for plagiarism.</p>
        <p>
          The highest similarity we found is
          {{ getHighestSimilarity().toFixed(2) * 100 }}% and the longest common
          part is {{ getHighestOverlap() }} tokens long.
        </p>
        <small>
          You can find more details on these files in the list below, or you can
          explore the pair list and investigate the graph view.
        </small>
      </v-card-text>
      <v-card-actions class="d-flex justify-space-around flex-wrap halfspan">
        <router-link to="/"
          ><v-btn color="success"> Pair View </v-btn></router-link
        >
        <router-link to="/graph"
          ><v-btn color="success"> Graph View </v-btn></router-link
        >
        <v-btn color="success"> Cluster View </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import DataView from "@/views/DataView";

@Component({})
export default class SummaryCard extends DataView {
  mounted(): void {
    super.ensureData();
  }
}
</script>

<style scoped>
.center-card {
  max-width: 600px;
  min-width: 60%;
  margin: 20px;
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

.center-card-element span {
  color: #6e8eaf;
}

.halfspan {
  width: 60%;
  min-width: 192px;
}

.title h1 {
  margin-bottom: 0.6rem;
}

.title {
  margin-bottom: 1.8rem;
}
</style>
