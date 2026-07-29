import { defineStore } from "pinia";
import { shallowRef, computed, watch, ref, ComputedRef } from "vue";
import { File, Legend, Pair } from "@/api/models";
import { useLoaderStore, useSettingsStore, usePairStore } from "@/stores/report";
import { useAppMode } from "@/composables";
import { parseCsv, parseFiles } from "@/api/utils";
import {
  FileInterestingnessCalculator,
  FileScoring,
  SimilarityScore,
} from "@/util/FileInterestingness";

/**
 * Resolve after the browser has painted the next frame. nextTick/microtasks
 * run *before* paint, so they can't reveal a loading overlay ahead of
 * main-thread-blocking work; waiting two animation frames guarantees one
 * real painted frame in between.
 */
function nextPaint(): Promise<void> {
  return new Promise(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );
}

/**
 * Store containing the file data & helper functions.
 */
export const useFileStore = defineStore("file", () => {
  // Stores
  const loaderStore = useLoaderStore();
  const settingsStore = useSettingsStore();
  const pairStore = usePairStore();
  const { dataUrl } = useAppMode();

  // State
  const hydrated = shallowRef(false);

  const ignoredFile = shallowRef<File | undefined>();
  const filesById = shallowRef<File[]>([]);
  const filesList = computed(() => Object.values(filesById.value));

  const hasLabels = shallowRef(false);
  const hasUnlabeled = shallowRef(false);
  const hasTimestamps = shallowRef(false);

  const filesActiveById = shallowRef<File[]>([]);
  const filesActiveList = computed<File[]>(() =>
    Object.values(filesActiveById.value)
  );

  const legend = ref<Legend>({});
  const labels = computed(() => Object.values(legend.value).reverse());
  const labelFilesCount: ComputedRef<Map<string, number>> = computed(() => {
    const files = filesActiveList.value;
    const count = new Map<string, number>();
    for (const file of files) {
      count.set(file.label.name, (count.get(file.label.name) || 0) + 1);
    }
    return count;
  });

  const scoringCalculator: any = computed(
    () => new FileInterestingnessCalculator(pairStore.pairsActiveList)
  );
  const scoredFiles = computed<Map<File, FileScoring>>(() => {
    const files = filesList.value;
    const calculator = scoringCalculator.value;
    return new Map(
      files.map((file) => [file, calculator.calculateFileScoring(file)])
    );
  });
  const scoredFilesList = computed<FileScoring[]>(() =>
    Array.from(scoredFiles.value.values())
  );
  const similarities = computed<Map<File, SimilarityScore | null>>(
    () =>
      new Map(
        scoredFilesList.value.map(({ file, similarityScore }) => [
          file,
          similarityScore,
        ])
      )
  );
  const similaritiesList = computed<SimilarityScore[]>(
    () =>
      Array.from(similarities.value.values()).filter(
        (s) => s !== null
      ) as SimilarityScore[]
  );

  // Functions

  async function hydrate(): Promise<void> {
    const parsed = parseFiles(await fetch());
    filesById.value = parsed.files;
    filesActiveById.value = parsed.files;
    ignoredFile.value = parsed.ignoredFile;
    legend.value = parsed.labels;
    hasLabels.value = parsed.hasLabels;
    hasUnlabeled.value = parsed.hasUnlabeled;
    hasTimestamps.value = parsed.hasTimestamps;
    hydrated.value = true;
  }

  async function fetch(
    url: string = dataUrl.value + "/files.csv"
  ): Promise<any[]> {
    return await parseCsv(url);
  }

  // Anonymize the data.
  async function anonymize(): Promise<void> {
    loaderStore.loading = true;
    loaderStore.loadingText = "Anonymizing files...";

    // Wait for the browser to actually paint the loading overlay before the
    // synchronous loops below block the main thread.
    // FIXME: https://github.com/dodona-edu/dolos/issues/1891
    await nextPaint();

    const isAnonymous = settingsStore.isAnonymous;

    for (const file of Object.values(filesById.value)) {
      if (isAnonymous) {
        file.path = file.pseudo.path;
        file.shortPath = file.pseudo.shortPath;
        file.extra.fullName = file.pseudo.fullName;
        file.extra.timestamp = file.pseudo.timestamp;
      } else {
        file.path = file.original.path;
        file.shortPath = file.original.shortPath;
        file.extra.fullName = file.original.fullName;
        file.extra.timestamp = file.original.timestamp;
      }
    }

    for (const label of Object.values(legend.value)) {
      label.name = isAnonymous ? label.pseudoLabel : label.originalLabel;
    }

    for (const pair of Object.values<Pair>(pairStore.pairs)) {
      pair.leftFile = filesById.value[pair.leftFile.id];
      pair.rightFile = filesById.value[pair.rightFile.id];
    }

    filesById.value = { ...filesById.value };
    pairStore.pairs = { ...pairStore.pairs };
    legend.value = { ...legend.value };
    loaderStore.loading = false;
  }

  // Labels can be toggled on and off, requires the active files to be recalculated.
  watch(
    legend,
    () => {
      if (hasLabels.value) {
        const files: File[] = [];
        for (const file of filesList.value) {
          if (file.label.selected) {
            files[file.id] = file;
          }
        }
        filesActiveById.value = files;
      }
    },
    { deep: true }
  );

  return {
    ignoredFile,
    filesById,
    filesList,
    filesActiveById,
    filesActiveList,
    scoredFiles,
    scoredFilesList,
    similarities,
    similaritiesList,
    hydrated,
    hydrate,
    legend,
    labels,
    anonymize,
    hasTimestamps,
    hasLabels,
    hasUnlabeled,
    labelFilesCount,
  };
});
