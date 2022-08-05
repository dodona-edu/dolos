import { defineStore } from "pinia";
import { shallowRef, watch } from "vue";
import { getInterpolatedSimilarity } from "@/api/utils";
import {
  useFileStore,
  useKgramStore,
  useMetadataStore,
  usePairStore,
  useSemanticStore,
} from "@/api/stores";
import { refDebounced } from "@vueuse/shared";

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
  const isLoaded = shallowRef(false);

  // Whether the names should be anonymized.
  const isAnonymous = shallowRef(false);

  // Cut-off value.
  const cutoff = shallowRef(0.75);
  const cutoffDebounced = refDebounced(cutoff, 100);

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
    cutoff.value = getInterpolatedSimilarity(pairStore.pairsList);

    isLoaded.value = true;
  };

  // Re-hydrate the API stores when the anonymous value changes.
  watch(
    isAnonymous,
    () => {
      fileStore.anonymize();
    }
  );

  return {
    isAnonymous,
    isLoaded,
    cutoff,
    cutoffDebounced,
    hydrate,
  };
});
