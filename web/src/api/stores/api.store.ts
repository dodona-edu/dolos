import { defineStore } from "pinia";
import { ref } from "@vue/composition-api";
import { getInterpolatedSimilarity } from "@/api/utils";
import {
  useFileStore,
  useKgramStore,
  useMetadataStore,
  usePairStore,
  useSemanticStore,
} from "@/api/stores";

/**
 * Store managing the API.
 */
export const useApiStore = defineStore("api", () => {
  // API Stores
  const fileStore = useFileStore();
  const kgramStore = useKgramStore();
  const metadataStore = useMetadataStore();
  const pairStore = usePairStore();
  const semanticStore = useSemanticStore();

  // If the data is loaded.
  const isLoaded = ref(false);

  // Whether the names should be anonymized.
  const isAnonymous = ref(false);

  // Cut-off value.
  const cutoff = ref(0.75);

  // Hydrate the API stores.
  const hydrate = async (): Promise<void> => {
    isLoaded.value = false;

    // Hydrate all stores (fetch data)
    await fileStore.hydrate();
    await kgramStore.hydrate();
    await metadataStore.hydrate();
    await pairStore.hydrate();
    await semanticStore.hydrate();

    // Calculate the initial cut-off value.
    cutoff.value = getInterpolatedSimilarity(Object.values(pairStore.pairs));

    isLoaded.value = true;
  };

  return {
    isAnonymous,
    isLoaded,
    cutoff,
    hydrate,
  };
});
