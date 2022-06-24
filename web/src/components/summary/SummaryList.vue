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
        :selected-value="selectedSortOption && selectedSortOption.selectedValue"
      />
    </v-col>

    <!-- Placeholder -->
    <v-col v-if="search && scoredFilesDisplay.length === 0" cols="12">
      No files where found for that search query.
    </v-col>

    <!-- Pagination -->
    <v-col cols="12">
      <v-pagination v-model="page" :length="pageTotal" />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "@vue/composition-api";
import { storeToRefs } from "pinia";
import { useFileStore, usePairStore } from "@/api/stores";
import {
  FileInterestingnessCalculator,
  FileScoring,
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
    const selectedSortOption = ref(sortOptions[0]);

    // Pagination.
    const page = ref(1);
    const pageTotal = computed(() => Math.ceil(filesList.value.length / 10));
    const pageAmount = 5;

    // Search filter.
    const search = ref("");

    // Calculator class for determining the score of a file.
    const scoringCalculator = computed(() => {
      return new FileInterestingnessCalculator(pairsList.value);
    });

    // Files with a score, sorted by the selected metric.
    const scoredFiles = computed(() =>
      filesList.value.map((file) =>
        scoringCalculator.value.calculateFileScoring(file)
      )
    );

    // Scored files to display (pagination/filtering)
    const scoredFilesDisplay = computed(() => {
      // Searching
      const scoredFilesSearch = scoredFiles.value.filter((file) =>
        file.file.path.toLowerCase().includes(search.value.toLowerCase())
      );

      // Pagination
      const start = (page.value - 1) * pageAmount;
      const end = start + pageAmount;
      return scoredFilesSearch.slice(start, end);
    });

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
