<template>
  <similarity-histogram
    :field="props.field"
    :ticks="25"
    :height="315"
    :calculate-bin-color="calculateBinColor"
    :line-value="lineValue ?? 0"
  />
</template>

<script lang="ts" setup>
import { File } from "@/api/models";
import { useFileStore } from "@/api/stores";
import { getLargestFieldOfScore } from "@/util/FileInterestingness";
import { storeToRefs } from "pinia";
import { computed } from "vue";

interface Props {
  field: "similarity" | "longestFragment" | "totalOverlap";
  file: File;
}
const props = withDefaults(defineProps<Props>(), {});
const { scoredFiles } = storeToRefs(useFileStore());

// Calculate the line value.
const lineValue = computed(() => {
  const score = scoredFiles.value.get(props.file);
  if (!score) return null;

  const field = getLargestFieldOfScore(score);
  if (!field) return null;

  const pair =
    field === "similarity"
      ? score.similarityScore?.pair
      : field === "totalOverlap"
        ? score.totalOverlapScore?.pair
        : score.longestFragmentScore?.pair;

  if (!pair) return null;

  if (props.field === "totalOverlap") {
    const covered = props.file.id === pair?.leftFile.id ? pair.leftCovered : pair?.rightCovered;
    return (covered ?? 0) / props.file.amountOfKgrams;
  }

  if (props.field === "longestFragment") {
    return (pair?.longestFragment ?? 0) / props.file.amountOfKgrams;
  }

  if (props.field === "similarity") {
    return pair?.similarity ?? 0;
  }

  return null;
});

// Calculate the bin color.
const calculateBinColor = (x0: number, x1: number): string => {
  const defaultColor = "#1976D2";
  const warningColor = "#ff5252";

  if (lineValue.value && (x0 || 0) < lineValue.value && (x1 || 0) >= lineValue.value) {
    return warningColor;
  }

  return defaultColor;
};
</script>
