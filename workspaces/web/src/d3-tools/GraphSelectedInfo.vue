<template>
  <div class="selected-info">
    <div v-if="selectedNode">
      <v-card elevation="2" outlined>
        <v-card-title> Selected node </v-card-title>

        <v-card-text>
          The author of this submission is
          <b>{{ selectedNode.extra.fullName || "unknown" }}</b>
          , belonging to group
          <b>{{ selectedNode.extra.labels }}</b>
          . The last hand-in date was
          <b>{{ selectedNodeTimestamp || "not available." }}</b
          >.
        </v-card-text>
      </v-card>
    </div>

    <div v-if="selectedCluster">
      <v-card elevation="2" outlined>
        <v-card-title> Selected cluster </v-card-title>

        <v-card-text>
          You selected a cluster of size
          <b>{{ clusterFilesSet.size }}</b>
          , which has an average similarity of
          <b>{{ clusterAverageSimilarity.toFixed(2) * 100 }}%</b>.
        </v-card-text>

        <v-card-text class="namecontainer">
          These files are present in the cluster:
          <ul>
            <li v-for="el of clusterFilesSet" :key="el.id">
              {{ el.shortPath }}
            </li>
          </ul>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="success" text @click="goToInfo">More information</v-btn>
        </v-card-actions>
      </v-card>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  computed,
  toRef,
} from "vue";
import { useCluster, useVuetify, useRouter } from "@/composables";
import { File } from "@/api/models";
import { Cluster, Clustering } from "@/util/clustering-algorithms/ClusterTypes";
import { DateTime } from "luxon";
import { getClusterElements } from "@/util/clustering-algorithms/ClusterFunctions";

export default defineComponent({
  props: {
    currentClustering: {
      type: Array as PropType<Clustering>,
      required: true,
    },

    selectedNode: {
      type: Object as PropType<File>,
      required: false,
    },

    selectedCluster: {
      type: Set as PropType<Cluster>,
      required: false,
    },
  },

  setup(props) {
    const vuetify = useVuetify();
    const router = useRouter();
    const { clusterFilesSet, clusterAverageSimilarity } =
      useCluster(toRef(props, "selectedCluster"));

    // Timestamp of the selected node.
    const selectedNodeTimestamp = computed(() => {
      if (props.selectedNode?.extra.timestamp) {
        return DateTime.fromJSDate(
          props.selectedNode.extra.timestamp
        ).toLocaleString(DateTime.DATETIME_MED);
      }
      return null;
    });

    // index of the selected cluster.
    const selectedClusterIndex = computed(() => {
      if (!props.selectedCluster) return 0;

      const sortFn = (a: Cluster, b:Cluster): number => getClusterElements(b).size - getClusterElements(a).size;
      const sortedClustering = Array.from(props.currentClustering).sort(sortFn);
      return sortedClustering.indexOf(props.selectedCluster);
    });

    // Go to the information section of this cluster.
    const goToInfo = (): void => {
      const clusterHash = `#clustering-card-${selectedClusterIndex.value}`;
      // Navigate to the cluster card.
      // The hash will be used by the clustering table to expand the correct cluster.
      router.replace("#");
      router.replace(clusterHash);

      // Scroll to the cluster card.
      vuetify.goTo(clusterHash);
    };

    return {
      clusterFilesSet,
      clusterAverageSimilarity,
      selectedNodeTimestamp,
      goToInfo,
    };
  },
});
</script>

<style scoped>
.selected-info {
  max-width: 350px;
  position: absolute;
  z-index: 4;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.namecontainer {
  max-height: 35vh;
  overflow-y: auto;
}
</style>
