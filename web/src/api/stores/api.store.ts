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
  // Loading text.
  const loadingText = shallowRef("Loading...");

  // Whether the names should be anonymized.
  const isAnonymous = shallowRef(false);

  // Cut-off value.
  const cutoff = shallowRef(0.75);
  const cutoffDebounced = refDebounced(cutoff, 100);

  // Hydrate the API stores.
  const hydrate = async (): Promise<void> => {
    isLoaded.value = false;

    // Hydrate all stores (fetch data)
    loadingText.value = "Fetching & parsing files...";
    await fileStore.hydrate();
    loadingText.value = "Fetching & parsing k-grams...";
    await kgramStore.hydrate();
    loadingText.value = "Fetching & parsing metadata...";
    await metadataStore.hydrate();
    loadingText.value = "Fetching & parsing pairs...";
    await pairStore.hydrate();
    loadingText.value = "Fetching & parsing semantics...";
    await semanticStore.hydrate();

    // Calculate the initial cut-off value.
    loadingText.value = "Calculating initial cut-off...";
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
    loadingText,
    cutoff,
    cutoffDebounced,
    hydrate,
  };
});
