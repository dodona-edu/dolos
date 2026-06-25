import { shallowRef, watch } from "vue";
import { useAppMode } from "@/composables";
import {
  useFileStore,
  useKgramStore,
  useMetadataStore,
  usePairStore,
  useSettingsStore,
} from "@/stores/report";
import { guessSimilarityThreshold } from "@/api/utils";

/**
 * Orchestrates the sequential hydration of the per-report data stores and
 * exposes the loading state consumed by the analysis layout.
 *
 * This is a composable (not a store) — it is called once from analysis.vue,
 * owns the load sequence, and returns reactive loading state local to that
 * layout. The underlying data stores are Pinia singletons; this composable
 * merely drives them.
 */
export function useReportLoader() {
  const fileStore = useFileStore();
  const kgramStore = useKgramStore();
  const metadataStore = useMetadataStore();
  const pairStore = usePairStore();
  const settingsStore = useSettingsStore();

  const loading = shallowRef(true);
  const loadingText = shallowRef("Loading...");
  const error = shallowRef<Error | string | undefined>();

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
