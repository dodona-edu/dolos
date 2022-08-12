import { defineStore } from "pinia";
import { shallowRef, computed } from "vue";
import { DATA_URL } from "@/api";
import { assertType, parseCsv } from "@/api/utils";
import {
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
import * as DataWorker from "@/api/workers/data.worker";

/**
 * Store containing the pair data & helper functions.
 */
export const usePairStore = defineStore("pairs", () => {
  // List of pairs.
  const pairs = shallowRef<ObjMap<Pair>>({});
  const pairsList = computed<Pair[]>(() => Object.values(pairs.value));

  // If this store has been hydrated.
  const hydrated = shallowRef(false);

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

  // Reference to the other stores.
  const fileStore = useFileStore();
  const kgramStore = useKgramStore();
  const metadataStore = useMetadataStore();
  const semanticStore = useSemanticStore();

  // Hydrate the store
  async function hydrate(): Promise<void> {
    // Make sure the file store is hydrated.
    if (!fileStore.hydrated) {
      throw new Error("The file store must be hydrated before the pair store.");
    }

    pairs.value = parse(await fetch(), fileStore.files);
    hydrated.value = true;
  }

  // Populate the fragments for a given pair.
  async function populateFragments(pair: Pair): Promise<Pair> {
    const customOptions = metadataStore.metadata;
    const kmers = kgramStore.kgrams;
    const occurrences = semanticStore.occurrences;

    const pairWithFragments = await DataWorker.populateFragments(pair, customOptions, kmers, occurrences);
    pairs.value[pair.id] = pairWithFragments;
    return pairWithFragments;
  }

  // Populate the semantic matches for a given pair.
  async function populateSemantic(pair: Pair): Promise<Pair> {
    const occurrences = semanticStore.occurrences;

    const pairWithSemantic = await DataWorker.populateSemantic(pair, occurrences);
    pairs.value[pair.id] = pairWithSemantic;
    return pairWithSemantic;
  }

  // Get a pair by its ID.
  function getPair(id: number): Pair {
    return pairs.value[id];
  }

  return {
    pairs,
    pairsList,
    hydrated,
    hydrate,
    populateFragments,
    populateSemantic,
    getPair,
  };
});
