<template>
  <div class="selected-info">
    <transition name="scroll-y-transition" mode="out-in">
      <div v-if="selectedNode" key="">
        <v-card>
          <v-card-title> Selected node </v-card-title>

          <v-list class="selected-info-list" density="compact">
            <v-list-item class="selected-info-list-item">
              <v-icon start>mdi-account-outline</v-icon>
              <span>{{ selectedNode.extra.fullName || selectedNode.shortPath || "unknown" }}</span>
            </v-list-item>

            <v-list-item class="selected-info-list-item">
              <div class="d-flex align-center">
                <div class="ml-2">
                  <label-dot
                    :label="selectedNodeLegend?.name || 'unknown'"
                    :color="selectedNodeLegend?.color || 'grey'"
                  />
                </div>
                <span class="ml-4">{{ selectedNodeLegend?.name || "unknown" }}</span>
              </div>
            </v-list-item>

            <v-list-item
              v-if="selectedNodeTimestamp"
              class="selected-info-list-item"
            >
              <v-icon start>mdi-clock-outline</v-icon>
              <span>{{ selectedNodeTimestamp }}</span>
            </v-list-item>
          </v-list>

          <v-card-actions>
            <v-spacer />
            <v-btn
              color="primary"
              variant="text"
              :to="{ name: 'Submission', params: { fileId: selectedNode.id } }"
            >
              View submission
              <v-icon end>mdi-chevron-right</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </div>
    </transition>

    <transition name="scroll-y-transition" mode="out-in">
      <div v-if="selectedCluster">
        <v-card>
          <v-card-title> Selected cluster </v-card-title>

          <v-list class="selected-info-list" density="compact">
            <v-list-item class="selected-info-list-item">
              <v-icon start>mdi-account-group-outline</v-icon>
              <span>{{ clusterFilesSet.size }} submissions</span>
            </v-list-item>

            <v-list-item class="selected-info-list-item">
              <v-icon start>mdi-approximately-equal</v-icon>
              <span>{{ (clusterAverageSimilarity * 100).toFixed(2) }}% average similarity</span>
            </v-list-item>
          </v-list>

          <graph-element-list
            :cluster="selectedCluster"
            max-height="30vh"
            scroll
          />

          <v-card-actions>
            <v-spacer />
            <v-btn
              v-if="selectedClusterPair"
              variant="text"
              :to="{
                name: 'Pair',
                params: { pairId: selectedClusterPair.id },
              }"
            >
              View pair
              <v-icon end>mdi-chevron-right</v-icon>
            </v-btn>
            <v-btn
              color="primary"
              variant="text"
              :to="{
                name: 'Cluster',
                params: { clusterId: selectedClusterIndex },
              }"
            >
              View cluster
              <v-icon end>mdi-chevron-right</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { computed, toRef } from "vue";
import { useCluster } from "@/composables";
import { File, Legend } from "@/api/models";
import { Cluster, Clustering } from "@/util/clustering-algorithms/ClusterTypes";
import { getClusterElements } from "@/util/clustering-algorithms/ClusterFunctions";
import { formatLongDateTime } from "@/util/TimeFormatter";

interface Props {
  currentClustering: Clustering;
  legend: Legend;
  selectedNode?: File | undefined;
  selectedCluster?: Cluster | undefined;
}

const props = withDefaults(defineProps<Props>(), {});

const { clusterFilesSet, clusterAverageSimilarity } = useCluster(
  toRef(props, "selectedCluster")
);

// Timestamp of the selected node.
const selectedNodeTimestamp = computed(() => {
  if (props.selectedNode?.extra.timestamp) {
    return formatLongDateTime(props.selectedNode.extra.timestamp);
  }
  return null;
});

// Legend entry of the selected node.
const selectedNodeLegend = computed(() => {
  return props.selectedNode?.label;
});

// index of the selected cluster.
const selectedClusterIndex = computed(() => {
  if (!props.selectedCluster) return 0;

  const sortFn = (a: Cluster, b: Cluster): number =>
    getClusterElements(b).size - getClusterElements(a).size;
  const sortedClustering = Array.from(props.currentClustering).sort(sortFn);
  return sortedClustering.indexOf(props.selectedCluster);
});

// If the cluster contains exactly 1 pair.
const selectedClusterPair = computed(() => {
  if (!props.selectedCluster) return null;
  if (props.selectedCluster.size !== 1) return null;

  const [pair] = props.selectedCluster;
  return pair;
});
</script>

<style lang="scss" scoped>
.selected-info {
  width: 400px;
  max-width: 30vw;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &-list {
    padding-top: 0;

    &-dot {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
