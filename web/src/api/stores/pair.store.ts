import { defineStore } from "pinia";
import { parseCsv } from "@/api/utils";
import { shallowRef, computed } from "vue";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import {
  singleLinkageCluster
} from "@/util/clustering-algorithms/SingleLinkageClustering";
import {
  useApiStore,
  useFileStore,
  useKgramStore,
  useMetadataStore,
} from "@/api/stores";
import { File, Pair } from "@/api/models";
import {
  getClusterElements
} from "@/util/clustering-algorithms/ClusterFunctions";

/**
 * Store containing the pair data & helper functions.
 */
export const usePairStore = defineStore("pairs", () => {
  // List of pairs.
  const pairsById = shallowRef<Pair[]>([]);
  const pairsList = computed<Pair[]>(() => Object.values(pairsById.value));

  // If only one pair is available.
  const hasOnlyOnePair = computed<boolean>(() => pairsList.value.length === 1);
  // Get the only pair.
  const onlyPair = computed<Pair | null>(() => {
    if (hasOnlyOnePair.value) {
      return pairsList.value[0];
    }
    return null;
  });

  // Reference to the other stores.
  const fileStore = useFileStore();
  const kgramStore = useKgramStore();
  const metadataStore = useMetadataStore();
  const apiStore = useApiStore();

  // List of pairs to display (with active labels)
  const pairsActiveById = computed<Pair[]>(() => {
    if (!fileStore.hasLabels) {
      return pairsById.value;
    }
    const activeFilesById = fileStore.filesActiveById;
    const pairs: Pair[] = [];
    // Add all pairs that have both files active

    for (const pair of pairsList.value) {
      if (activeFilesById[pair.leftFile.id] && activeFilesById[pair.rightFile.id]) {
        pairs[pair.id] = pair;
      }
    }
    return pairs;
  });
  const pairsActiveList = computed<Pair[]>(() => {
    return Object.values(pairsActiveById.value).sort((a, b) => b.similarity - a.similarity);
  });


  // If this store has been hydrated.
  const hydrated = shallowRef(false);

  // Data worker
  type DataWorker = typeof import("../workers/data.worker");
  const dataWorker = new ComlinkWorker<DataWorker>((new URL("../workers/data.worker.ts", import.meta.url)));

  // Parse the pairs from a CSV string.
  function parse(pairData: any[], files: File[]): Pair[] {
    const pairs: Pair[] = [];
    for (const row of pairData) {
      const id = row.id;
      const similarity = row.similarity;
      const longestFragment = row.longestFragment;
      const totalOverlap = row.totalOverlap;
      const leftCovered = row.leftCovered;
      const rightCovered = row.rightCovered;
      pairs[id] = {
        id,
        similarity,
        longestFragment,
        totalOverlap,
        leftFile: files[row.leftFileId],
        rightFile: files[row.rightFileId],
        fragments: null,
        leftCovered,
        rightCovered,
      };
    }
    return pairs;
  }

  // Fetch the pairs from the CSV file.
  async function fetch(conn: AsyncDuckDBConnection): Promise<any[]> {
    const result = await conn.query("SELECT * from pairs");
    return result.toArray();
  }

  // Hydrate the store
  async function hydrate(conn: AsyncDuckDBConnection): Promise<void> {
    // Make sure the file store is hydrated.
    if (!fileStore.hydrated) {
      throw new Error("The file store must be hydrated before the pair store.");
    }
    console.time("Hydrate pairs");
    pairsById.value = parse(await fetch(conn), fileStore.filesActiveById);
    console.timeEnd("Hydrate pairs");

    hydrated.value = true;
  }

  // Populate the fragments for a given pair.
  async function populateFragments(pair: Pair): Promise<Pair> {
    const customOptions = metadataStore.metadata;
    const kgrams = kgramStore.kgrams;
    const ignoredKgrams = kgramStore.ignoredKgrams;
    const ignoredFile = fileStore.ignoredFile;
    const pairWithFragments = await dataWorker.populateFragments(pair, customOptions, kgrams, ignoredKgrams, ignoredFile);
    pairsById.value[pair.id] = pairWithFragments;
    return pairWithFragments;
  }

  // Get a pair by its ID.
  function getPair(id: number): Pair {
    return pairsActiveById.value[id];
  }

  // Get a list of pairs for a given file.
  function getPairs(file: File): Pair[] {
    return pairsActiveList.value.filter((pair) => pair.leftFile === file || pair.rightFile === file) ?? [];
  }

  // Clustering
  const clustering = computed(() =>
    singleLinkageCluster(pairsActiveList.value, fileStore.filesActiveList, apiStore.cutoffDebounced)
  );

  // Sorted Clustering
  const sortedClustering = computed(() => {
    const sortFn = (a: Cluster, b: Cluster): number => getClusterElements(b).size - getClusterElements(a).size;
    return [...clustering.value].sort(sortFn);
  });

  // Get the cluster for a given file.
  function getCluster(file: File | undefined): Cluster | undefined {
    if (!file) return undefined;

    // Find a cluster that contains a pair that contains the file.
    return clustering.value.find((cluster) =>
      [...cluster].some((pair) => pair.leftFile === file || pair.rightFile === file)
    );
  }

  // Get the index of the cluster for a given cluster.
  function getClusterIndex(cluster: Cluster | undefined): number {
    return sortedClustering.value.findIndex((c) => c === cluster);
  }

  // Get a cluster by its id.
  function getClusterById(id: number | string): Cluster | undefined {
    if (typeof id === "string") {
      return sortedClustering.value[parseInt(id)];
    } else {
      return sortedClustering.value[id];
    }
  }

  return {
    pairs: pairsById,
    pairsList,
    pairsActive: pairsActiveById,
    pairsActiveList,
    hasOnlyOnePair,
    onlyPair,
    hydrated,
    hydrate,
    populateFragments,
    getPair,
    getPairs,
    clustering,
    sortedClustering,
    getCluster,
    getClusterIndex,
    getClusterById,
  };
});
