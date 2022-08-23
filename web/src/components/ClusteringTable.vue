<template>
  <v-card>
    <v-card-title>
      Clusters
      <v-spacer />
      <v-form>
       <SimilaritySetting />
      </v-form>
    </v-card-title>

    <v-expansion-panels v-model="panel" class="elevation-0">
      <ClusteringCard
        v-for="(cluster, index) in sortedClustering"
        :key="index"
        :cluster="cluster"
        :active="index >= 0 && panel === index"
      />
    </v-expansion-panels>
  </v-card>
</template>

<script lang="ts" setup>
import { useRouteQuery } from "@/composables";
import { storeToRefs } from "pinia";
import { usePairStore } from "@/api/stores";
import ClusteringCard from "@/components/clustering/ClusteringCard.vue";
import SimilaritySetting from "@/components/settings/SimilaritySetting.vue";

const { sortedClustering } = storeToRefs(usePairStore());

// Active expansion panel.
const panel = useRouteQuery("cluster", -1, parseInt);
</script>

<style scoped>
.title-slider {
  font-weight: 400;
  font-size: 1rem;
}
</style>
