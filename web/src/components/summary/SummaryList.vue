<template>
  <div class="d-flex align-center flex-column extra-margin">
    <v-form class="d-flex align-center flex-row extra-width">
      <v-text-field class="search-field" :label="'Search for a file'" v-model="searchString" ref="toScroll">
      </v-text-field>
      <v-select
      class='select-sort'
        :items="sortOptions"
        item-text="name"
        :item-value="v => v"
        v-model="selectedSortOption"
      ></v-select>
    </v-form>
    <div class="d-flex align-center flex-column full-width">
      <FileCard
        v-for="scoredFile in sortedFiles.slice(
          (page - 1) * cardsPerPage,
          page * cardsPerPage
        )"
        :key="scoredFile.file.id"
        :file="scoredFile"
      />
    </div>
    <v-btn color="success"  @click="page += 1">Next Cards</v-btn>
    <v-pagination
      v-model="page"
      :length="pageTotal"
      :total-visible="7"
    ></v-pagination>
  </div>
</template>
<script lang="ts">
import { Component, Watch, Vue } from "vue-property-decorator";
import {
  FileScoring,
  FileInterestingnessCalculator,
  getLargestPairOfScore,
} from "@/util/FileInterestingness";
import FileCard from "@/components/summary/FileCard.vue";
import DataView from "@/views/DataView";
import { Pair } from "@/api/api";

@Component({ components: { FileCard } })
export default class SummaryList extends DataView {
  private scoredFiles: FileScoring[] = [];
  private sortedFiles: FileScoring[] = [];
  private page = 1;
  private pageTotal = 1;
  private cardsPerPage = 5;
  private searchString = "";

  private sortOptions = [
    {
      name: "Most interesting items",
      sortFunc: (a: FileScoring, b: FileScoring) => b.finalScore - a.finalScore,
    },
    {
      name: "Highest similarity",
      sortFunc: (a: FileScoring, b: FileScoring) =>
        (b.similarityScore?.similarity || 0) - (a.similarityScore?.similarity || 0),
    },
  ];

  private selectedSortOption: {
    name: string;
    sortFunc: (a: FileScoring, b: FileScoring) => number;
  };

  constructor() {
    super();
    this.selectedSortOption = this.sortOptions[0];
  }

  @Watch("scoredFiles")
  updatePageCount(): void {
    this.page = 1;
    this.pageTotal =
      Math.ceil(this.scoredFiles.length / this.cardsPerPage) || 1;
  }

  @Watch("scoredFiles")
  @Watch("searchString")
  @Watch("selectedSortOption")
  sortAndFilterScoredFiles(): void {
    const sorted = this.scoredFiles
      .filter(f => f.file.path.includes(this.searchString))
      .sort(this.selectedSortOption.sortFunc);

    // Deduplicate the pairs. This avoids having the same pair from different perspectives multiple times
    this.sortedFiles = [];
    const pairSet = new Set<Pair>();
    for (const scF of sorted) {
      const p = getLargestPairOfScore(scF);
      if (p && !pairSet.has(p)) {
        this.sortedFiles.push(scF);
        pairSet.add(p);
      }
    }
  }

  mounted(): void {
    this.initializeData();
  }

  async initializeData(): Promise<void> {
    await super.ensureData();
    const scoringCalculator = new FileInterestingnessCalculator(
      Array.from(Object.values(this.pairs))
    );
    const sortableFiles = Object.values(this.files).map(file =>
      scoringCalculator.calculateFileScoring(file)
    );
    this.scoredFiles = sortableFiles;
  }

  @Watch("page")
  onPageChange(): void {
    console.log(this.$refs.toScroll);

    ((this.$refs.toScroll as Vue).$el as Element)?.scrollIntoView();
  }
}
</script>
<style scoped>
.extra-margin * {
  margin: 1rem;
}

.full-width {
  min-width: 1000px;
  width: 100%;
}

.extra-width {
  width: 60%;
}

.search-field {
  width: 45%;
}

.select-sort {
  width: 15%;
}
</style>
