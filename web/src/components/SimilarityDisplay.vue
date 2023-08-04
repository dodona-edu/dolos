<template>
  <span>
    <span v-if="text" class="similarity-value" :class="`text-${color}`">
      {{ value }}%
    </span>

    <v-progress-linear
      v-else-if="progress"
      v-model="value"
      :color="color"
      :height="props.dense ? 20 : 25"
      class="similarity-progress"
    >
      <strong :class="textClasses"> {{ value }}% </strong>
    </v-progress-linear>

    <v-progress-circular
      v-else
      :size="props.size"
      :width="3"
      :model-value="value"
      :color="color"
    >
      <span class="similarity-value"> {{ value }}% </span>
    </v-progress-circular>
  </span>
</template>

<script lang="ts" setup>
import { useApiStore } from "@/api/stores";
import { computed } from "vue";

interface Props {
  similarity: number;
  size?: number;
  text?: boolean;
  progress?: boolean;
  dense?: boolean;
  dimBelowCutoff?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 42,
  text: false,
  progress: false,
  dense: false,
});
const apiStore = useApiStore();

// Convert the similarity value into a percentage.
const value = computed(() => {
  return (props.similarity * 100).toFixed(0);
});

// Determine the color of the similarity value.
const color = computed(() => {
  if (props.dimBelowCutoff && props.similarity < apiStore.cutoff) {
    return "grey";
  } else if (props.similarity < 0.5 && !props.dimBelowCutoff) {
    return "success";
  } else if (props.similarity < 0.75) {
    return "warning";
  } else {
    return "error";
  }
});

// Classes for the text
const textClasses = computed(() => {
  return {
    "text-white": color.value === "error",
  };
});

// Font size
const fontSize = computed(() => {
  return props.text ? "1em" : `${props.size * 0.02}rem`;
});
</script>

<style lang="scss" scoped>
.similarity {
  &-value {
    font-size: v-bind("fontSize");
    font-weight: normal;
    font-weight: inherit;
  }

  &-progress {
    border-radius: 16px;
    width: 100px;
  }
}
</style>
