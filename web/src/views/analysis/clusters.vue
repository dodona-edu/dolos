<template>
  <div class="submissions">
    <v-row class="heading" align="center">
      <v-col cols="12" md="6">
        <h2 class="heading-title">
          Clusters
        </h2>
        <div class="heading-subtitle text-medium-emphasis">
          All clusters, formed by the similarity threshold.
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <clusters-table class="clusters-table" :clusters="sortedClustering" />
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts" setup>
import { usePairStore } from "@/api/stores";
import { storeToRefs } from "pinia";

const pairStore = usePairStore();
const { sortedClustering } = storeToRefs(pairStore);
</script>

<style lang="scss" scoped>
.clusters {
  &-table {
    max-height: max(500px, calc(100vh - 180px));
  }
}
</style>
