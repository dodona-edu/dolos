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
import { useFileStore } from "@/stores/report";
import { getScoreOfField, ScoreField } from "@/util/FileInterestingness";
import { storeToRefs } from "pinia";
import { computed } from "vue";

interface Props {
  field: ScoreField;
  file: File;
}
const props = withDefaults(defineProps<Props>(), {});
const { scoredFiles } = storeToRefs(useFileStore());

// Value of the file for the field of the histogram.
const lineValue = computed(() => {
  const score = scoredFiles.value.get(props.file);
  return score ? getScoreOfField(score, props.field) : null;
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
