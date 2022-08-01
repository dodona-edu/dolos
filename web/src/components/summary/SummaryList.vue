<template>
  <v-row>
    <!-- Filters -->
    <v-col cols="12">
      <v-row dense>
        <v-col cols="12" md="8">
          <v-text-field
            v-model="search"
            label="Search for a file"
            outlined
            dense
            hide-details
          />
        </v-col>

        <v-col cols="12" sm="4">
          <v-select
            v-model="selectedSortOption"
            :items="sortOptions"
            item-text="name"
            :item-value="v => v"
            dense
            outlined
            hide-details
          />
        </v-col>
      </v-row>
    </v-col>

    <!-- Files -->
    <v-col
      v-for="scoredFile in scoredFilesDisplay"
      :key="scoredFile.file.id"
      cols="12"
    >
      <FileCard
        :file="scoredFile"
        :scoredFiles="scoredFiles"
        :selected-value="selectedSortOption.selectedValue"
      />
    </v-col>

    <!-- Placeholder -->
    <v-col v-if="search && scoredFilesDisplay.length === 0" cols="12">
      No files where found for that search query.
    </v-col>

    <!-- Pagination -->
    <v-col cols="12" v-if="pageTotal > 1">
      <v-pagination v-model="page" :length="pageTotal" total-visible="7" />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, shallowRef, computed, watch } from "vue";
import { storeToRefs } from "pinia";
import { Pair } from "@/api/models";
import { useFileStore, usePairStore } from "@/api/stores";
import {
  FileInterestingnessCalculator,
  FileScoring,
  getLargestPairOfScore,
} from "@/util/FileInterestingness";
import FileCard from "@/components/summary/FileCard.vue";

export default defineComponent({
  setup() {
    const { filesList } = storeToRefs(useFileStore());
    const { pairsList } = storeToRefs(usePairStore());

    // Sorting options.
    const sortOptions = [
      {
        name: "Most interesting items",
        sortFunc: (a: FileScoring, b: FileScoring) =>
          b.finalScore - a.finalScore,
        selectedValue: null,
      },
      {
        name: "Highest similarity",
        sortFunc: (a: FileScoring, b: FileScoring) =>
          (b.similarityScore?.similarity || 0) -
          (a.similarityScore?.similarity || 0),
        selectedValue: 0,
      },
      {
        name: "Longest possible match",
        sortFunc: (a: FileScoring, b: FileScoring) =>
          (b.longestFragmentScore?.longestFragmentWrtSize || 0) -
          (a.longestFragmentScore?.longestFragmentWrtSize || 0),
        selectedValue: 1,
      },
      {
        name: "Most overlap",
        sortFunc: (a: FileScoring, b: FileScoring) =>
          (b.totalOverlapScore?.totalOverlapWrtSize || 0) -
          (a.totalOverlapScore?.totalOverlapWrtSize || 0),
        selectedValue: 2,
      },
    ];

    // Selected sorting option
    const selectedSortOption = shallowRef(sortOptions[0]);

    // Pagination.
    const page = shallowRef(1);
    const pageTotal = computed(() => Math.ceil(scoredFilesSearch.value.length / 10));
    const pageAmount = 5;

    // Search filter.
    const search = shallowRef("");

    // Calculator class for determining the score of a file.
    const scoringCalculator = new FileInterestingnessCalculator(pairsList.value);

    // Files with a score, sorted by the selected metric.
    const scoredFiles = filesList.value.map((file) =>
      scoringCalculator.calculateFileScoring(file)
    );

    // Scored files, after sorting.
    const scoredFilesSorted = shallowRef<FileScoring[]>([]);

    // Scored files, after search filter.
    const scoredFilesSearch = computed(() =>
      scoredFilesSorted.value.filter((file) =>
        file.file.shortPath.toLowerCase().includes(search.value.toLowerCase())
      )
    );

    // Scored files to display (pagination/sorting/filtering)
    const scoredFilesDisplay = computed(() => {
      // Pagination
      const start = (page.value - 1) * pageAmount;
      const end = start + pageAmount;
      return scoredFilesSearch.value.slice(start, end);
    });

    // When the sorting changes, update the sorted files.
    watch(
      () => selectedSortOption.value,
      (sorting) => {
        const sorted = sorting
          ? [...scoredFiles].sort(sorting.sortFunc)
          : scoredFiles;

        // Deduplicate the pairs. This avoids having the same pair from different perspectives multiple times
        scoredFilesSorted.value = [];
        const pairSet = new Set<Pair>();
        for (const scF of sorted) {
          const p = getLargestPairOfScore(scF);
          if (p && !pairSet.has(p)) {
            scoredFilesSorted.value.push(scF);
            pairSet.add(p);
          }
        }
      },
      { immediate: true },
    );

    return {
      page,
      pageTotal,
      search,
      sortOptions,
      selectedSortOption,
      scoredFiles,
      scoredFilesDisplay,
    };
  },

  components: {
    FileCard,
  },
});
</script>
