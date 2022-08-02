<template>
  <div style="width: 100%">
    <div v-if="currentFiles" class="compare-containers">
      <div class="side-container">
        <h3 class="fileTitle">{{ currentFiles.leftFile.shortPath }}</h3>
        <CompareSide
          :identifier="'left'"
          :file="currentFiles.leftFile"
          :language="'python'"
          :selections="[]"
          :hovering-selections="[]"
          :active-selections="[]"
          :selected-selections="[]"
          :semantic-matches="[]"
          :start-row="getMatchSpan(currentFiles.leftFile, match.leftMatch).startRow"
          :end-row="getMatchSpan(currentFiles.leftFile, match.leftMatch).endRow + 1"
        />
      </div>

      <div class="side-container">
        <h3 class="fileTitle">{{ currentFiles.rightFile.shortPath }}</h3>
        <CompareSide
          :identifier="'right'"
          :file="currentFiles.rightFile"
          :language="'python'"
          :selections="[]"
          :hovering-selections="[]"
          :active-selections="[]"
          :selected-selections="[]"
          :semantic-matches="[]"
          :start-row="getMatchSpan(currentFiles.rightFile, match.rightMatch).startRow"
          :end-row="getMatchSpan(currentFiles.rightFile, match.rightMatch).endRow + 1"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  shallowRef,
  watch,
  onMounted,
} from "vue";
import { FileScoring } from "@/util/FileInterestingness";
import {
  DecodedSemanticResult,
  PairedSemanticGroups,
  Region,
  SemanticAnalyzer,
} from "@dodona/dolos-lib";
import { File } from "@/api/models";
import { fileToTokenizedFile } from "@/api/utils";
import CompareSide from "../CompareSide.vue";

export default defineComponent({
  props: {
    file: {
      type: Object as PropType<FileScoring>,
      required: true,
    },
  },

  setup(props) {
    const currentFiles = shallowRef<{ leftFile: File; rightFile: File } | null>(null);
    const match = shallowRef<PairedSemanticGroups<DecodedSemanticResult>>();

    const getPairedMatch = (): void => {
      const node = props.file.semanticMatchScore;

      if (node) {
        match.value = node.pair.pairedMatches.reduce((a, b) =>
          a.leftMatch.childrenTotal > b.leftMatch.childrenTotal ? a : b
        );
        currentFiles.value = {
          leftFile: node.pair.leftFile,
          rightFile: node.pair.rightFile,
        };
      }
    };

    /**
     * This function serves to change detected regions so that they are neat in display for the summary cards
     */
    const normalizeRegion = (region: Region): Region => {
      region.endRow = Math.min(region.endRow, region.startRow + 20);

      if (region.endRow === region.startRow) {
        region.endRow += 1;
      }

      return region;
    };

    const getMatchSpan = (file: File, match: DecodedSemanticResult): Region => {
      const tokenized = fileToTokenizedFile(file);
      const r = SemanticAnalyzer.getFullRange(tokenized, match);
      return normalizeRegion(r);
    };

    watch(
      () => props.file,
      () => getPairedMatch()
    );
    onMounted(() => getPairedMatch());

    return {
      currentFiles,
      match,
      getMatchSpan,
      normalizeRegion,
    };
  },

  components: {
    CompareSide,
  },
});
</script>

<style>
.compare-containers {
  display: flex;
  font-size: 0.875rem;
  height: 100%;
}
.half-size {
  width: 80%;
  margin: 15px;
}

.side-container {
  width: 50%;
  height: 100%;
}

.fileTitle {
  text-align: center;
}
</style>
