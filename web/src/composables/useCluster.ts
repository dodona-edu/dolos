import { ComputedRef, computed, unref } from "vue";
import { MaybeRef } from "@/util/Types";
import { File, Pair } from "@/api/models";
import { usePairStore } from "@/api/stores";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import {
  getAverageClusterSimilarity,
  getClusterElements,
  getClusterElementsArray,
} from "@/util/clustering-algorithms/ClusterFunctions";

/**
 * Return type for the composable.
 */
export interface UseClusterReturn {
  clusterFiles: ComputedRef<File[]>;
  clusterFilesSet: ComputedRef<Set<File>>;
  clusterPairs: ComputedRef<Pair[]>;
  clusterAverageSimilarity: ComputedRef<number>;
  clusterIndex: ComputedRef<number>;
}

/**
 * Calculate the clustering.
 */
export function useCluster(
  cluster: MaybeRef<Cluster | null | undefined>
): UseClusterReturn {
  const pairStore = usePairStore();

  // List of files in the cluster.
  const clusterFiles = computed(() => {
    const value = unref(cluster);
    return value ? getClusterElementsArray(value) : [];
  });

  // Set of files in the cluster.
  const clusterFilesSet = computed(() => {
    const value = unref(cluster);
    return value ? getClusterElements(value) : new Set<File>();
  });

  // List of pairs in a cluster.
  const clusterPairs = computed(() => {
    const value = unref(cluster);
    return value ? [...value] : [];
  });

  // Average similarity of the cluster.
  const clusterAverageSimilarity = computed(() => {
    const value = unref(cluster);
    return value ? getAverageClusterSimilarity(value) : 0;
  });

  // Cluster index in the clustering
  const clusterIndex = computed(() => {
    const value = unref(cluster);
    return value ? pairStore.getClusterIndex(value) : -1;
  });

  return {
    clusterFiles,
    clusterFilesSet,
    clusterPairs,
    clusterAverageSimilarity,
    clusterIndex,
  };
}
