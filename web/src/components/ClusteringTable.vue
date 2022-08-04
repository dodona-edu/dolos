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
        :id="`clustering-card-${index}`"
      />
    </v-expansion-panels>
  </v-card>
</template>

<script lang="ts" setup>
import { shallowRef, computed, watch } from "vue";
import { useVuetify, useRoute } from "@/composables";
import { Clustering, Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { SortingFunction } from "@/util/Types";
import { getClusterElements } from "@/util/clustering-algorithms/ClusterFunctions";
import ClusteringCard from "@/components/clustering/ClusteringCard.vue";
import SimilaritySetting from "@/components/settings/SimilaritySetting.vue";

interface Props {
  currentClustering: Clustering;
}

const props = withDefaults(defineProps<Props>(), {});
const vuetify = useVuetify();
const route = useRoute();

// Active expansion panel.
const panel = shallowRef(-1);

// Clustering sorted on cluster size.
const sortedClustering = computed(() => {
  const sortFn: SortingFunction<Cluster> = (a, b) =>
    getClusterElements(b).size - getClusterElements(a).size;

  return [...props.currentClustering].sort(sortFn);
});

// Watch for changes in the route when showing more info for a cluster.
watch(() => route.value.hash, (hash) => {
  const hashNum = /[0-9]+/.exec(hash)?.[0];
  if (hash.startsWith("#clustering-card") && hashNum) {
    // Expand the correct panel.
    panel.value = +hashNum;

    // Scroll to the cluster card.
    vuetify.goTo(hash);
  }
});
</script>

<style scoped>
.title-slider {
  font-weight: 400;
  font-size: 1rem;
}
</style>
