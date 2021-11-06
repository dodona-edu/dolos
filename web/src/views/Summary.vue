<template>
  <div>
    <SummaryCard/>
    <div class="d-flex align-center flex-column extra-margin">
      <FileCard v-for="scoredFile in scoredFiles.slice(0,10)" :key="scoredFile.file.id" :file="scoredFile"/>
    </div>
  </div>
</template>
<script lang="ts">
import { Component } from "vue-property-decorator";
import { FileScoring, FileInterestingnessCalculator } from "@/util/FileInterestingness";
import DataView from "@/views/DataView";
import SummaryCard from "@/components/SummaryCard.vue";
import FileCard from "@/components/FileCard.vue";

@Component({
  components: { SummaryCard, FileCard }
})
export default class Summary extends DataView {
  private scoredFiles: FileScoring[] = [];

  mounted(): void {
    this.initializeData();
  }

  async initializeData(): Promise<void> {
    await super.ensureData();
    const scoringCalculator = new FileInterestingnessCalculator(Array.from(Object.values(this.pairs)));
    const sortableFiles = Object.values(this.files).map(file => scoringCalculator.calculateFileScoring(file));
    sortableFiles.sort((a, b) => b.finalScore - a.finalScore);
    this.scoredFiles = sortableFiles;
  }
}
</script>

<style scoped>
.extra-margin {
  margin-top: 1.8rem;
}

.extra-margin * {
  margin: 1rem;
}
</style>
