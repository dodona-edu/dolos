import { defineStore } from "pinia";
import { shallowRef, computed } from "vue";
import { DATA_URL } from "@/api";
import { Semantic, ObjMap, File } from "@/api/models";
import { useFileStore, useMetadataStore } from "@/api/stores";
import { ListMap } from "@/util/ListMap";
import { DecodedSemanticResult } from "@dodona/dolos-lib";

/**
 * Store containing the semantic data & helper functions.
 */
export const useSemanticStore = defineStore("semantic", () => {
  // List of occurrences.
  const occurrences = shallowRef<number[][]>([]);

  // Whether the sementic data is available.
  const isSemantic = computed(() => occurrences.value.length > 0);

  // If this store has been hydrated.
  const hydrated = shallowRef(false);

  // Parse the semantic data.
  function parse(semantic: Semantic, files: ObjMap<File>): number[][] {
    const occurrences = semantic.occurrences;

    const results = semantic.semanticMapResults.map((a) => ({
      ...a,
      occurrences: new Set(a.occurrences),
    }));

    const map = new ListMap<number, DecodedSemanticResult>();

    for (const semanticResult of results) {
      map.addValue(semanticResult.left, semanticResult);
    }

    for (const fid of Object.keys(files)) {
      files[+fid].semanticMap = map.get(+fid) || [];
    }

    return occurrences;
  }

  // Fetch the semantic data.
  async function fetch(url = DATA_URL + "semantic.json"): Promise<Semantic> {
    const response = await window.fetch(url);
    const data = await response.json();
    return data;
  }

  // Reference to the other stores.
  const fileStore = useFileStore();
  const metadataStore = useMetadataStore();

  // Hydrate the store
  async function hydrate(): Promise<void> {
    // Make sure the file store is hydrated.
    if (!fileStore.hydrated) {
      throw new Error("The file store must be hydrated before the pair store.");
    }

    if (metadataStore.metadata.semantic) {
      occurrences.value = parse(await fetch(), fileStore.files);
    }

    hydrated.value = true;
  }

  return {
    occurrences,
    isSemantic,
    hydrate,
  };
});
