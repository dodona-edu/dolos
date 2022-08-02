<template>
  <v-card>
    <v-card-title>
      Clusters
      <v-spacer />
      <form>
        <label>
          <div class="title-slider">Similarity ≥ {{ cutoff.toFixed(2) }}</div>
          <input
            type="range"
            min="0.25"
            max="1"
            step="0.01"
            v-model.number="cutoff"
          />
        </label>
      </form>
    </v-card-title>

    <v-expansion-panels v-model="panel">
      <ClusteringCard
        v-for="(cluster, index) in sortedClustering"
        :key="index"
        :cluster="cluster"
        :id="`clustering-card-${index}`"
      />
    </v-expansion-panels>
  </v-card>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  shallowRef,
  computed,
  watch,
} from "vue";
import { storeToRefs } from "pinia";
import { useVuetify, useRoute } from "@/composables";
import { useApiStore } from "@/api/stores";
import { Clustering, Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { SortingFunction } from "@/util/Types";
import { getClusterElements } from "@/util/clustering-algorithms/ClusterFunctions";
import ClusteringCard from "@/components/clustering/ClusteringCard.vue";

export default defineComponent({
  props: {
    currentClustering: {
      type: Array as PropType<Clustering>,
      required: true,
    },
  },

  setup(props) {
    const vuetify = useVuetify();
    const route = useRoute();
    const { cutoff } = storeToRefs(useApiStore());

    // Active expansion panel.
    const panel = shallowRef(-1);

    // Table headers
    const headers = [
      { text: "Cluster Id", value: "id", sortable: true },
      { text: "Cluster Size", value: "size", sortable: true },
      { text: "Average Similarity", value: "similarity" },
    ];

    // Table footer properties
    const footerProps = {
      itemsPerPageOptions: [15, 25, 50, 100, -1],
      showCurrentPage: true,
      showFirstLastPage: true,
    };

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

    return {
      cutoff,
      panel,
      headers,
      footerProps,
      sortedClustering,
    };
  },

  components: {
    ClusteringCard,
  },
});
</script>

<style scoped>
.title-slider {
  font-weight: 400;
  font-size: 1rem;
}
</style>
