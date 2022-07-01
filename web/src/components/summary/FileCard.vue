<template>
  <v-card v-if="file" class="file-card">
    <v-card-title>
      {{ fileName }}
    </v-card-title>
    <div class="d-flex justify-space-between reason-container">
      <!-- Similarity -->
      <div class="score-container">
        <FileCardScore :file="file" />
      </div>

      <!-- Aside with extra info -->
      <div>
        <v-alert
          border="left"
          color="blue-grey"
          dark
          v-if="file.file.extra && file.file.extra.fullName"
        >
          <span>Author: {{ file.file.extra.fullName }}</span>
          <br />
          <span>Handin Date: {{ fileTimestamp }}</span>
          <br />
          <span v-if="file.file.extra.labels">Labels: {{ file.file.extra.labels }}</span>
        </v-alert>
      </div>
    </div>

    <div>
      <v-tabs v-model="tab" grow>
        <v-tab href="#tab-0">Similarity</v-tab>
        <v-tab href="#tab-1">Longest Fragment</v-tab>
        <v-tab href="#tab-2">Total overlap</v-tab>
        <v-tab
          v-if="isSemantic"
          href="#tab-3"
          :disabled="file.semanticMatchScore === null"
        >
          Semantic Match
        </v-tab>
      </v-tabs>

      <v-tabs-items v-model="tab">
        <v-tab-item value="tab-0" :key="0">
          <div class="graph-wrapper">
            <PairStatHistogram
              pair-field="similarity"
              :numberOfTicks="25"
              :extraLine="getLineSpot('similarity')"
              :scored-files="scoredFiles"
            />
            <div class="more-info">
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon v-bind="attrs" v-on="on"> mdi-information </v-icon>
                </template>
                <span class="tooltip-span">
                  This tab of the card shows a bar chart of all the pairs in
                  this dataset. The similarity value of the pair of files this
                  card is about is marked by a line intersecting a bar with a
                  red color. This should help you see whether or not this pair
                  of files is exceptionally similar or not.<br />

                  The similarity metric is a global size-independent metric, and
                  often used as the main metric to measure how alike two files
                  are.
                </span>
              </v-tooltip>
            </div>
          </div>
        </v-tab-item>
        <v-tab-item value="tab-1" :key="1">
          <div class="graph-wrapper">
            <PairStatHistogram
              pair-field="longestFragment"
              :numberOfTicks="25"
              :extraLine="getLineSpot('longestFragment')"
              :scored-files="scoredFiles"
            />
          </div>
          <div class="more-info">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-icon v-bind="attrs" v-on="on"> mdi-information </v-icon>
              </template>
              <span class="tooltip-span">
                This tab of the card shows a bar chart of all the pairs in this
                dataset. The longest fragment value of the pair of files this
                card is about is marked by a line intersecting a bar with a red
                color. This should help you see whether or not this pair of
                files is exceptionally similar or not.<br />

                The longest consecutive fragment is a local size-independent
                metric, and roughly correlates to the longest amount of lines in
                one block that are the same in both files. If this is very high,
                then it's likely (part of) these files was literally copied.
              </span>
            </v-tooltip>
          </div>
          <div class="more-info">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-icon v-bind="attrs" v-on="on"> mdi-information </v-icon>
              </template>
              <span class="tooltip-span">
                This tab of the card shows a bar chart of all the pairs in this
                dataset. The longest fragment value of the pair of files this
                card is about is marked by a line intersecting a bar with a red
                color. This should help you see whether or not this pair of
                files is exceptionally similar or not.<br />

                The longest consecutive fragment is a local size-independent
                metric, and roughly correlates to the longest amount of lines in
                one block that are the same in both files. If this is very high,
                then it's likely (part of) these files was literally copied.
              </span>
            </v-tooltip>
          </div>
        </v-tab-item>
        <v-tab-item value="tab-2" :key="2">
          <div class="graph-wrapper">
            <PairStatHistogram
              pair-field="totalOverlap"
              :numberOfTicks="25"
              :extraLine="getLineSpot('totalOverlap')"
              :scored-files="scoredFiles"
            />
          </div>
        </v-tab-item>
        <v-tab-item value="tab-3" :key="3">
          <div style="width: 100%">
            <SummaryVisualisation :file="file" />
          </div>
          <div class="more-info">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-icon v-bind="attrs" v-on="on"> mdi-information </v-icon>
              </template>
              <span class="tooltip-span">
                This tab of the card shows a bar chart of all the pairs in this
                dataset. The total overlap value of the pair of files this card
                is about is marked by a line intersecting a bar with a red
                color. This should help you see whether or not this pair of
                files is exceptionally similar or not. <br />

                The total overlap is a global size-dependent metric of equality
                in the files. It roughly counts how many lines of both files are
                similiar.
              </span>
            </v-tooltip>
          </div>
          <div class="more-info">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-icon v-bind="attrs" v-on="on"> mdi-information </v-icon>
              </template>
              <span class="tooltip-span">
                This tab of the card shows a bar chart of all the pairs in this
                dataset. The total overlap value of the pair of files this card
                is about is marked by a line intersecting a bar with a red
                color. This should help you see whether or not this pair of
                files is exceptionally similar or not. <br />

                The total overlap is a global size-dependent metric of equality
                in the files. It roughly counts how many lines of both files are
                similiar.
              </span>
            </v-tooltip>
          </div>
        </v-tab-item>
      </v-tabs-items>
    </div>
  </v-card>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  computed,
  shallowRef,
  watch,
} from "@vue/composition-api";
import {
  FileScoring,
  getLargestFieldOfScore,
} from "@/util/FileInterestingness";
import { storeToRefs } from "pinia";
import { useSemanticStore } from "@/api/stores";
import SummaryVisualisation from "@/components/summary/SummaryVisualisation.vue";
import FileCardScore from "./FileCardScore.vue";
import PairStatHistogram from "./PairStatHistogram.vue";

export default defineComponent({
  props: {
    file: {
      type: Object as PropType<FileScoring>,
      required: true,
    },
    scoredFiles: {
      type: Array as PropType<FileScoring[]>,
      required: true,
    },
    selectedValue: {
      type: Number as PropType<number | null>,
      required: false,
    },
  },

  setup(props) {
    const { isSemantic } = storeToRefs(useSemanticStore());

    // Selected tab
    const tab = shallowRef<string>("");

    // Determine the best tab based on the field with the largest score.
    const bestTab = computed(() => {
      if (props.selectedValue) {
        return `tab-${props.selectedValue}`;
      }

      const tabOrder = [
        "similarity",
        "longestFragment",
        "totalOverlap",
        "semanticMatching",
      ];
      const largestField = getLargestFieldOfScore(props.file);
      return `tab-${tabOrder.indexOf(largestField)}`;
    });

    // When the best tab changes, update the tab.
    watch(
      () => bestTab.value,
      () => {
        tab.value = bestTab.value;
      },
      { immediate: true }
    );

    // Shorter file name for the file.
    // TODO: extract this to a composable and use on other locations (eg: filetable)
    const fileName = computed(() =>
      props.file.file.path.split("/").slice(-2).join("/")
    );

    // Timestamp text for the selected file.
    const fileTimestamp = computed(
      () => props.file.file.extra.timestamp?.toLocaleString() ?? "unknown"
    );

    const getLineSpot = (
      score: "totalOverlap" | "longestFragment" | "similarity"
    ): number => {
      const largestField = getLargestFieldOfScore(props.file);
      const pair =
        largestField === "similarity"
          ? props.file.similarityScore?.pair
          : largestField === "totalOverlap"
            ? props.file.totalOverlapScore?.pair
            : props.file.longestFragmentScore?.pair;

      if (score === "totalOverlap") {
        const covered =
          props.file.file.id === pair?.leftFile.id
            ? pair.leftCovered
            : pair?.rightCovered;
        return (covered ?? 0) / props.file.file.amountOfKgrams;
      }

      if (score === "longestFragment") {
        return (pair?.longestFragment ?? 0) / props.file.file.amountOfKgrams;
      }
      if (score === "similarity") {
        return pair?.similarity ?? 0;
      }

      return 0;
    };

    return {
      isSemantic,
      tab,
      bestTab,
      fileName,
      fileTimestamp,
      getLineSpot,
    };
  },

  components: {
    SummaryVisualisation,
    FileCardScore,
    PairStatHistogram,
  },
});
</script>

<style scoped>
.graph-wrapper {
  padding: 10px;
  margin-top: 20px;
  max-height: 500px;
}
.score-container {
  padding: 10px;
  padding-top: 0px;
}
.reason-container {
  padding: 20px;
}

.more-info {
  position: absolute;
  right: 30px;
  top: 0;
}

.tooltip-span {
  display: block;
  max-width: 400px;
}
</style>
