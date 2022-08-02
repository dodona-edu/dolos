import { ComputedRef, computed } from "vue";
import { useApiStore, usePairStore, useFileStore } from "@/api/stores";
import { singleLinkageCluster } from "@/util/clustering-algorithms/SingleLinkageClustering";
import { Clustering } from "@/util/clustering-algorithms/ClusterTypes";

/**
 * Calculate the clustering.
 */
export function useClustering(): ComputedRef<Clustering> {
  const apiStore = useApiStore();
  const pairStore = usePairStore();
  const fileStore = useFileStore();

  return computed(() => singleLinkageCluster(pairStore.pairs, fileStore.files, apiStore.cutoffDebounced));
}
