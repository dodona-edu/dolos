import * as d3 from "d3";
import { defineStore } from "pinia";
import { ref } from "@vue/composition-api";
import { DATA_URL } from "@/api";
import { assertType, fileToTokenizedFile } from "@/api/utils";
import { useFileStore, useKgramStore, useMetadataStore } from "@/api/stores";
import {
  Pair,
  ObjMap,
  File,
  Hash,
  Kgram,
  Fragment,
  PairedOccurrence,
} from "@/api/models";
import {
  CustomOptions,
  Fragment as DolosFragment,
  EmptyTokenizer,
  Options,
  Index,
} from "@dodona/dolos-lib";

/**
 * Store containing the pair data & helper functions.
 */
export const usePairStore = defineStore("pairs", () => {
  // List of pairs.
  const pairs = ref<ObjMap<Pair>>({});

  // If this store has been hydrated.
  const hydrated = ref(false);

  // Parse the pairs from a CSV string.
  function parse(pairData: d3.DSVRowArray, files: ObjMap<File>): ObjMap<Pair> {
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
          fragments: null,
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
  ): Promise<d3.DSVRowArray> {
    return await d3.csv(url);
  }

  // Reference to the other stores.
  const fileStore = useFileStore();
  const kgramStore = useKgramStore();
  const metadataStore = useMetadataStore();

  // Hydrate the store
  async function hydrate(): Promise<void> {
    // Make sure the file store is hydrated.
    if (!fileStore.hydrated) {
      throw new Error("The file store must be hydrated before the pair store.");
    }

    pairs.value = parse(await fetch(), fileStore.files);
    hydrated.value = true;
  }

  // Parse a list of Dolos fragments into a list of fragment models.
  function parseFragments(
    dolosFragments: DolosFragment[],
    kmersMap: Map<Hash, Kgram>
  ): Fragment[] {
    // const parsed = JSON.parse(fragmentsJson);
    return dolosFragments.map((dolosFragment: DolosFragment): Fragment => {
      return {
        active: true,
        left: dolosFragment.leftSelection,
        right: dolosFragment.rightSelection,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        data: dolosFragment.mergedData!,
        occurrences: dolosFragment.pairs.map((occurrence): PairedOccurrence => {
          return {
            kgram: assertType(kmersMap.get(occurrence.fingerprint.hash)),
            left: occurrence.left,
            right: occurrence.right,
          };
        }),
      };
    });
  }

  // Populate the fragments for a given pair.
  async function populateFragments(pair: Pair): Promise<void> {
    const customOptions = metadataStore.metadata;
    const kmers = kgramStore.kgrams;

    const emptyTokenizer = new EmptyTokenizer();
    const options = new Options(customOptions);
    const index = new Index(emptyTokenizer, options);
    const report = await index.compareTokenizedFiles([
      fileToTokenizedFile(pair.leftFile),
      fileToTokenizedFile(pair.rightFile),
    ]);
    const reportPair = report.scoredPairs[0].pair;
    const kmersMap: Map<Hash, Kgram> = new Map();
    for (const kmerKey in kmers) {
      const kmer = kmers[kmerKey];
      kmersMap.set(kmer.hash, kmer);
    }
    pair.fragments = parseFragments(reportPair.fragments(), kmersMap);
  }

  return {
    pairs,
    hydrated,
    hydrate,
    populateFragments,
  };
});
