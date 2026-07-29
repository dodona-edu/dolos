import { watch } from "vue";
import { storeToRefs } from "pinia";
import { useAppMode } from "@/composables";
import {
  useFileStore,
  useKgramStore,
  useLoaderStore,
  useMetadataStore,
  usePairStore,
  useSettingsStore,
} from "@/stores/report";
import { guessSimilarityThreshold } from "@/api/utils";

/**
 * Orchestrates the sequential hydration of the per-report data stores.
 * Loading state is kept in useLoaderStore so that other operations
 * (e.g. anonymize in file.store) can also show the loading overlay.
 */
export function useReportLoader() {
  const fileStore = useFileStore();
  const kgramStore = useKgramStore();
  const metadataStore = useMetadataStore();
  const pairStore = usePairStore();
  const settingsStore = useSettingsStore();
  const loaderStore = useLoaderStore();
  const { loading, loadingText, error } = storeToRefs(loaderStore);

  const hydrate = async (): Promise<void> => {
    loading.value = true;

    try {
      loadingText.value = "Fetching & parsing metadata...";
      await metadataStore.hydrate();

      loadingText.value = "Fetching & parsing files...";
      await fileStore.hydrate();
      loadingText.value = "Fetching & parsing k-grams...";
      await kgramStore.hydrate();

      loadingText.value = "Fetching & parsing pairs...";
      await pairStore.hydrate();

      loadingText.value = "Calculating initial cut-off...";
      settingsStore.cutoff = guessSimilarityThreshold(pairStore.pairsActiveList);
      settingsStore.cutoffDefault = settingsStore.cutoff;
    } catch (e) {
      error.value = e instanceof Error ? e : String(e);
    }

    loading.value = false;
  };

  const { dataUrl } = useAppMode();

  // When the anonymize toggle flips, re-apply name substitution across all files.
  watch(() => settingsStore.isAnonymous, () => fileStore.anonymize());
  // Re-hydrate when the data source URL changes (server mode: switching reports).
  watch(dataUrl, () => {
    if (dataUrl.value) {
      hydrate();
    }
  });

  return { loading, loadingText, error, hydrate };
}
