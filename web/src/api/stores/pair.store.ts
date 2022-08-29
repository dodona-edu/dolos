import { defineStore } from "pinia";
import { shallowRef, computed, watch } from "vue";
import { DATA_URL } from "@/api";
import { assertType, parseCsv } from "@/api/utils";
import { Cluster } from "@/util/clustering-algorithms/ClusterTypes";
import { singleLinkageCluster } from "@/util/clustering-algorithms/SingleLinkageClustering";
import {
  useApiStore,
  useFileStore,
  useKgramStore,
  useMetadataStore,
  useSemanticStore,
} from "@/api/stores";
import {
  Pair,
  ObjMap,
  File,
} from "@/api/models";
import { getClusterElements } from "@/util/clustering-algorithms/ClusterFunctions";
import * as Comlink from "comlink";
import { DataWorker } from "@/api/workers/data.worker";

/**
 * Store containing the pair data & helper functions.
 */
export const usePairStore = defineStore("pairs", () => {
  // List of pairs.
  const pairs = shallowRef<ObjMap<Pair>>({});
  const pairsList = computed<Pair[]>(() => Object.values(pairs.value));

  // Reference to the other stores.
  const fileStore = useFileStore();
  const kgramStore = useKgramStore();
  const metadataStore = useMetadataStore();
  const semanticStore = useSemanticStore();
  const apiStore = useApiStore();

  // List of pairs to display (with active labels)
  const pairsActive = shallowRef<ObjMap<Pair>>({});
  const pairsActiveList = computed(() => {
    return Object.values(pairsActive.value);
  });

  // Calculate the active pairs list.
  function calculateActivePairs(): void {
    // Return all files if no labels are available.
    if (!fileStore.hasLabels) {
      pairsActive.value = pairs.value;
      return;
    }
    
    const pairsFiltered = { ...pairs.value };

    // Delete all the pairs that contain a file that shouldn't be displayed.

    for (const pair of pairsList.value) {
      if (
        !fileStore.filesActiveList.includes(pair.leftFile) ||
        !fileStore.filesActiveList.includes(pair.rightFile)
      ) {
        delete pairsFiltered[pair.id];
      }
    }

    pairsActive.value = pairsFiltered;
  }

  // Update the pairs to display when the pairs change.
  // The changing of files or legend is handled by the file store.
  watch(pairs, () => calculateActivePairs());
  

  // If this store has been hydrated.
  const hydrated = shallowRef(false);

  // Data worker
  const dataWorker = Comlink.wrap<DataWorker>(new Worker(new URL("../workers/data.worker.ts", import.meta.url)));

  // Parse the pairs from a CSV string.
  function parse(pairData: any[], files: ObjMap<File>): ObjMap<Pair> {
    return Object.fromEntries(
      pairData.map((row) => {
        const id = parseInt(assertType(row.id));
        const similarity = parseFloat(assertType(row.similarity));
        const longestFragment = parseFloat(assertType(row.longestFragment));
        const totalOverlap = parseFloat(assertType(row.totalOverlap));
        const leftCovered = parseFloat(assertType(row.leftCovered));
        const rightCovered = parseFloat(assertType(row.rightCovered));

        const diff = {
          id,
          similarity,
          longestFragment,
          totalOverlap,
          leftFile: files[parseInt(assertType(row.leftFileId))],
          rightFile: files[parseInt(assertType(row.rightFileId))],
          matches: [],
          fragments: null,
          pairedMatches: [],
          unpairedMatches: [],
          leftCovered,
          rightCovered,
        };
        return [id, diff];
      })
    );
  }

  // Fetch the pairs from the CSV file.
  async function fetch(
    url: string = DATA_URL + "pairs.csv"
  ): Promise<any[]> {
    return await parseCsv(url);
  }

  // Hydrate the store
  async function hydrate(): Promise<void> {
    // Make sure the file store is hydrated.
    if (!fileStore.hydrated) {
      throw new Error("The file store must be hydrated before the pair store.");
    }

    pairs.value = parse(await fetch(), fileStore.filesActive);
    hydrated.value = true;
  }

  // Populate the fragments for a given pair.
  async function populateFragments(pair: Pair): Promise<Pair> {
    const customOptions = metadataStore.metadata;
    const kmers = kgramStore.kgrams;
    const occurrences = semanticStore.occurrences;

    const pairWithFragments = await dataWorker.populateFragments(pair, customOptions, kmers, occurrences);
    pairs.value[pair.id] = pairWithFragments;
    return pairWithFragments;
  }

  // Populate the semantic matches for a given pair.
  async function populateSemantic(pair: Pair): Promise<Pair> {
    const occurrences = semanticStore.occurrences;

    const pairWithSemantic = await dataWorker.populateSemantic(pair, occurrences);
    pairs.value[pair.id] = pairWithSemantic;
    return pairWithSemantic;
  }

  // Get a pair by its ID.
  function getPair(id: number): Pair {
    return pairsActive.value[id];
  }

  // Get a list of pairs for a given file.
  function getPairs(file: File): Pair[] {
    return pairsActiveList.value.filter((pair) => pair.leftFile === file || pair.rightFile === file) ?? [];
  }

  // Clustering
  const clustering = computed(() =>
    singleLinkageCluster(pairsActive.value, fileStore.filesActive, apiStore.cutoffDebounced)
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

  return {
    pairsActive,
    pairsActiveList,
    calculateActivePairs,
    hydrated,
    hydrate,
    populateFragments,
    populateSemantic,
    getPair,
    getPairs,
    clustering,
    sortedClustering,
    getCluster,
    getClusterIndex,
  };
});
