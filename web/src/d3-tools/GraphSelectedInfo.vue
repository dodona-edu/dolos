<template>
  <div class="selected-info">
    <transition name="scale-transition" mode="out-in">
      <div v-if="selectedNode">
        <v-card>
          <v-card-title>
            Selected node
          </v-card-title>

          <v-list class="selected-info-list" dense>
            <v-list-item class="selected-info-list-item">
              <v-icon>mdi-account-outline</v-icon>
              <span>{{ selectedNode.extra.fullName || selectedNode.shortPath || "unknown" }}</span>
            </v-list-item>

            <v-list-item class="selected-info-list-item">
              <div class="selected-info-list-dot">
                <label-dot
                  :label="selectedNodeLegend?.label || 'unknown'"
                  :color="selectedNodeLegend?.color || 'grey'"
                />
              </div>
              <span>{{ selectedNode.extra.labels || "unknown" }}</span>
            </v-list-item>

            <v-list-item class="selected-info-list-item">
              <v-icon>mdi-clock-outline</v-icon>
              <span>{{ selectedNodeTimestamp || "not available." }}</span>
            </v-list-item>
          </v-list>
        </v-card>
      </div>
    </transition>

    <transition name="scale-transition" mode="out-in">
      <div v-if="selectedCluster">
        <v-card>
          <v-card-title>
            Selected cluster
          </v-card-title>

          <v-list class="selected-info-list" dense>
            <v-list-item class="selected-info-list-item">
              <v-icon>mdi-account-group-outline</v-icon>
              <span>{{ clusterFilesSet.size }} submissions</span>
            </v-list-item>

            <v-list-item class="selected-info-list-item">
              <v-icon>mdi-approximately-equal</v-icon>
              <span>{{ clusterAverageSimilarity.toFixed(2) * 100 }}% average similarity</span>
            </v-list-item>
          </v-list>

          <v-simple-table class="selected-info-table" fixed-header>
            <thead>
              <tr>
                <th>File</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="file in clusterFilesSet" :key="file.id">
                <td class="d-flex align-center">
                  <label-dot
                    :label="file.extra.labels || 'No label'"
                    :color="getColor(file)"
                  />

                  <span class="ml-2">{{ file.extra.fullName ?? file.shortPath }}</span>
                </td>
              </tr>
            </tbody>
          </v-simple-table>

          <v-card-actions>
            <v-spacer />
            <v-btn color="primary" text @click="goToInfo">More information</v-btn>
          </v-card-actions>
        </v-card>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { computed, toRef } from "vue";
import { useCluster, useVuetify, useRouter } from "@/composables";
import { File, Legend } from "@/api/models";
import { Cluster, Clustering } from "@/util/clustering-algorithms/ClusterTypes";
import { DateTime } from "luxon";
import { getClusterElements } from "@/util/clustering-algorithms/ClusterFunctions";
import LabelDot from "@/components/LabelDot.vue";

interface Props {
  currentClustering: Clustering;
  legend: Legend;
  selectedNode?: File | undefined;
  selectedCluster?: Cluster | undefined;
}

const props = withDefaults(defineProps<Props>(), {});

const vuetify = useVuetify();
const router = useRouter();
const { clusterFilesSet, clusterAverageSimilarity } = useCluster(toRef(props, "selectedCluster"));

// Timestamp of the selected node.
const selectedNodeTimestamp = computed(() => {
  if (props.selectedNode?.extra.timestamp) {
    return DateTime.fromJSDate(
      props.selectedNode.extra.timestamp
    ).toLocaleString(DateTime.DATETIME_MED);
  }
  return null;
});

// Legend entry of the selected node.
const selectedNodeLegend = computed(() => {
  if (props.selectedNode?.extra.labels) {
    return props.legend[props.selectedNode.extra.labels];
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

// Get the label color for a file in the cluster.
const getColor = (file: File): string => {
  if (!props.legend || !file.extra.labels || !props.legend[file.extra.labels]) return "";
  return props.legend[file.extra.labels].color;
};
</script>

<style lang="scss" scoped>
.selected-info {
  max-width: 350px;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &-list {
    padding-top: 0;

    &-item {
      display: flex;
      gap: 0.5rem;
      width: 100%;
    }

    &-dot {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &-table {
    max-height: 30vh;
    overflow: auto;
  }
}
</style>
